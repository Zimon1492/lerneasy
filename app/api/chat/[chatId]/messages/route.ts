import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getStudentSession, getTeacherSession } from "@/app/lib/auth";

export const runtime = "nodejs";

// -----------------------------------------------------
// GET: Messages + Meta (teacherEmail, studentEmail)
// -----------------------------------------------------
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ chatId: string }> }
) {
  try {
    // Auth: must be a logged-in student or teacher
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
      include: {
        teacher: { select: { email: true, name: true } },
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat nicht gefunden" }, { status: 404 });
    }

    // Authorization: only the student or teacher of this chat may read it
    const isStudent = studentSession && chat.studentEmail === session.email;
    const isTeacher = teacherSession && chat.teacher.email === session.email;
    if (!isStudent && !isTeacher) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      studentEmail: chat.studentEmail,
      teacherEmail: chat.teacher.email,
      teacherName: chat.teacher.name,
      messages,
    });
  } catch (err) {
    console.error("GET /api/chat/[chatId]/messages error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

// -----------------------------------------------------
// POST: Neue Message speichern
// -----------------------------------------------------
export async function POST(
  req: Request,
  ctx: { params: Promise<{ chatId: string }> }
) {
  try {
    // Auth: must be a logged-in student or teacher
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

    const body = await req.json().catch(() => ({}));
    const text = (body?.text as string | undefined)?.trim();

    if (!text) {
      return NextResponse.json({ error: "text fehlt" }, { status: 400 });
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { teacher: { select: { email: true } } },
    });
    if (!chat) {
      return NextResponse.json({ error: "Chat nicht gefunden" }, { status: 404 });
    }

    // Authorization: only the student or teacher of this chat may write
    const isStudent = studentSession && chat.studentEmail === session.email;
    const isTeacher = teacherSession && chat.teacher.email === session.email;
    if (!isStudent && !isTeacher) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }

    // Derive sender from session role — never trust client-supplied sender
    const sender: "student" | "teacher" = isTeacher ? "teacher" : "student";

    const msg = await prisma.chatMessage.create({
      data: { chatId, sender, text },
    });

    return NextResponse.json({ ok: true, message: msg });
  } catch (err) {
    console.error("POST /api/chat/[chatId]/messages error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
