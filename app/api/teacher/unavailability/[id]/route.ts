import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

/**
 * DELETE /api/teacher/unavailability/[id]?email=...
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "").trim().toLowerCase();
    const id = params.id;

    if (!email) {
      return NextResponse.json({ error: "email fehlt" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher nicht gefunden" }, { status: 404 });
    }

    const period = await prisma.teacherUnavailability.findFirst({
      where: { id, teacherId: teacher.id },
    });

    if (!period) {
      return NextResponse.json({ error: "Zeitraum nicht gefunden" }, { status: 404 });
    }

    await prisma.teacherUnavailability.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError("app/api/teacher/unavailability/[id] DELETE", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
