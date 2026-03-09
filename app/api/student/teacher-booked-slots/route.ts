import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

const ACTIVE_STATUSES = [
  "pending",
  "checkout_started",
  "payment_method_saved",
  "paid",
];

/**
 * GET /api/student/teacher-booked-slots?teacherId=...&date=YYYY-MM-DD
 * Returns the already-booked time ranges for a teacher on a given day.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = (searchParams.get("teacherId") || "").trim();
    const dateStr = (searchParams.get("date") || "").trim();

    if (!teacherId || !dateStr) {
      return NextResponse.json({ error: "teacherId und date fehlen" }, { status: 400 });
    }

    const dayStart = new Date(`${dateStr}T00:00:00`);
    const dayEnd = new Date(`${dateStr}T23:59:59`);

    if (isNaN(dayStart.getTime())) {
      return NextResponse.json({ error: "Ungultiges Datum" }, { status: 400 });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        teacherId,
        status: { in: ACTIVE_STATUSES },
        start: { lt: dayEnd },
        end: { gt: dayStart },
      },
      select: { start: true, end: true },
      orderBy: { start: "asc" },
    });

    const slots = bookings.map((b) => ({
      start: b.start.toTimeString().slice(0, 5), // "HH:MM"
      end: b.end.toTimeString().slice(0, 5),
    }));

    return NextResponse.json({ ok: true, slots });
  } catch (err) {
    logError("app/api/student/teacher-booked-slots GET", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
