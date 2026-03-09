// app/api/student/availability/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getStudentSession } from "@/app/lib/auth";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

function norm(s: string) {
  return (s || "").trim();
}

function inferLevelFromGrade(grade: number | null | undefined) {
  if (!grade || !Number.isFinite(grade)) return null;
  return grade <= 4 ? "UNTERSTUFE" : "OBERSTUFE";
}

export async function GET(req: Request) {
  try {
    const session = await getStudentSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const teacherId = norm(searchParams.get("teacherId") || "");
    const subjectName = norm(searchParams.get("subject") || "");
    const studentEmail = session.email.toLowerCase();

    if (!teacherId) {
      return NextResponse.json({ error: "teacherId fehlt" }, { status: 400 });
    }
    if (!subjectName) {
      return NextResponse.json({ error: "subject fehlt" }, { status: 400 });
    }

    // Teacher + unterstufeOnly holen
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        unterstufeOnly: true,
        subject: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Lehrer nicht gefunden" }, { status: 404 });
    }

    // Subject id ermitteln (damit wir sauber matchen)
    const subject = await prisma.subject.findUnique({
      where: { name: subjectName },
      select: { id: true, name: true },
    });

    if (!subject) {
      return NextResponse.json({ error: "Fach nicht gefunden" }, { status: 404 });
    }

    // Studentprofil holen (muss Track/Form/Grade haben, sonst kann man nicht korrekt filtern)
    const student = await prisma.user.findUnique({
      where: { email: studentEmail },
      select: {
        email: true,
        schoolTrack: true,
        schoolForm: true,
        level: true,
        grade: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Schüler nicht gefunden. Bitte registrieren/einloggen." },
        { status: 404 }
      );
    }

    const studentTrack = student.schoolTrack; // AHS/BHS
    const studentForm = student.schoolForm;   // enum inkl ALL
    const studentGrade = student.grade;
    const studentLevel = (student.level as any) ?? inferLevelFromGrade(studentGrade);

    if (!studentTrack || !studentForm || !studentLevel || !studentGrade) {
      return NextResponse.json(
        { error: "Schülerprofil unvollständig (schoolTrack, schoolForm, level/grade fehlen)." },
        { status: 400 }
      );
    }

    // ✅ UnterstufeOnly: Oberstufe-Schüler dürfen gar nichts sehen
    if (teacher.unterstufeOnly && studentLevel === "OBERSTUFE") {
      return NextResponse.json({ ok: true, slots: [] });
    }

    // Slots laden mit sauberem Offer-Filter
    const slots = await prisma.availability.findMany({
      where: {
        teacherId: teacher.id,
        AND: [
          // ✅ Fachfilter:
          // - offerId null = "für alle / nicht zugeordnet" -> erlauben
          // - offer.subjectId muss passen
          {
            OR: [
              { offerId: null },
              { offer: { subjectId: subject.id } },
            ],
          },

          // ✅ Zielgruppenfilter:
          // - offerId null: zeigen wir (falls teacher grundsätzlich passt; unterstufeOnly oben schon abgefangen)
          // - offerId gesetzt: muss zum Schülerprofil passen
          {
            OR: [
              { offerId: null },
              {
                offer: {
                  schoolTrack: studentTrack,
                  level: studentLevel,
                  minGrade: { lte: studentGrade },
                  maxGrade: { gte: studentGrade },
                  OR: [
                    { schoolForm: "ALL" as any },
                    { schoolForm: studentForm as any },
                  ],
                },
              },
            ],
          },
        ],
      },
      orderBy: [{ date: "asc" }, { start: "asc" }],
      include: {
        offer: {
          include: {
            subject: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, slots });
  } catch (err) {
    logError("app/api/student/availability GET", err).catch(() => {});
    console.error("GET /api/student/availability error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
