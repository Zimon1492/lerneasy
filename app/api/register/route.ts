// app/api/register/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { logError } from "@/app/lib/logError";
import { rateLimit } from "@/lib/rateLimit";
import { isValidEmail } from "@/app/lib/validateEmail";

type SchoolTrack = "AHS" | "BHS";
type SchoolLevel = "UNTERSTUFE" | "OBERSTUFE";

// Muss zu deinem Prisma enum SchoolForm passen:
type SchoolForm =
  | "AHS_GYMNASIUM"
  | "AHS_REALGYMNASIUM"
  | "AHS_WK_REALGYMNASIUM"
  | "AHS_BORG"
  | "AHS_SCHWERPUNKT"
  | "BHS_HTL"
  | "BHS_HAK"
  | "BHS_HLW"
  | "BHS_MODE"
  | "BHS_KUNST_GESTALTUNG"
  | "BHS_TOURISMUS"
  | "BHS_SOZIALPAED"
  | "BHS_LAND_FORST"
  | "OTHER";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Zu viele Registrierungsversuche. Bitte versuche es in einer Stunde erneut." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();

    const name = (body?.name ?? "").toString().trim();
    const email = (body?.email ?? "").toString().trim().toLowerCase();
    const password = (body?.password ?? "").toString();

    // ✅ NEU (Schüler-Schulinfo)
    const schoolTrack = body?.schoolTrack as SchoolTrack | undefined;
    const schoolForm = body?.schoolForm as SchoolForm | undefined;
    const schoolName = (body?.schoolName ?? "").toString().trim();
    const level = body?.level as SchoolLevel | undefined;
    const gradeRaw = body?.grade;

    const grade =
      gradeRaw === undefined || gradeRaw === null || gradeRaw === ""
        ? null
        : Number(gradeRaw);

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-Mail oder Passwort fehlt" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Ungültige E-Mail-Adresse." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Passwort muss mindestens 8 Zeichen haben" },
        { status: 400 }
      );
    }

    // Optional: wenn du willst, dass Schulinfos Pflicht sind:
    // (du kannst das lockerer machen)
    if (!schoolTrack || !schoolForm || !level || !schoolName || !grade) {
      return NextResponse.json(
        { error: "Bitte Schule, Schultyp, Schulform, Stufe und Klasse ausfüllen." },
        { status: 400 }
      );
    }

    const maxGrade = schoolTrack === "BHS" ? 9 : 8;
    const minGrade = schoolTrack === "BHS" ? 5 : 1;
    if (!Number.isInteger(grade) || grade < minGrade || grade > maxGrade) {
      return NextResponse.json(
        { error: `Klasse muss zwischen ${minGrade} und ${maxGrade} liegen.` },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ein Konto mit dieser E-Mail existiert bereits." },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(password, 10);

    const created = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hash,
        role: "student",

        // ✅ RICHTIG (statt schoolType!)
        schoolTrack,
        schoolForm,
        schoolName,
        level,
        grade,
      },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ ok: true, user: created });
  } catch (err) {
    logError("app/api/register POST", err).catch(() => {});
    console.error("POST /api/register error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
