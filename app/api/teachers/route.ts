// app/api/teachers/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

// Hilfsfunktion: "Mathe, Englisch, Mathe" -> ["Mathe","Englisch"]
function uniqueSubjectsFromString(s: string | null | undefined): string[] {
  if (!s) return [];
  const parts = s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  // unique + Reihenfolge behalten
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(p);
    }
  }
  return out;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentEmail = (searchParams.get("studentEmail") || "").trim().toLowerCase();

    // If student email is provided, load their school profile for filtering
    let offerFilter: Record<string, unknown> = {};
    if (studentEmail) {
      const student = await prisma.user.findUnique({
        where: { email: studentEmail },
        select: { schoolTrack: true, schoolForm: true, grade: true, level: true },
      });
      if (student?.schoolTrack && student?.schoolForm && student?.grade != null) {
        offerFilter = {
          offers: {
            some: {
              schoolTrack: student.schoolTrack,
              schoolForm: student.schoolForm,
              minGrade: { lte: student.grade },
              maxGrade: { gte: student.grade },
            },
          },
        };
      }
    }

    const teachers = await prisma.teacher.findMany({
      where: offerFilter,
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        profilePicture: true,
        offers: {
          select: { subject: { select: { name: true } } },
        },
        ratings: { select: { stars: true } },
      },
      orderBy: { name: "asc" },
    });

    const mapped = teachers.map((t) => {
      let subjects = uniqueSubjectsFromString(t.subject);

      if (subjects.length === 0 && t.offers?.length) {
        const seen = new Set<string>();
        const out: string[] = [];
        for (const o of t.offers) {
          const name = o.subject?.name?.trim();
          if (!name) continue;
          const key = name.toLowerCase();
          if (!seen.has(key)) { seen.add(key); out.push(name); }
        }
        subjects = out;
      }

      const avgRating =
        t.ratings.length > 0
          ? t.ratings.reduce((s, r) => s + r.stars, 0) / t.ratings.length
          : null;

      return {
        id: t.id,
        name: t.name,
        email: t.email,
        subject: subjects.join(", "),
        profilePicture: t.profilePicture ?? null,
        avgRating,
        ratingCount: t.ratings.length,
      };
    });

    return NextResponse.json({ data: mapped });
  } catch (err) {
    logError("app/api/teachers GET", err).catch(() => {});
    console.error("GET /api/teachers error:", err);
    return NextResponse.json({ data: [], error: "ServerFehler" }, { status: 500 });
  }
}

// POST bleibt wie du es hast – nur falls du es brauchst, ist es hier mit drin:
export async function POST(req: Request) {
  try {
    const { name, email, subject, adminKey } = await req.json();

    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: "Ungültiger Admin-Key." }, { status: 401 });
    }

    if (!name || !email || !subject) {
      return NextResponse.json(
        { error: "Bitte name, email und subject angeben." },
        { status: 400 }
      );
    }

    const exists = await prisma.teacher.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: "Ein Lehrer mit dieser E-Mail existiert bereits." },
        { status: 400 }
      );
    }

    const tempPassword = Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const created = await prisma.teacher.create({
      data: {
        name,
        email,
        subject, // bleibt subject (String)
        password: hashedPassword,
        mustChangePassword: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        mustChangePassword: true,
      },
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
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/teacher/set-password?token=${token}`;

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: created.email,
      subject: "Willkommen bei LernApp – Passwort festlegen",
      html: `
        <h2>Willkommen, ${created.name}!</h2>
        <p>Um deinen Lehrer-Account zu aktivieren, klicke bitte auf den folgenden Link:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Dieser Link ist 24 Stunden gültig.</p>
      `,
    });

    return NextResponse.json({
      ok: true,
      created,
      tempPassword,
    });
  } catch (err) {
    logError("app/api/teachers POST", err).catch(() => {});
    console.error("POST /api/teachers error:", err);
    return NextResponse.json({ error: "ServerFehler" }, { status: 500 });
  }
}
