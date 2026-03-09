// app/api/teacher/offers/ensure-all-form/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const email = (body?.email as string | undefined)?.trim().toLowerCase();
    const subjectId = body?.subjectId as string | undefined;
    const schoolTrack = body?.schoolTrack as "AHS" | "BHS" | undefined;
    const level = body?.level as "UNTERSTUFE" | "OBERSTUFE" | undefined;

    const minGrade = Number(body?.minGrade);
    const maxGrade = Number(body?.maxGrade);

    if (!email || !subjectId || !schoolTrack || !level) {
      return NextResponse.json(
        { error: "Fehlende Felder (email, subjectId, schoolTrack, level)" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(minGrade) || !Number.isFinite(maxGrade) || minGrade < 1 || maxGrade < 1 || minGrade > maxGrade) {
      return NextResponse.json({ error: "Ungültiger Klassenbereich." }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!teacher) return NextResponse.json({ error: "Teacher nicht gefunden." }, { status: 404 });

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true },
    });
    if (!subject) return NextResponse.json({ error: "Subject nicht gefunden." }, { status: 404 });

    // ✅ Upsert: genau 1 ALL-Offer
    const offer = await prisma.teachingOffer.upsert({
      where: {
        teacherId_subjectId_schoolForm_level_minGrade_maxGrade: {
          teacherId: teacher.id,
          subjectId: subject.id,
          schoolForm: "ALL" as any,
          level,
          minGrade,
          maxGrade,
        },
      },
      update: {
        schoolTrack,
      },
      create: {
        teacherId: teacher.id,
        subjectId: subject.id,
        schoolTrack,
        schoolForm: "ALL" as any,
        level,
        minGrade,
        maxGrade,
      },
      include: { subject: true },
    });

    return NextResponse.json({ ok: true, data: offer });
  } catch (err) {
    logError("app/api/teacher/offers/ensure-all-form POST", err).catch(() => {});
    console.error("POST /api/teacher/offers/ensure-all-form error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
