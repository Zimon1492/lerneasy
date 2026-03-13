import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/app/lib/prisma";
import { stripe } from "@/lib/stripe";
import { logError } from "@/app/lib/logError";
import { createStornobeleg } from "@/app/lib/invoiceUtils";
import { sendStornobeleg } from "@/app/lib/mailer";

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

    // Stripe-Rückerstattung auslösen
    let refundId: string | null = null;
    if (booking.stripePaymentIntentId) {
      const refund = await stripe.refunds.create({
        payment_intent: booking.stripePaymentIntentId,
      });
      refundId = refund.id;
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "teacher_cancelled", stripeRefundId: refundId },
    });

    // Stornobeleg erstellen und per E-Mail versenden
    const stornobeleg = await createStornobeleg(bookingId, refundId).catch(() => null);

    if (stornobeleg && booking.student?.email) {
      sendStornobeleg({
        to:               booking.student.email,
        invoiceNumber:    stornobeleg.invoiceNumber,
        issuerName:       stornobeleg.issuerName,
        issuerAddress:    stornobeleg.issuerAddress,
        issuerUid:        stornobeleg.issuerUid,
        studentName:      stornobeleg.studentName,
        teacherName:      stornobeleg.teacherName,
        subject:          stornobeleg.subject,
        serviceDate:      stornobeleg.serviceDate,
        serviceStartTime: stornobeleg.serviceStartTime,
        serviceEndTime:   stornobeleg.serviceEndTime,
        durationMinutes:  stornobeleg.durationMinutes,
        priceCents:       stornobeleg.priceCents,
        currency:         stornobeleg.currency,
        stripeRefundId:   stornobeleg.stripeRefundId,
        issuedAt:         stornobeleg.issuedAt,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, refundId });
  } catch (err) {
    logError("api/teacher/bookings/[id]/cancel POST", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
