import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

/**
 * GET /api/teacher/my-subjects?email=...
 * Returns the subjects from the teacher's profile, auto-creating them in the
 * Subject table if they don't exist yet.
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
      select: { subject: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Lehrer nicht gefunden" }, { status: 404 });
    }

    const names = (teacher.subject || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (names.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Upsert each subject so they always exist in the Subject table
    const subjects = await Promise.all(
      names.map((name) =>
        prisma.subject.upsert({
          where: { name },
          update: {},
          create: { name },
          select: { id: true, name: true },
        })
      )
    );

    return NextResponse.json({ data: subjects });
  } catch (err) {
    logError("app/api/teacher/my-subjects GET", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
