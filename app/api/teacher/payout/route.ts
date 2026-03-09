import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/app/lib/prisma";
import { stripe } from "@/lib/stripe";
import { logError } from "@/app/lib/logError";
import { getPlatformSettings } from "@/app/lib/settings";

export const runtime = "nodejs";

// GET — returns balance info and payout history
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || (session.user as any).role !== "teacher") {
      return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        stripeConnectAccountId: true,
        stripeConnectOnboarded: true,
        payouts: {
          orderBy: { createdAt: "desc" },
          select: { id: true, amountCents: true, stripeTransferId: true, createdAt: true },
        },
      },
    });
    if (!teacher) return NextResponse.json({ error: "Lehrer nicht gefunden." }, { status: 404 });

    const now = new Date();

    // Completed lessons: paid + end time already passed
    const completedBookings = await prisma.booking.findMany({
      where: { teacherId: teacher.id, status: "paid", end: { lt: now } },
      select: { priceCents: true },
    });

    const { teacherShare } = await getPlatformSettings();
    const earnedCents = completedBookings.reduce(
      (sum, b) => sum + Math.floor(b.priceCents * teacherShare),
      0
    );

    const paidOutCents = teacher.payouts.reduce((sum, p) => sum + p.amountCents, 0);
    const availableCents = Math.max(0, earnedCents - paidOutCents);

    return NextResponse.json({
      onboarded: teacher.stripeConnectOnboarded,
      stripeConnectAccountId: teacher.stripeConnectAccountId ?? null,
      earnedCents,
      paidOutCents,
      availableCents,
      payouts: teacher.payouts,
    });
  } catch (err) {
    logError("api/teacher/payout GET", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

// POST — trigger a payout (Stripe Transfer to teacher's Connect account)
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || (session.user as any).role !== "teacher") {
      return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        stripeConnectAccountId: true,
        stripeConnectOnboarded: true,
        payouts: { select: { amountCents: true } },
      },
    });
    if (!teacher) return NextResponse.json({ error: "Lehrer nicht gefunden." }, { status: 404 });

    if (!teacher.stripeConnectAccountId || !teacher.stripeConnectOnboarded) {
      return NextResponse.json(
        { error: "Kein Stripe-Konto verbunden." },
        { status: 400 }
      );
    }

    const now = new Date();
    const completedBookings = await prisma.booking.findMany({
      where: { teacherId: teacher.id, status: "paid", end: { lt: now } },
      select: { priceCents: true },
    });

    const { teacherShare } = await getPlatformSettings();
    const earnedCents = completedBookings.reduce(
      (sum, b) => sum + Math.floor(b.priceCents * teacherShare),
      0
    );
    const paidOutCents = teacher.payouts.reduce((sum, p) => sum + p.amountCents, 0);
    const availableCents = Math.max(0, earnedCents - paidOutCents);

    if (availableCents <= 0) {
      return NextResponse.json({ error: "Kein Guthaben verfügbar." }, { status: 400 });
    }

    const transfer = await stripe.transfers.create({
      amount: availableCents,
      currency: "eur",
      destination: teacher.stripeConnectAccountId,
      description: `Auszahlung für Lehrer ${session.user.email}`,
    });

    await prisma.teacherPayout.create({
      data: {
        teacherId: teacher.id,
        amountCents: availableCents,
        stripeTransferId: transfer.id,
      },
    });

    return NextResponse.json({ ok: true, amountCents: availableCents, transferId: transfer.id });
  } catch (err) {
    logError("api/teacher/payout POST", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
