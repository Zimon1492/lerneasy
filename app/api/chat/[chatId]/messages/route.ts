import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// -----------------------------------------------------
// GET: Messages + Meta (teacherEmail, studentEmail)
// -----------------------------------------------------
export async function GET(
  req: Request,
  ctx: { params: Promise<{ chatId: string }> }
) {
  try {
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
    const { chatId } = await ctx.params;

    if (!chatId) {
      return NextResponse.json({ error: "chatId fehlt" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const sender = body?.sender as "student" | "teacher" | "system" | undefined;
    const text = (body?.text as string | undefined)?.trim();

    if (!sender || !text) {
      return NextResponse.json(
        { error: "sender oder text fehlt" },
        { status: 400 }
      );
    }

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) {
      return NextResponse.json({ error: "Chat nicht gefunden" }, { status: 404 });
    }

    const msg = await prisma.chatMessage.create({
      data: {
        chatId,
        sender,
        text,
      },
    });

    return NextResponse.json({ ok: true, message: msg });
  } catch (err) {
    console.error("POST /api/chat/[chatId]/messages error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
