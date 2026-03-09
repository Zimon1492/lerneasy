import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getStudentSession } from "@/app/lib/auth";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getStudentSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.email },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        address: true,
        schoolTrack: true,
        schoolForm: true,
        level: true,
        grade: true,
        schoolName: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: user });
  } catch (err) {
    logError("app/api/student/profile GET", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

/**
 * PATCH /api/student/profile
 * Body: { name?, address? }
 */
export async function PATCH(req: Request) {
  try {
    const session = await getStudentSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const data: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body.address === "string") data.address = body.address.trim();
    if (typeof body.schoolName === "string") data.schoolName = body.schoolName.trim();
    if (typeof body.schoolTrack === "string" && ["AHS", "BHS"].includes(body.schoolTrack))
      data.schoolTrack = body.schoolTrack;
    if (typeof body.schoolForm === "string" && body.schoolForm)
      data.schoolForm = body.schoolForm;

    const gradeNum = Number(body.grade);
    if (body.grade !== undefined && Number.isInteger(gradeNum) && gradeNum >= 1 && gradeNum <= 9) {
      data.grade = gradeNum;
      data.level = gradeNum <= 4 ? "UNTERSTUFE" : "OBERSTUFE";
    }

    const updated = await prisma.user.update({
      where: { email: session.email },
      data,
      select: { id: true, name: true, address: true, grade: true, schoolTrack: true, schoolForm: true, schoolName: true, level: true },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    logError("app/api/student/profile PATCH", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
