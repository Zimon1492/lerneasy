// pages/api/bookings/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import { stripe } from "../../../lib/stripe";
import { logError } from "@/app/lib/logError";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email || (session.user as any).role !== "student") {
    return res.status(401).json({ error: "Nicht eingeloggt." });
  }

  try {
    const { teacherId, start, end, availabilityId, priceCents } = req.body;

    if (!teacherId || !start || !end) {
      return res.status(400).json({ error: "teacherId, start und end sind Pflicht." });
    }

    // 1) Teacher muss existieren
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true },
    });
    if (!teacher) return res.status(404).json({ error: "Lehrer nicht gefunden." });

    // 2) Student aus Session holen (kein Spoofing möglich)
    const student = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true },
    });
    if (!student) return res.status(404).json({ error: "Schüler nicht gefunden." });

    // 3) Booking anlegen (pending, noch kein Stripe)
    const booking = await prisma.booking.create({
      data: {
        studentId: student.id,
        teacherId: teacher.id,
        start: new Date(start),
        end: new Date(end),
        priceCents: priceCents ?? 5000,
        currency: "eur",
        status: "pending",
        availabilityId: availabilityId || null,
      },
    });

    // 4) Stripe Checkout Session (setup mode – Karte speichern, noch nicht belasten)
    const stripeSession = await stripe.checkout.sessions.create({
      mode: "setup",
      customer_creation: "always",
      customer_email: student.email,
      payment_method_types: ["card", "sepa_debit"],
      success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/success?booking=${booking.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/cancel?booking=${booking.id}`,
      metadata: { bookingId: booking.id },
    });

    // 5) Status auf checkout_started aktualisieren
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "checkout_started" },
    });

    res.status(200).json({ url: stripeSession.url, bookingId: booking.id });
  } catch (err: any) {
    logError("pages/api/bookings/create POST", err).catch(() => {});
    console.error("POST /api/bookings/create error:", err);
    res.status(500).json({ error: err.message });
  }
}
