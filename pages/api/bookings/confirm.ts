// pages/api/bookings/confirm.ts
// Lehrer bestätigt den Termin → Karte wird belastet
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import { stripe } from "../../../lib/stripe";
import nodemailer from "nodemailer";
import { logError } from "@/app/lib/logError";
import { escapeHtml } from "@/app/lib/escapeHtml";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { bookingId } = req.body;
  if (!bookingId) return res.status(400).json({ error: "bookingId fehlt" });

  // Auth: only the teacher who owns the booking may confirm it
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

    if (booking.status !== "payment_method_saved") {
      return res.status(400).json({ error: "Zahlungsmethode noch nicht gespeichert." });
    }

    // 1) Karte sofort belasten (idempotency key verhindert Doppelabbuchungen bei Netzwerkfehlern)
    const pi = await stripe.paymentIntents.create(
      {
        amount: booking.priceCents,
        currency: booking.currency,
        customer: booking.stripeCustomerId!,
        payment_method: booking.stripePaymentMethodId!,
        off_session: true,
        confirm: true,
        transfer_group: booking.id,
      },
      { idempotencyKey: `confirm-${bookingId}` }
    );

    // 2) Status auf "paid" + Availability-Slot freigeben (in Transaction)
    await prisma.$transaction(async (tx: any) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "paid", stripePaymentIntentId: pi.id },
      });
      if (booking.availabilityId) {
        await tx.availability
          .delete({ where: { id: booking.availabilityId } })
          .catch(() => null);
      }
    });

    // 3) Bestätigungs-E-Mail an Schüler (Fehler hier darf nicht die Response zerstören)
    if (booking.student?.email) {
      sendMail(
        booking.student.email,
        "Dein Termin wurde bestätigt!",
        `<h2>Dein Nachhilfetermin wurde bestätigt!</h2>
         <p>Hallo ${escapeHtml(booking.student.name || "")},</p>
         <p>Dein Lehrer <b>${escapeHtml(booking.teacher?.name ?? "")}</b> hat deinen Termin angenommen.</p>
         <p><b>Termin:</b> ${new Date(booking.start).toLocaleString("de-AT")} &ndash; ${new Date(booking.end).toLocaleTimeString("de-AT")}</p>
         <p>Der Betrag von <b>&euro;${(booking.priceCents / 100).toFixed(2)}</b> wurde von deiner Karte abgebucht.</p>
         <p>Viele Grüße,<br/>dein LernApp-Team</p>`
      ).catch((mailErr) => console.error("Bestätigungsmail fehlgeschlagen:", mailErr));
    }

    // 4) Chat zwischen Lehrer und Schüler – nur erstellen wenn noch keiner existiert
    const studentEmail = booking.student?.email;
    if (studentEmail) {
      const existingChat = await prisma.chat.findFirst({
        where: { teacherId: booking.teacherId, studentEmail },
        select: { id: true },
      });

      if (!existingChat) {
        await prisma.chat.create({
          data: {
            teacherId: booking.teacherId,
            studentEmail,
            bookingId: booking.id,
          },
        });
      }
    }

    return res.json({ ok: true });
  } catch (err: any) {
    logError("pages/api/bookings/confirm POST", err).catch(() => {});
    console.error("POST /api/bookings/confirm error:", err);
    // Nur auf payment_failed setzen wenn die Karte NICHT belastet wurde
    if (!err?.stripePaymentIntentId) {
      await prisma.booking
        .update({ where: { id: bookingId }, data: { status: "payment_failed" } })
        .catch(() => null);
    }
    return res.status(400).json({ error: err.message });
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
