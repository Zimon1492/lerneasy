// pages/api/bookings/decline.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import { stripe } from "../../../lib/stripe";
import nodemailer from "nodemailer";
import { logError } from "@/app/lib/logError";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { bookingId } = req.body;
  if (!bookingId) return res.status(400).json({ error: "bookingId fehlt" });

  // Auth: only the teacher who owns the booking may decline it
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email || (session.user as any).role !== "teacher") {
    return res.status(401).json({ error: "Nicht eingeloggt." });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: { select: { email: true, name: true } },
        teacher: { select: { name: true, email: true } },
      },
    });

    if (!booking) return res.status(404).json({ error: "Booking nicht gefunden" });

    if (booking.teacher?.email !== session.user.email) {
      return res.status(403).json({ error: "Keine Berechtigung." });
    }

    // 1) Zahlungsmethode bei Stripe löschen
    if (booking.stripePaymentMethodId) {
      await stripe.paymentMethods.detach(booking.stripePaymentMethodId).catch(() => null);
    }

    // 2) Booking als declined markieren + Stripe-Daten löschen
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "declined",
        stripePaymentMethodId: null,
        stripeCustomerId: null,
        stripeSetupIntentId: null,
      },
    });

    // 3) E-Mail an Schüler
    if (booking.student?.email) {
      await sendMail(
        booking.student.email,
        "Dein Termin wurde leider abgelehnt",
        `<h2>Dein Nachhilfetermin wurde abgelehnt</h2>
         <p>Hallo ${booking.student.name || ""},</p>
         <p>Leider hat <b>${booking.teacher?.name}</b> deinen Terminwunsch abgelehnt.</p>
         <p>Deine Zahlungsdaten wurden vollständig aus unserem System gelöscht.</p>
         <p>Bitte suche dir einen anderen Lehrer oder wähle einen anderen Termin.</p>
         <p>Viele Grüße,<br/>dein LernApp-Team</p>`
      );
    }

    return res.json({ ok: true });
  } catch (err: any) {
    logError("pages/api/bookings/decline POST", err).catch(() => {});
    console.error("POST /api/bookings/decline error:", err);
    return res.status(500).json({ error: err.message });
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
