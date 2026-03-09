import { NextResponse } from "next/server";
import { getStudentSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { stripe } from "@/lib/stripe";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

const CANCELLABLE_STATUSES = ["pending", "checkout_started", "payment_method_saved"];

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getStudentSession();
    if (!session) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });

    const { id: bookingId } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { student: { select: { email: true } } },
    });

    if (!booking) return NextResponse.json({ error: "Buchung nicht gefunden." }, { status: 404 });
    if (booking.student.email !== session.email) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }
    if (!CANCELLABLE_STATUSES.includes(booking.status)) {
      return NextResponse.json(
        { error: "Diese Buchung kann nicht mehr storniert werden." },
        { status: 400 }
      );
    }

    // Detach payment method from Stripe if saved
    if (booking.stripePaymentMethodId) {
      await stripe.paymentMethods.detach(booking.stripePaymentMethodId).catch(() => null);
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "student_cancelled",
        stripePaymentMethodId: null,
        stripeCustomerId: null,
        stripeSetupIntentId: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError("api/student/bookings/[id]/cancel POST", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
