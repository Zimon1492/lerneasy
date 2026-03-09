// app/api/teacher/offers/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

function labelLevel(level: string) {
  if (level === "ALL") return "Alle";
  return level === "UNTERSTUFE" ? "Unterstufe" : "Oberstufe";
}
function labelTrack(track: string) {
  if (track === "ALL") return "Alle";
  return track;
}
function labelForm(form: string) {
  if (form === "ALL") return "Alle";
  return form;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ data: [], grouped: [], error: "email fehlt" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ data: [], grouped: [], error: "Teacher nicht gefunden" }, { status: 404 });
    }

    const offers = await prisma.teachingOffer.findMany({
      where: { teacherId: teacher.id },
      include: { subject: true },
      orderBy: { createdAt: "desc" },
    });

    // ✅ Gruppierung: gleiche Kombi nur einmal
    const map = new Map<string, any>();

    for (const o of offers) {
      const key = [
        o.subjectId,
        o.schoolTrack,
        o.schoolForm,
        o.level,
        o.minGrade,
        o.maxGrade,
      ].join("|");

      if (!map.has(key)) {
        map.set(key, {
          id: o.id, // repräsentatives offerId (wird bei Availability gespeichert)
          subject: o.subject,
          subjectId: o.subjectId,
          schoolTrack: o.schoolTrack,
          schoolForm: o.schoolForm,
          level: o.level,
          minGrade: o.minGrade,
          maxGrade: o.maxGrade,
          createdAt: o.createdAt,
          _count: 1,
        });
      } else {
        map.get(key)._count += 1;
      }
    }

    const grouped = Array.from(map.values()).map((x) => ({
      ...x,
      label: `${x.subject.name} · ${labelTrack(x.schoolTrack)} · ${labelForm(x.schoolForm)} · ${labelLevel(x.level)} · ${x.minGrade}-${x.maxGrade}`,
    }));

    return NextResponse.json({ ok: true, data: offers, grouped });
  } catch (err) {
    logError("app/api/teacher/offers GET", err).catch(() => {});
    console.error("GET /api/teacher/offers error:", err);
    return NextResponse.json({ ok: false, data: [], grouped: [], error: "Serverfehler" }, { status: 500 });
  }
}
