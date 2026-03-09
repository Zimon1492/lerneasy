import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getStudentSession } from "@/app/lib/auth";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

/**
 * GET /api/ratings?teacherId=...
 * Returns all ratings for a teacher + avg.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = (searchParams.get("teacherId") || "").trim();

    if (!teacherId) {
      return NextResponse.json({ error: "teacherId fehlt" }, { status: 400 });
    }

    const session = await getStudentSession();

    const [ratings, myRatingRow] = await Promise.all([
      prisma.teacherRating.findMany({
        where: { teacherId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          stars: true,
          comment: true,
          createdAt: true,
          student: { select: { name: true } },
        },
      }),
      session
        ? prisma.teacherRating.findFirst({
            where: {
              teacherId,
              student: { email: session.email },
            },
            select: { stars: true, comment: true },
          })
        : null,
    ]);

    const avg =
      ratings.length > 0
        ? ratings.reduce((s, r) => s + r.stars, 0) / ratings.length
        : null;

    return NextResponse.json({ ok: true, ratings, avg, count: ratings.length, myRating: myRatingRow ?? null });
  } catch (err) {
    logError("app/api/ratings GET", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

/**
 * POST /api/ratings
 * Body: { teacherId, stars, comment? }
 * Student must be logged in and have at least one paid booking with this teacher.
 */
export async function POST(req: Request) {
  try {
    const session = await getStudentSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const teacherId = (body?.teacherId as string | undefined)?.trim();
    const stars = Number(body?.stars);
    const comment = (body?.comment as string | undefined)?.trim() || null;

    if (!teacherId || !stars || stars < 1 || stars > 5) {
      return NextResponse.json({ error: "teacherId und stars (1-5) benoetigt" }, { status: 400 });
    }

    const student = await prisma.user.findUnique({
      where: { email: session.email },
      select: { id: true },
    });
    if (!student) {
      return NextResponse.json({ error: "Schueler nicht gefunden" }, { status: 404 });
    }

    // Student must have at least one paid booking with this teacher
    const paidBooking = await prisma.booking.findFirst({
      where: { teacherId, studentId: student.id, status: "paid" },
      select: { id: true },
    });
    if (!paidBooking) {
      return NextResponse.json(
        { error: "Du kannst nur Lehrer bewerten, bei denen du eine abgeschlossene Buchung hast." },
        { status: 403 }
      );
    }

    // Upsert: one rating per student-teacher pair
    const rating = await prisma.teacherRating.upsert({
      where: { teacherId_studentId: { teacherId, studentId: student.id } },
      create: { teacherId, studentId: student.id, stars, comment },
      update: { stars, comment },
      select: { id: true, stars: true, comment: true },
    });

    return NextResponse.json({ ok: true, rating });
  } catch (err) {
    logError("app/api/ratings POST", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
