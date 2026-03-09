import { NextResponse } from "next/server";
import { getTeacherSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getTeacherSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email: session.email },
      select: {
        id: true,
        ratings: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            stars: true,
            comment: true,
            createdAt: true,
            student: { select: { name: true } },
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Lehrer nicht gefunden." }, { status: 404 });
    }

    const count = teacher.ratings.length;
    const avg =
      count > 0
        ? teacher.ratings.reduce((s, r) => s + r.stars, 0) / count
        : null;

    return NextResponse.json({ ok: true, ratings: teacher.ratings, avg, count });
  } catch (err) {
    logError("api/teacher/ratings GET", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
