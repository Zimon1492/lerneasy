// app/api/teacher/availability/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

/**
 * GET /api/teacher/availability?email=...
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

    const slots = await prisma.availability.findMany({
      where: { teacherId: teacher.id },
      orderBy: [{ date: "asc" }, { start: "asc" }],
      include: {
        offer: { include: { subject: true } },
      },
    });

    return NextResponse.json({ ok: true, data: slots });
  } catch (err) {
    logError("app/api/teacher/availability GET", err).catch(() => {});
    console.error("GET /api/teacher/availability error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

/**
 * POST /api/teacher/availability
 * Body: { email, date, start, end, offerId? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const email = (body?.email as string | undefined)?.trim().toLowerCase();
    const dateRaw = body?.date as string | undefined; // "2026-01-13"
    const start = (body?.start as string | undefined)?.trim(); // "14:00"
    const end = (body?.end as string | undefined)?.trim(); // "15:00"
    const offerId = (body?.offerId as string | undefined) ?? null;

    if (!email || !dateRaw || !start || !end) {
      return NextResponse.json(
        { error: "Fehlende Felder: email, date, start, end" },
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

    const date = new Date(dateRaw);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: "Ungültiges date Format" }, { status: 400 });
    }

    // offerId validieren (wenn gesetzt)
    if (offerId) {
      const offer = await prisma.teachingOffer.findFirst({
        where: { id: offerId, teacherId: teacher.id },
        select: { id: true },
      });

      if (!offer) {
        return NextResponse.json(
          { error: "Angebot nicht gefunden oder gehört nicht zu diesem Lehrer" },
          { status: 404 }
        );
      }
    }

    const created = await prisma.availability.create({
      data: {
        teacherId: teacher.id,
        date,
        start,
        end,
        offerId: offerId || null,
      },
      include: {
        offer: { include: { subject: true } },
      },
    });

    return NextResponse.json({ ok: true, data: created });
  } catch (err) {
    logError("app/api/teacher/availability POST", err).catch(() => {});
    console.error("POST /api/teacher/availability error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
