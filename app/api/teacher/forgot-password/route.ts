import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { logError } from "@/app/lib/logError";
import { rateLimitDb } from "@/lib/rateLimitDb";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const allowed = await rateLimitDb(`teacher-forgot-pw:${ip}`, 5, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Zu viele Anfragen. Bitte warte kurz." }, { status: 429 });
  }

  try {
    const { email } = await req.json().catch(() => ({}));
    if (!email) return NextResponse.json({ error: "E-Mail fehlt." }, { status: 400 });

    const normalised = email.trim().toLowerCase();

    // Always return OK to avoid user enumeration
    const teacher = await prisma.teacher.findUnique({ where: { email: normalised }, select: { id: true } });
    if (teacher) {
      // Delete any existing tokens for this teacher
      await prisma.passwordResetToken.deleteMany({ where: { teacherId: teacher.id } });

      const token = crypto.randomBytes(32).toString("hex");
      await prisma.passwordResetToken.create({
        data: {
          token,
          teacherId: teacher.id,
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        },
      });

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: normalised,
        subject: "Passwort zurücksetzen – LernEasy",
        html: `
          <h2>Passwort zurücksetzen</h2>
          <p>Du hast eine Passwort-Zurücksetzung für dein Lehrer-Konto angefordert. Klicke auf den Link, um ein neues Passwort festzulegen:</p>
          <p><a href="${baseUrl}/teacher/set-password?token=${token}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin:10px 0">Passwort zurücksetzen</a></p>
          <p>Dieser Link ist 2 Stunden gültig. Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.</p>
          <p>Viele Grüße,<br/>dein LernEasy-Team</p>
        `,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError("api/teacher/forgot-password POST", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
