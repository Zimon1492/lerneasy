import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/app/lib/prisma";
import { stripe } from "@/lib/stripe";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

// GET — returns current Connect account status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || (session.user as any).role !== "teacher") {
      return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email },
      select: { id: true, stripeConnectAccountId: true, stripeConnectOnboarded: true },
    });
    if (!teacher) return NextResponse.json({ error: "Lehrer nicht gefunden." }, { status: 404 });

    let onboarded = teacher.stripeConnectOnboarded;

    // If we have an account ID but not yet marked onboarded, check live status from Stripe
    if (teacher.stripeConnectAccountId && !onboarded) {
      try {
        const account = await stripe.accounts.retrieve(teacher.stripeConnectAccountId);
        if (account.charges_enabled && account.payouts_enabled) {
          onboarded = true;
          await prisma.teacher.update({
            where: { id: teacher.id },
            data: { stripeConnectOnboarded: true },
          });
        }
      } catch {
        // ignore Stripe errors here; just return current DB state
      }
    }

    return NextResponse.json({
      stripeConnectAccountId: teacher.stripeConnectAccountId ?? null,
      onboarded,
    });
  } catch (err) {
    logError("api/teacher/stripe-connect GET", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

// POST — create (or refresh) Stripe Express onboarding link
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || (session.user as any).role !== "teacher") {
      return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email },
      select: { id: true, stripeConnectAccountId: true, email: true },
    });
    if (!teacher) return NextResponse.json({ error: "Lehrer nicht gefunden." }, { status: 404 });

    let accountId = teacher.stripeConnectAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: teacher.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
      });
      accountId = account.id;
      await prisma.teacher.update({
        where: { id: teacher.id },
        data: { stripeConnectAccountId: accountId },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/teacher/payments?stripeRefresh=1`,
      return_url: `${baseUrl}/teacher/payments?stripeReturn=1`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("POST /api/teacher/stripe-connect error:", err);
    logError("api/teacher/stripe-connect POST", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
