// app/api/bookings/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";
import { rateLimit } from "@/lib/rateLimit";
import { calcPriceCents } from "@/app/lib/pricing";
import { getPlatformSettings } from "@/app/lib/settings";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

function isValidISODateTime(value: string) {
  return typeof value === "string" && value.includes("T");
}

export async function POST(req: Request) {
  // Rate limit: max 10 booking attempts per IP per 10 minutes
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`booking:${ip}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Zu viele Anfragen. Bitte warte kurz." }, { status: 429 });
  }

  try {
    const body = await req.json();

    const teacherId = body?.teacherId as string | undefined;
    const studentEmailRaw = body?.studentEmail as string | undefined;
    const studentEmail = studentEmailRaw?.trim().toLowerCase();
    const studentName = body?.studentName as string | undefined;
    const start = body?.start as string | undefined;
    const end = body?.end as string | undefined;

    const noteRaw = body?.note as string | undefined;
    const note = noteRaw?.trim() ? noteRaw.trim() : null;

    // ✅ vom Frontend kommt availabilityId bereits
    const availabilityId = body?.availabilityId as string | undefined;

    if (!teacherId || !studentEmail || !start || !end) {
      return NextResponse.json(
        { error: "teacherId, studentEmail, start oder end fehlt" },
        { status: 400 }
      );
    }

    if (!isValidISODateTime(start) || !isValidISODateTime(end)) {
      return NextResponse.json(
        { error: "start/end müssen ISO DateTime sein (z.B. 2026-02-02T12:22:00)" },
        { status: 400 }
      );
    }

    // 0a) Mindestdauer: 30 Minuten
    const startMs = new Date(start).getTime();
    const endMs   = new Date(end).getTime();
    if (endMs - startMs < 30 * 60 * 1000) {
      return NextResponse.json(
        { error: "Die Buchung muss mindestens 30 Minuten dauern." },
        { status: 400 }
      );
    }

    // 0b) Datum-Check: frühestens morgen buchbar
    const todayMidnight = new Date();
    todayMidnight.setHours(23, 59, 59, 999);
    if (new Date(start) <= todayMidnight) {
      return NextResponse.json(
        { error: "Buchungen sind frühestens für morgen möglich." },
        { status: 400 }
      );
    }

    // 1) Teacher muss existieren (inkl. Bewertungsdaten für Preisberechnung)
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        ratings: { select: { stars: true } },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher nicht gefunden" }, { status: 404 });
    }

    // 2) Slot validieren (wenn gesetzt)
    if (availabilityId) {
      const slot = await prisma.availability.findUnique({
        where: { id: availabilityId },
        select: { id: true, teacherId: true },
      });

      if (!slot || slot.teacherId !== teacher.id) {
        return NextResponse.json(
          { error: "Zeitfenster nicht gefunden oder gehört nicht zu diesem Lehrer" },
          { status: 404 }
        );
      }
    }

    // 3) Überschneidungs-Check: hat der Lehrer bereits eine aktive Buchung in diesem Zeitraum?
    const startDate = new Date(start);
    const endDate = new Date(end);

    const ACTIVE_STATUSES = [
      "pending",
      "checkout_started",
      "payment_method_saved",
      "paid",
    ];

    const overlap = await prisma.booking.findFirst({
      where: {
        teacherId: teacher.id,
        status: { in: ACTIVE_STATUSES },
        start: { lt: endDate },
        end: { gt: startDate },
      },
      select: { id: true, start: true, end: true },
    });

    if (overlap) {
      const fmt = (d: Date) =>
        d.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
      return NextResponse.json(
        {
          error: `Dieser Zeitraum überschneidet sich mit einer bestehenden Buchung (${fmt(overlap.start)}–${fmt(overlap.end)}). Bitte wähle einen anderen Zeitpunkt.`,
        },
        { status: 409 }
      );
    }

    // 4) Student finden oder anlegen
    const existingUser = await prisma.user.findUnique({ where: { email: studentEmail }, select: { id: true } });

    const student = await prisma.user.upsert({
      where: { email: studentEmail },
      update: { name: studentName ?? undefined },
      create: {
        email: studentEmail,
        password: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
        name: studentName ?? null,
        role: "student",
      },
      select: { id: true, email: true },
    });

    if (!existingUser) {
      // Generate a password reset token so the new student can set their own password
      const resetToken = crypto.randomBytes(32).toString("hex");
      await prisma.userPasswordResetToken.create({
        data: {
          token: resetToken,
          userId: student.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      sendWelcomeMail(studentEmail, studentName ?? "", `${baseUrl}/student/set-password?token=${resetToken}`).catch(() => {});
    }

    // 5) Preis berechnen: dynamisch nach Bewertungsformel
    const ratingCount = teacher.ratings.length;
    const avgRating =
      ratingCount > 0
        ? teacher.ratings.reduce((s, r) => s + r.stars, 0) / ratingCount
        : null;
    const durationMinutes = (endDate.getTime() - startDate.getTime()) / 60_000;
    const settings = await getPlatformSettings();
    const priceCents = calcPriceCents(durationMinutes, ratingCount, avgRating, settings.priceMin, settings.priceMax, settings.priceN);

    // 6) Booking erstellen
    const booking = await prisma.booking.create({
      data: {
        teacherId: teacher.id,
        studentId: student.id,
        start: startDate,
        end: endDate,
        priceCents,
        currency: "eur",
        status: "pending",
        note,
        availabilityId: availabilityId || null,
      },
      select: { id: true, status: true, priceCents: true },
    });

    return NextResponse.json({ ok: true, booking });
  } catch (err: any) {
    logError("app/api/bookings POST", err).catch(() => {});
    console.error("POST /api/bookings error:", err);

    if (err?.code === "P2003") {
      return NextResponse.json(
        { error: "Foreign Key Fehler: teacherId oder studentId existiert nicht." },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

async function sendWelcomeMail(to: string, name: string, setPasswordUrl: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject: "Willkommen bei LernApp – Passwort festlegen",
    html: `
      <h2>Willkommen bei LernApp${name ? `, ${name}` : ""}!</h2>
      <p>Du hast soeben eine Buchung bei uns erstellt. Wir haben automatisch ein Konto für dich angelegt.</p>
      <p>Bitte lege dein Passwort fest, um dich einzuloggen und deine Buchungen zu verwalten:</p>
      <p><a href="${setPasswordUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin:10px 0">Passwort festlegen</a></p>
      <p>Dieser Link ist 7 Tage gültig.</p>
      <p>Viele Grüße,<br/>dein LernApp-Team</p>
    `,
  });
}
