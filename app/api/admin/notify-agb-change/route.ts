import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/app/api/admin/_auth";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export async function POST(req: Request) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    const priceMin     = typeof body.priceMin     === "number" && body.priceMin >= 0                         ? body.priceMin     : null;
    const priceMax     = typeof body.priceMax     === "number" && body.priceMax > 0                          ? body.priceMax     : null;
    const priceN       = typeof body.priceN       === "number" && body.priceN > 0                            ? body.priceN       : null;
    const teacherShare = typeof body.teacherShare === "number" && body.teacherShare > 0 && body.teacherShare <= 1 ? body.teacherShare : null;

    if (priceMin == null || priceMax == null || priceN == null || teacherShare == null) {
      return NextResponse.json({ error: "Ungültige oder fehlende Werte." }, { status: 400 });
    }

    const now = new Date();

    // Schüler: 2 Monate Vorlauf (KSchG §6 / AGB §11)
    const effectiveFrom = new Date(now);
    effectiveFrom.setMonth(effectiveFrom.getMonth() + 2);

    // Lehrer: 4 Wochen Vorlauf (Lehrervertrag §9)
    const teacherEffectiveDate = new Date(now);
    teacherEffectiveDate.setDate(teacherEffectiveDate.getDate() + 28);

    // Pending-Werte + Stichtag in DB speichern
    await prisma.platformSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        pendingPriceMin: priceMin,
        pendingPriceMax: priceMax,
        pendingPriceN: priceN,
        pendingTeacherShare: teacherShare,
        pendingEffectiveFrom: effectiveFrom,
      },
      update: {
        pendingPriceMin: priceMin,
        pendingPriceMax: priceMax,
        pendingPriceN: priceN,
        pendingTeacherShare: teacherShare,
        pendingEffectiveFrom: effectiveFrom,
      },
    });

    const newTeacherShare = Math.round(teacherShare * 100);
    const platformShare = 100 - newTeacherShare;

    // Alle Schüler mit E-Mail laden
    const students = await prisma.user.findMany({
      where: { role: "student" },
      select: { email: true, name: true },
    });

    // Alle aktiven Lehrer laden
    const teachers = await prisma.teacher.findMany({
      select: { email: true, name: true },
    });

    const transporter = createTransport();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

    let studentsSent = 0;
    let teachersSent = 0;

    // E-Mails an Schüler
    for (const student of students) {
      await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: student.email,
        subject: "Änderung unserer AGB – Inkrafttreten am " + formatDate(effectiveFrom),
        html: `
          <h2>Liebe${student.name ? `r ${student.name}` : ""}, </h2>
          <p>wir möchten dich darüber informieren, dass wir unsere <strong>Allgemeinen Geschäftsbedingungen (AGB)</strong>
          anpassen. Die Änderungen treten am <strong>${formatDate(effectiveFrom)}</strong> in Kraft.</p>

          <h3>Was ändert sich?</h3>
          <p>Wir passen unser <strong>Preismodell</strong> an. Der Preis pro Nachhilfestunde wird ab dem
          ${formatDate(effectiveFrom)} nach folgender Formel berechnet:</p>
          <p style="font-family:monospace; background:#f3f4f6; padding:10px; border-radius:6px;">
            f(x) = ${priceMin} + (${priceMax} − ${priceMin}) × (1 − e<sup>−x/${priceN}</sup>) × a/5
          </p>
          <p>Neue Lehrkräfte starten bei <strong>${priceMin} €/h</strong>,
          erfahrene Top-Lehrkräfte können bis zu <strong>${priceMax} €/h</strong> erreichen.
          Der genaue Preis wird dir immer vor der Buchung angezeigt.</p>

          <h3>Deine Rechte</h3>
          <p>Du hast das Recht, deinen Vertrag bis zum Inkrafttreten der Änderungen
          (<strong>${formatDate(effectiveFrom)}</strong>) kostenfrei zu beenden und dein Konto zu löschen.
          Wende dich dazu an <a href="mailto:office.lerneasy@gmail.com">office.lerneasy@gmail.com</a>.</p>
          <p>Wenn du die Plattform nach dem ${formatDate(effectiveFrom)} weiterhin nutzt,
          gilt dies als Zustimmung zu den neuen AGB.</p>

          <p>Die aktuellen AGB kannst du jederzeit unter <a href="${baseUrl}/agb">${baseUrl}/agb</a> einsehen.</p>

          <p>Bei Fragen stehen wir dir gerne unter <a href="mailto:office.lerneasy@gmail.com">office.lerneasy@gmail.com</a> zur Verfügung.</p>

          <p>Viele Grüße,<br/>dein LernEasy-Team</p>
        `,
      }).catch(() => {});
      studentsSent++;
    }

    // E-Mails an Lehrer
    for (const teacher of teachers) {
      await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: teacher.email,
        subject: "Änderung des Werkvertrags – Inkrafttreten am " + formatDate(teacherEffectiveDate),
        html: `
          <h2>Liebe${teacher.name ? `r ${teacher.name}` : ""}, </h2>
          <p>wir möchten dich darüber informieren, dass wir die <strong>Vergütungsregelung</strong> in deinem
          Werkvertrag anpassen. Die Änderungen treten am <strong>${formatDate(teacherEffectiveDate)}</strong> in Kraft
          (gemäß Werkvertrag §9, Ankündigungsfrist 4 Wochen).</p>

          <h3>Was ändert sich?</h3>
          <ul>
            <li><strong>Schülerpreis:</strong> variabel ${priceMin}–${priceMax} €/h (dynamisch nach Bewertungen)</li>
            <li><strong>Dein Anteil:</strong> ${newTeacherShare} % des gezahlten Schülerpreises</li>
            <li><strong>Plattformanteil:</strong> ${platformShare} %</li>
          </ul>

          <h3>Deine Rechte</h3>
          <p>Du hast das Recht, den Werkvertrag bis zum <strong>${formatDate(teacherEffectiveDate)}</strong>
          zu kündigen, wenn du den Änderungen nicht zustimmst (gemäß Werkvertrag §8 Abs. 2).
          Wende dich dazu an <a href="mailto:office.lerneasy@gmail.com">office.lerneasy@gmail.com</a>.</p>

          <p>Bei Fragen stehen wir dir gerne zur Verfügung.</p>

          <p>Viele Grüße,<br/>dein LernEasy-Team</p>
        `,
      }).catch(() => {});
      teachersSent++;
    }

    return NextResponse.json({
      ok: true,
      studentsSent,
      teachersSent,
      studentEffectiveDate: formatDate(effectiveFrom),
      teacherEffectiveDate: formatDate(teacherEffectiveDate),
    });
  } catch (err) {
    logError("api/admin/notify-agb-change POST", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
