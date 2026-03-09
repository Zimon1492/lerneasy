import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

// GET /api/teacher/weekly-schedule?email=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "").trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "email fehlt" }, { status: 400 });

    const teacher = await prisma.teacher.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!teacher) return NextResponse.json({ error: "Lehrer nicht gefunden" }, { status: 404 });

    const schedule = await prisma.teacherWeeklySchedule.findMany({
      where: { teacherId: teacher.id },
      orderBy: { weekday: "asc" },
    });

    return NextResponse.json({ data: schedule });
  } catch (err) {
    logError("app/api/teacher/weekly-schedule GET", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

// PUT /api/teacher/weekly-schedule
// Body: { email, schedule: [{ weekday, fromTime, toTime, active }] }
export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    const entries: { weekday: number; fromTime: string; toTime: string; active: boolean }[] =
      body.schedule ?? [];

    if (!email) return NextResponse.json({ error: "email fehlt" }, { status: 400 });

    const teacher = await prisma.teacher.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!teacher) return NextResponse.json({ error: "Lehrer nicht gefunden" }, { status: 404 });

    // Upsert each weekday entry
    for (const entry of entries) {
      const { weekday, fromTime, toTime, active } = entry;
      if (weekday < 0 || weekday > 6) continue;

      await prisma.teacherWeeklySchedule.upsert({
        where: { teacherId_weekday: { teacherId: teacher.id, weekday } },
        create: { teacherId: teacher.id, weekday, fromTime, toTime, active },
        update: { fromTime, toTime, active },
      });
    }

    const schedule = await prisma.teacherWeeklySchedule.findMany({
      where: { teacherId: teacher.id },
      orderBy: { weekday: "asc" },
    });

    return NextResponse.json({ ok: true, data: schedule });
  } catch (err) {
    logError("app/api/teacher/weekly-schedule PUT", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
