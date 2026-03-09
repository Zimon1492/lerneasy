import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getStudentSession, getTeacherSession } from "@/app/lib/auth";

export const runtime = "nodejs";

/**
 * PATCH /api/chat/[chatId]/mark-read
 * Updates teacherLastRead or studentLastRead to now.
 * Role is derived from the session — not from the request body.
 */
export async function PATCH(
  _req: Request,
  ctx: { params: Promise<{ chatId: string }> }
) {
  try {
    const studentSession = await getStudentSession();
    const teacherSession = await getTeacherSession();
    const session = studentSession ?? teacherSession;

    if (!session) {
      return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
    }

    const { chatId } = await ctx.params;
    if (!chatId) {
      return NextResponse.json({ error: "chatId fehlt" }, { status: 400 });
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { teacher: { select: { email: true } } },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat nicht gefunden" }, { status: 404 });
    }

    // Authorization: only the student or teacher of this chat may mark it as read
    const isStudent = studentSession && chat.studentEmail === session.email;
    const isTeacher = teacherSession && chat.teacher.email === session.email;

    if (!isStudent && !isTeacher) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }

    await prisma.chat.update({
      where: { id: chatId },
      data: isTeacher
        ? { teacherLastRead: new Date() }
        : { studentLastRead: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/chat/[chatId]/mark-read error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
