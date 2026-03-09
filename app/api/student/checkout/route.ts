import { NextResponse } from "next/server";
import { getStudentSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getStudentSession();

  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const { bookingId } = await req.json();
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId fehlt." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.email },
  });
  if (!user) {
    return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.studentId !== user.id) {
    return NextResponse.json({ error: "Buchung nicht gefunden." }, { status: 404 });
  }

  // Stripe Customer erstellen oder wiederverwenden
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: customerId,
    payment_method_types: ["card"],
    success_url: `${baseUrl}/student/payments?success=1&booking=${bookingId}`,
    cancel_url: `${baseUrl}/student/payments?cancelled=1`,
    metadata: { bookingId },
  });

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "checkout_started",
      stripeCustomerId: customerId,
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
