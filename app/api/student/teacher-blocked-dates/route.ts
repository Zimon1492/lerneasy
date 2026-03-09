import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

/**
 * GET /api/student/teacher-blocked-dates?teacherId=...
 * Returns blocked date ranges for a teacher (no auth required).
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = (searchParams.get("teacherId") || "").trim();

    if (!teacherId) {
      return NextResponse.json({ error: "teacherId fehlt" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Lehrer nicht gefunden" }, { status: 404 });
    }

    const periods = await prisma.teacherUnavailability.findMany({
      where: { teacherId },
      orderBy: { fromDate: "asc" },
      select: { id: true, fromDate: true, toDate: true, note: true },
    });

    return NextResponse.json({ ok: true, periods });
  } catch (err) {
    logError("app/api/student/teacher-blocked-dates GET", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
