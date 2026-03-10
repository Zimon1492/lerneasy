import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { isAdminAuthed } from "@/app/api/admin/_auth";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthed(_req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) {
    return NextResponse.json({ error: "Lehrer nicht gefunden." }, { status: 404 });
  }

  // Alte Tokens loeschen
  await prisma.passwordResetToken.deleteMany({ where: { teacherId: teacher.id } });

  // Neuen Token erstellen
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      token,
      teacherId: teacher.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/teacher/set-password?token=${token}`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: teacher.email,
    subject: "LernEasy – Neuer Link zum Passwort festlegen",
    html: `<h2>Hallo ${teacher.name}!</h2>
      <p>Hier ist dein neuer Link zum Passwort festlegen:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Dieser Link ist 24 Stunden gueltig.</p>`,
  });

  return NextResponse.json({ ok: true });
}
