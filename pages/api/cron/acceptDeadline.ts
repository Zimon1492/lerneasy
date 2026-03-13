// pages/api/cron/acceptDeadline.ts
// Läuft täglich – storniert Buchungen, die nach 6 Tagen nicht bestätigt wurden
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { stripe } from "../../../lib/stripe";
import nodemailer from "nodemailer";
import { logError } from "@/app/lib/logError";
import { escapeHtml } from "@/app/lib/escapeHtml";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // On Vercel, CRON_SECRET is set and Vercel sends it as a Bearer token.
  // Locally CRON_SECRET is not set, so the check is skipped entirely.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

    // ── 1. Auto-cancel: unaccepted bookings whose lesson time has already passed ──
    const pastUnaccepted = await prisma.booking.findMany({
      where: {
        start: { lt: now },
        status: { in: ["pending", "checkout_started", "payment_method_saved"] },
      },
      include: {
        student: { select: { email: true, name: true } },
        teacher: { select: { name: true } },
      },
    });

    for (const booking of pastUnaccepted) {
      if (booking.stripePaymentMethodId) {
        await stripe.paymentMethods.detach(booking.stripePaymentMethodId).catch(() => null);
      }
      if (booking.student?.email) {
        await sendMail(
          booking.student.email,
          "Dein Termin wurde automatisch abgelehnt",
          `<h2>Dein Nachhilfetermin wurde automatisch storniert</h2>
           <p>Hallo ${escapeHtml(booking.student.name || "")},</p>
           <p>Dein Terminwunsch bei <b>${escapeHtml(booking.teacher?.name || "deinem Lehrer")}</b> wurde vom Lehrer nicht rechtzeitig angenommen und wurde daher automatisch storniert.</p>
           <p>Deine Zahlungsdaten wurden vollständig aus unserem System gelöscht.</p>
           <p>Bitte buche einen neuen Termin.</p>
           <p>Viele Grüße,<br/>dein LernApp-Team</p>`
        ).catch((err) => console.error("Mail error for", booking.student?.email, err));
      }
    }

    const pastCanceled = await prisma.booking.updateMany({
      where: {
        start: { lt: now },
        status: { in: ["pending", "checkout_started", "payment_method_saved"] },
      },
      data: {
        status: "canceled_by_system",
        stripePaymentMethodId: null,
        stripeCustomerId: null,
        stripeSetupIntentId: null,
      },
    });

    // ── 2. Auto-cancel: bookings older than 6 days with no action ──
    const expired = await prisma.booking.findMany({
      where: {
        createdAt: { lt: cutoff },
        status: { in: ["pending", "checkout_started", "payment_method_saved"] },
      },
      include: {
        student: { select: { email: true, name: true } },
        teacher: { select: { name: true } },
      },
    });

    for (const booking of expired) {
      // Zahlungsmethode bei Stripe löschen
      if (booking.stripePaymentMethodId) {
        await stripe.paymentMethods.detach(booking.stripePaymentMethodId).catch(() => null);
      }

      // E-Mail an Schüler
      if (booking.student?.email) {
        await sendMail(
          booking.student.email,
          "Dein Termin ist abgelaufen",
          `<h2>Dein Nachhilfetermin wurde automatisch storniert</h2>
           <p>Hallo ${escapeHtml(booking.student.name || "")},</p>
           <p>Dein Terminwunsch bei <b>${escapeHtml(booking.teacher?.name || "deinem Lehrer")}</b> wurde innerhalb von 6 Tagen nicht bestätigt und wurde deshalb automatisch storniert.</p>
           <p>Deine Zahlungsdaten wurden vollständig aus unserem System gelöscht.</p>
           <p>Bitte buche einen neuen Termin.</p>
           <p>Viele Grüße,<br/>dein LernApp-Team</p>`
        ).catch((err) => console.error("Mail error for", booking.student?.email, err));
      }
    }

    // Alle auf einmal als canceled_by_system markieren + Stripe-Daten löschen
    const updated = await prisma.booking.updateMany({
      where: {
        createdAt: { lt: cutoff },
        status: { in: ["pending", "checkout_started", "payment_method_saved"] },
      },
      data: {
        status: "canceled_by_system",
        stripePaymentMethodId: null,
        stripeCustomerId: null,
        stripeSetupIntentId: null,
      },
    });

    // ── 3. Reminder emails: paid bookings starting in the next 24 hours ──
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const upcoming = await prisma.booking.findMany({
      where: {
        status: "paid",
        start: { gt: now, lte: in24h },
        reminderSentAt: null,
      },
      include: {
        student: { select: { email: true, name: true } },
        teacher: { select: { email: true, name: true } },
      },
    });

    for (const booking of upcoming) {
      const startStr = new Date(booking.start).toLocaleString("de-AT");
      const sends: Promise<any>[] = [];

      if (booking.student?.email) {
        sends.push(
          sendMail(
            booking.student.email,
            "Erinnerung: Deine Nachhilfestunde morgen",
            `<h2>Erinnerung an deinen Termin</h2>
             <p>Hallo ${escapeHtml(booking.student.name || "")},</p>
             <p>Deine Nachhilfestunde bei <b>${escapeHtml(booking.teacher?.name || "deinem Lehrer")}</b> findet morgen am <b>${escapeHtml(startStr)}</b> statt.</p>
             <p>Viele Grüße,<br/>dein LernApp-Team</p>`
          ).catch(() => {})
        );
      }
      if (booking.teacher?.email) {
        sends.push(
          sendMail(
            booking.teacher.email,
            "Erinnerung: Nachhilfestunde morgen",
            `<h2>Erinnerung an deinen Termin</h2>
             <p>Hallo ${escapeHtml(booking.teacher.name || "")},</p>
             <p>Deine Nachhilfestunde mit <b>${escapeHtml(booking.student?.name || "einem Schüler")}</b> findet morgen am <b>${escapeHtml(startStr)}</b> statt.</p>
             <p>Viele Grüße,<br/>dein LernApp-Team</p>`
          ).catch(() => {})
        );
      }

      await Promise.all(sends);
      await prisma.booking.update({
        where: { id: booking.id },
        data: { reminderSentAt: now },
      });
    }

    // ── 4. Delete error logs older than 90 days (DSGVO promise) ──
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const deletedLogs = await prisma.errorLog.deleteMany({
      where: { createdAt: { lt: ninetyDaysAgo } },
    });

    res.json({
      success: true,
      message: `${pastCanceled.count} past-unaccepted canceled, ${updated.count} expired canceled, ${upcoming.length} reminders sent, ${deletedLogs.count} error logs deleted.`,
      canceledBookings: [...pastUnaccepted.map((b: { id: string }) => b.id), ...expired.map((b: { id: string }) => b.id)],
    });
  } catch (err: any) {
    logError("pages/api/cron/acceptDeadline", err).catch(() => {});
    console.error("Cronjob error:", err);
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
