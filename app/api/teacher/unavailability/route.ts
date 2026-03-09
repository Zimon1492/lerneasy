import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

/**
 * GET /api/teacher/unavailability?email=...
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "email fehlt" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher nicht gefunden" }, { status: 404 });
    }

    const periods = await prisma.teacherUnavailability.findMany({
      where: { teacherId: teacher.id },
      orderBy: { fromDate: "asc" },
    });

    return NextResponse.json({ ok: true, data: periods });
  } catch (err) {
    logError("app/api/teacher/unavailability GET", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

/**
 * POST /api/teacher/unavailability
 * Body: { email, fromDate, toDate, note? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const email = (body?.email as string | undefined)?.trim().toLowerCase();
    const fromDateRaw = body?.fromDate as string | undefined;
    const toDateRaw = body?.toDate as string | undefined;
    const note = (body?.note as string | undefined)?.trim() || null;

    if (!email || !fromDateRaw || !toDateRaw) {
      return NextResponse.json(
        { error: "Fehlende Felder: email, fromDate, toDate" },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher nicht gefunden" }, { status: 404 });
    }

    const fromDate = new Date(fromDateRaw);
    const toDate = new Date(toDateRaw);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json({ error: "Ungultiges Datumsformat" }, { status: 400 });
    }

    if (toDate < fromDate) {
      return NextResponse.json(
        { error: "Enddatum muss nach dem Startdatum liegen" },
        { status: 400 }
      );
    }

    const created = await prisma.teacherUnavailability.create({
      data: {
        teacherId: teacher.id,
        fromDate,
        toDate,
        note,
      },
    });

    return NextResponse.json({ ok: true, data: created });
  } catch (err) {
    logError("app/api/teacher/unavailability POST", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
