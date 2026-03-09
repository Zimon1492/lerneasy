// app/api/search/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

// Hilfsfunktion: tolerant normalisieren
function normalize(str: string) {
  return (str || "")
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const subjectRaw = searchParams.get("subject") || "";
    const subjectQuery = normalize(subjectRaw);

    const studentEmailRaw = (searchParams.get("studentEmail") || "").trim().toLowerCase();

    // Wenn kein Suchbegriff -> optional alle Lehrer zurückgeben (oder leer)
    if (!subjectQuery) {
      const teachers = await prisma.teacher.findMany({
        select: { id: true, name: true, email: true, subject: true, profilePicture: true, ratings: { select: { stars: true } } },
        orderBy: { name: "asc" },
      });
      return NextResponse.json({
        data: teachers.map((t) => ({
          ...t,
          avgRating: t.ratings.length > 0 ? t.ratings.reduce((s, r) => s + r.stars, 0) / t.ratings.length : null,
          ratingCount: t.ratings.length,
        })),
      });
    }

    // Wenn keine Student-Email -> wir suchen nur nach Fach (ohne Schulfilter)
    // (Damit deine Suche auch funktioniert, wenn studentEmail nicht mitgesendet wird.)
    let student: {
      id: string;
      level: any | null;
      grade: number | null;
      schoolTrack: any | null;
      schoolForm: any | null;
    } | null = null;

    if (studentEmailRaw) {
      student = await prisma.user.findUnique({
        where: { email: studentEmailRaw },
        select: { id: true, level: true, grade: true, schoolTrack: true, schoolForm: true },
      });
    }

    // ------------------------------------------------------------
    // 1) Passende Subjects suchen (Fuzzy über alle Subject-Namen)
    // ------------------------------------------------------------
    const allSubjects = await prisma.subject.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const matchingSubjectIds = allSubjects
      .filter((s) => {
        const n = normalize(s.name);
        return (
          n.includes(subjectQuery) ||
          subjectQuery.includes(n) ||
          n.startsWith(subjectQuery) ||
          subjectQuery.startsWith(n)
        );
      })
      .map((s) => s.id);

    // Kein Subject gefunden -> keine Lehrer
    if (matchingSubjectIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // ------------------------------------------------------------
    // 2) Offer-Filter bauen (nur wenn wir Schüler-Daten haben)
    // ------------------------------------------------------------
    const offerWhere: any = {
      subjectId: { in: matchingSubjectIds },
    };

    // Wenn Schüler vollständig ist, filtern wir nach Stufe/Klasse/Schule
    if (student?.level && student?.grade && student?.schoolTrack && student?.schoolForm) {
      offerWhere.schoolTrack = student.schoolTrack;
      offerWhere.schoolForm = student.schoolForm;
      offerWhere.level = student.level;

      // Klasse innerhalb Range
      offerWhere.minGrade = { lte: student.grade };
      offerWhere.maxGrade = { gte: student.grade };
    }

    // ------------------------------------------------------------
    // 3) Offers laden + Teacher joinen, dann Teacher-Liste bauen
    // ------------------------------------------------------------
    const offers = await prisma.teachingOffer.findMany({
      where: offerWhere,
      select: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            subject: true,
            profilePicture: true,
            ratings: { select: { stars: true } },
          },
        },
      },
    });

    // unique teachers
    const map = new Map<string, { id: string; name: string; email: string; subject: string; profilePicture: string | null; avgRating: number | null; ratingCount: number }>();
    for (const o of offers) {
      const t = o.teacher;
      if (t?.id && !map.has(t.id)) {
        const avgRating = t.ratings.length > 0 ? t.ratings.reduce((s, r) => s + r.stars, 0) / t.ratings.length : null;
        map.set(t.id, {
          id: t.id,
          name: t.name,
          email: t.email,
          subject: t.subject ?? "",
          profilePicture: t.profilePicture ?? null,
          avgRating,
          ratingCount: t.ratings.length,
        });
      }
    }

    const result = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ data: result });
  } catch (err: any) {
    logError("app/api/search GET", err).catch(() => {});
    console.error("GET /api/search error:", err);
    return NextResponse.json({ data: [], error: "ServerFehler" }, { status: 500 });
  }
}
