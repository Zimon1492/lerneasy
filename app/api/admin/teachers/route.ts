import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { isAdminAuthed } from "@/app/api/admin/_auth";
import { logError } from "@/app/lib/logError";
import { escapeHtml } from "@/app/lib/escapeHtml";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const teachers = await prisma.teacher.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        mustChangePassword: true,
        _count: { select: { bookings: true, availabilities: true } },
      },
    });

    return NextResponse.json({ teachers });
  } catch (err: any) {
    logError("app/api/admin/teachers GET", err).catch(() => {});
    console.error("GET /api/admin/teachers error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, email, subject, unterstufeOnly, schoolTrack, allowedForms } = await req.json();

    if (!name || !email || !subject) {
      return NextResponse.json(
        { error: "Felder name, email und subject sind Pflicht." },
        { status: 400 }
      );
    }

    const exists = await prisma.teacher.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "E-Mail bereits vergeben." }, { status: 409 });
    }

    const tempPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const created = await prisma.teacher.create({
      data: {
        name,
        email,
        subject,
        password: hashedPassword,
        mustChangePassword: true,
        unterstufeOnly: !!unterstufeOnly,
        schoolTrack: schoolTrack || "BOTH",
        allowedForms: allowedForms ? JSON.stringify(allowedForms) : null,
      },
      select: { id: true, name: true, email: true, subject: true },
    });

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        token,
        teacherId: created.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/teacher/set-password?token=${token}`;
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: created.email,
      subject: "Willkommen bei LernApp – Passwort festlegen",
      html: `<h2>Willkommen, ${escapeHtml(created.name)}!</h2>
        <p>Klicke auf den Link um dein Passwort festzulegen:</p>
        <p><a href="${resetUrl}">${escapeHtml(resetUrl)}</a></p>
        <p>Dieser Link ist 24 Stunden gültig.</p>`,
    });

    return NextResponse.json({ ok: true, created });
  } catch (err) {
    logError("app/api/admin/teachers POST", err).catch(() => {});
    console.error("POST /api/admin/teachers error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
