import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

/**
 * GET /api/student/teacher-availability?teacherId=&studentEmail=
 * Returns weekly schedule, blocked periods, and whether teacher teaches student's school type.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = (searchParams.get("teacherId") || "").trim();
    const studentEmail = (searchParams.get("studentEmail") || "").trim().toLowerCase();

    if (!teacherId) {
      return NextResponse.json({ error: "teacherId fehlt" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true },
    });
    if (!teacher) {
      return NextResponse.json({ error: "Lehrer nicht gefunden" }, { status: 404 });
    }

    // Fetch weekly schedule and blocked periods in parallel
    const [weeklySchedule, blockedPeriods] = await Promise.all([
      prisma.teacherWeeklySchedule.findMany({
        where: { teacherId },
        orderBy: { weekday: "asc" },
        select: { weekday: true, fromTime: true, toTime: true, active: true },
      }),
      prisma.teacherUnavailability.findMany({
        where: { teacherId },
        orderBy: { fromDate: "asc" },
        select: { id: true, fromDate: true, toDate: true, note: true },
      }),
    ]);

    // Check if teacher teaches student's school type
    let teachesStudent: boolean | null = null; // null = unknown (no student info)
    let studentSchool: { schoolTrack: string | null; schoolForm: string | null; grade: number | null } | null = null;

    if (studentEmail) {
      const student = await prisma.user.findUnique({
        where: { email: studentEmail },
        select: { schoolTrack: true, schoolForm: true, grade: true },
      });

      if (student) {
        studentSchool = {
          schoolTrack: student.schoolTrack as string | null,
          schoolForm: student.schoolForm as string | null,
          grade: student.grade,
        };

        if (student.schoolTrack && student.schoolForm && student.grade != null) {
          // Check if any offer matches
          const matchingOffer = await prisma.teachingOffer.findFirst({
            where: {
              teacherId,
              schoolTrack: student.schoolTrack as any,
              schoolForm: student.schoolForm as any,
              minGrade: { lte: student.grade },
              maxGrade: { gte: student.grade },
            },
          });
          teachesStudent = matchingOffer !== null;
        } else {
          // Student profile incomplete — can't determine
          teachesStudent = null;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      weeklySchedule,
      blockedPeriods,
      teachesStudent,
      studentSchool,
    });
  } catch (err) {
    logError("app/api/student/teacher-availability GET", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
