import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { isAdminAuthed } from "@/app/api/admin/_auth";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const application = await prisma.teacherApplication.findUnique({ where: { id } });
  if (!application) {
    return NextResponse.json({ error: "Bewerbung nicht gefunden." }, { status: 404 });
  }

  const { name, email, subject, schoolTrack, levelPref } = application;
  const randomPassword = crypto.randomBytes(16).toString("hex");

  let teacher;
  try {
    teacher = await prisma.teacher.upsert({
      where: { email },
      update: {
        name,
        mustChangePassword: true,
        schoolTrack: schoolTrack ?? "BOTH",
        unterstufeOnly: levelPref === "UNTERSTUFE",
      },
      create: {
        name,
        email,
        subject: subject ?? "",
        password: randomPassword,
        mustChangePassword: true,
        schoolTrack: schoolTrack ?? "BOTH",
        unterstufeOnly: levelPref === "UNTERSTUFE",
      },
    });
  } catch (err) {
    console.error("Fehler beim Anlegen des Lehrers:", err);
    return NextResponse.json({ error: "Lehrer konnte nicht angelegt werden." }, { status: 500 });
  }

  // Delete old reset tokens for this teacher
  await prisma.passwordResetToken.deleteMany({ where: { teacherId: teacher.id } });

  // Create new password reset token (24h expiry)
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      token,
      teacherId: teacher.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const setPasswordUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/teacher/set-password?token=${token}`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: email,
    subject: "LernApp – Willkommen! Bitte lege dein Passwort fest",
    html: `<h2>Willkommen bei LernApp, ${name}!</h2>
      <p>Wir haben deinen Vertrag erhalten und deinen Lehrer-Account aktiviert.</p>
      <p>Bitte klicke auf den folgenden Link, um dein Passwort festzulegen und deinen Account zu aktivieren:</p>
      <p><a href="${setPasswordUrl}">${setPasswordUrl}</a></p>
      <p>Dieser Link ist 24 Stunden gueltig.</p>
      <p>Wir freuen uns auf die Zusammenarbeit!</p>
      <p>Herzliche Gruesse,<br>Das LernApp-Team</p>`,
  });

  await prisma.teacherApplication.update({
    where: { id },
    data: { status: "active" },
  });

  return NextResponse.json({ ok: true });
}
