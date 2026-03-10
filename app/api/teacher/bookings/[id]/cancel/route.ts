import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/app/lib/prisma";
import { stripe } from "@/lib/stripe";
import nodemailer from "nodemailer";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || (session.user as any).role !== "teacher") {
      return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
    }

    const { id: bookingId } = await params;

    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true },
    });
    if (!teacher) return NextResponse.json({ error: "Lehrer nicht gefunden." }, { status: 404 });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { student: { select: { email: true, name: true } } },
    });

    if (!booking) return NextResponse.json({ error: "Buchung nicht gefunden." }, { status: 404 });
    if (booking.teacherId !== teacher.id) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }
    if (booking.status !== "paid") {
      return NextResponse.json({ error: "Nur bezahlte Buchungen können storniert werden." }, { status: 400 });
    }

    // Issue Stripe refund
    let refundId: string | null = null;
    if (booking.stripePaymentIntentId) {
      const refund = await stripe.refunds.create({
        payment_intent: booking.stripePaymentIntentId,
      });
      refundId = refund.id;
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "teacher_cancelled" },
    });

    // Email student about cancellation and refund
    if (booking.student?.email) {
      sendMail(
        booking.student.email,
        "Dein Termin wurde abgesagt – Rückerstattung veranlasst",
        `<h2>Dein Termin wurde abgesagt</h2>
         <p>Hallo ${booking.student.name || ""},</p>
         <p>Leider hat <b>${teacher.name}</b> deinen Termin am <b>${new Date(booking.start).toLocaleString("de-AT")}</b> abgesagt.</p>
         <p>Der Betrag von <b>&euro;${(booking.priceCents / 100).toFixed(2)}</b> wird innerhalb von 5–10 Werktagen auf deine Karte zurückgebucht.</p>
         <p>Wir entschuldigen uns für die Unannehmlichkeiten.</p>
         <p>Viele Grüße,<br/>dein LernEasy-Team</p>`
      ).catch(() => {});
    }

    return NextResponse.json({ ok: true, refundId });
  } catch (err) {
    logError("api/teacher/bookings/[id]/cancel POST", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

async function sendMail(to: string, subject: string, html: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({ from: process.env.FROM_EMAIL, to, subject, html });
}
