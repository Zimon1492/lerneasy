import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { isAdminAuthed } from "@/app/api/admin/_auth";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const students = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      schoolTrack: true,
      schoolForm: true,
      level: true,
      grade: true,
      createdAt: true,
      _count: { select: { bookings: true } },
    },
  });

  return NextResponse.json({ students });
}

export async function POST(req: Request) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, email, password, schoolTrack, schoolForm, schoolName, level, grade } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "E-Mail und Passwort sind Pflicht." }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "E-Mail bereits vergeben." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const student = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
        schoolTrack: schoolTrack || null,
        schoolForm: schoolForm || null,
        schoolName: schoolName || null,
        level: level || null,
        grade: grade ? Number(grade) : null,
      },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ ok: true, student });
  } catch (err: any) {
    logError("app/api/admin/students POST", err).catch(() => {});
    console.error("POST /api/admin/students error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
