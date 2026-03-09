// app/api/teacher/offers/create/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

type TrackValue = "AHS" | "BHS" | "ALL";
type LevelValue = "UNTERSTUFE" | "OBERSTUFE" | "ALL";
type FormValue = string | "ALL";

const AHS_FORMS = [
  "AHS_GYMNASIUM",
  "AHS_REALGYMNASIUM",
  "AHS_WK_REALGYMNASIUM",
  "AHS_BORG",
  "AHS_SCHWERPUNKT",
] as const;

const BHS_FORMS = [
  "BHS_HTL",
  "BHS_HAK",
  "BHS_HLW",
  "BHS_MODE",
  "BHS_KUNST_GESTALTUNG",
  "BHS_TOURISMUS",
  "BHS_SOZIALPAED",
  "BHS_LAND_FORST",
] as const;

/**
 * ✅ Klassenlogik (deine Regeln)
 * Track=ALL + Level=ALL -> 1..9
 * Track=AHS + Level=ALL -> 1..8
 * Track=AHS + Unterstufe -> 1..4
 * Track=AHS + Oberstufe -> 5..8
 * Track=BHS -> Level automatisch OBERSTUFE, 5..9
 */
function gradeRangeFor(track: TrackValue, level: LevelValue) {
  if (track === "BHS") return { min: 5, max: 9 };

  if (track === "AHS") {
    if (level === "UNTERSTUFE") return { min: 1, max: 4 };
    if (level === "OBERSTUFE") return { min: 5, max: 8 };
    return { min: 1, max: 8 };
  }

  // track === "ALL"
  if (level === "ALL") return { min: 1, max: 9 };
  return { min: 1, max: 9 };
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function normalizeEmail(email: string) {
  return (email || "").trim().toLowerCase();
}

function isValidForm(form: string) {
  return typeof form === "string" && form.length > 0;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const email = normalizeEmail((body?.email ?? "") as string);
    const subjectId = body?.subjectId as string | undefined;

    const schoolTrack = body?.schoolTrack as TrackValue | undefined;
    const schoolForm = (body?.schoolForm as FormValue | undefined) ?? "ALL";
    const level = body?.level as LevelValue | undefined;

    const minGradeRaw = Number(body?.minGrade);
    const maxGradeRaw = Number(body?.maxGrade);

    if (!email || !subjectId || !schoolTrack || !level) {
      return NextResponse.json(
        { error: "Fehlende Felder (email, subjectId, schoolTrack, level)" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(minGradeRaw) || !Number.isFinite(maxGradeRaw)) {
      return NextResponse.json(
        { error: "minGrade/maxGrade müssen Zahlen sein." },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email },
      select: { id: true, unterstufeOnly: true, allowedForms: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher nicht gefunden." }, { status: 404 });
    }

    // ✅ Unterstufe-only Regeln
    if (teacher.unterstufeOnly) {
      if (schoolTrack === "BHS" || schoolTrack === "ALL") {
        return NextResponse.json(
          { error: "Unterstufe-Lehrer darf kein BHS/Alle als Schultyp wählen." },
          { status: 400 }
        );
      }
      if (level === "OBERSTUFE" || level === "ALL") {
        return NextResponse.json(
          { error: "Unterstufe-Lehrer darf keine Oberstufe/Alle als Stufe wählen." },
          { status: 400 }
        );
      }
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true },
    });

    if (!subject) {
      return NextResponse.json({ error: "Fach (Subject) nicht gefunden." }, { status: 404 });
    }

    // ✅ Tracks expandieren
    const tracks: ("AHS" | "BHS")[] =
      schoolTrack === "ALL"
        ? teacher.unterstufeOnly
          ? ["AHS"]
          : ["AHS", "BHS"]
        : [schoolTrack];

    // ✅ Levels expandieren (BHS immer Oberstufe)
    const levelsForTrack = (t: "AHS" | "BHS"): ("UNTERSTUFE" | "OBERSTUFE")[] => {
      if (t === "BHS") return ["OBERSTUFE"];
      if (level === "ALL") return ["UNTERSTUFE", "OBERSTUFE"];
      return [level as any];
    };

    // Parse teacher's allowed forms from their application
    let teacherAllowedForms: Set<string> | null = null;
    if (teacher.allowedForms) {
      try {
        const parsed = JSON.parse(teacher.allowedForms);
        if (Array.isArray(parsed) && parsed.length > 0) {
          teacherAllowedForms = new Set(parsed);
        }
      } catch { /* ignore */ }
    }

    // ✅ Forms expandieren: "ALL" => nur Formen aus der Bewerbung des Lehrers (oder alle wenn keine gesetzt)
    const formsForTrack = (t: "AHS" | "BHS"): string[] => {
      const trackForms: string[] = t === "AHS" ? [...AHS_FORMS] : [...BHS_FORMS];

      if (schoolForm === "ALL") {
        if (teacherAllowedForms) {
          return trackForms.filter((f) => teacherAllowedForms!.has(f));
        }
        return trackForms;
      }

      const v = String(schoolForm);
      if (!isValidForm(v)) return [];

      const allowed = new Set<string>(trackForms);
      return allowed.has(v) ? [v] : [];
    };

    // ✅ Kombos bauen
    const combos: {
      schoolTrack: "AHS" | "BHS";
      schoolForm: string;
      level: "UNTERSTUFE" | "OBERSTUFE";
      minGrade: number;
      maxGrade: number;
    }[] = [];

    for (const t of tracks) {
      const ls = levelsForTrack(t);
      const fs = formsForTrack(t);

      for (const l of ls) {
        const range = gradeRangeFor(t as any, l as any);

        const safeMin = clamp(minGradeRaw, range.min, range.max);
        const safeMax = clamp(maxGradeRaw, range.min, range.max);

        const finalMin = Math.min(safeMin, safeMax);
        const finalMax = Math.max(safeMin, safeMax);

        for (const f of fs) {
          combos.push({
            schoolTrack: t,
            schoolForm: f,
            level: l,
            minGrade: finalMin,
            maxGrade: finalMax,
          });
        }
      }
    }

    if (combos.length === 0) {
      return NextResponse.json(
        { error: "Ungültige Auswahl (Track/Form/Stufe passen nicht zusammen)." },
        { status: 400 }
      );
    }

    // ✅ Ohne createMany(skipDuplicates) => wir erstellen einzeln und ignorieren Duplikate (P2002)
    let createdCount = 0;
    let skippedCount = 0;

    for (const c of combos) {
      try {
        await prisma.teachingOffer.create({
          data: {
            teacherId: teacher.id,
            subjectId: subject.id,
            schoolTrack: c.schoolTrack as any,
            schoolForm: c.schoolForm as any,
            level: c.level as any,
            minGrade: c.minGrade,
            maxGrade: c.maxGrade,
          },
        });
        createdCount += 1;
      } catch (err: any) {
        if (err?.code === "P2002") {
          skippedCount += 1;
          continue;
        }
        throw err;
      }
    }

    // neu laden
    const latest = await prisma.teachingOffer.findMany({
      where: { teacherId: teacher.id },
      orderBy: { createdAt: "desc" },
      include: { subject: true },
    });

    return NextResponse.json({
      ok: true,
      createdCount,
      skippedCount,
      data: latest,
    });
  } catch (err: any) {
    logError("app/api/teacher/offers/create POST", err).catch(() => {});
    console.error("POST /api/teacher/offers/create error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
