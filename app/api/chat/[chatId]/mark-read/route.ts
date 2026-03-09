import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const runtime = "nodejs";

/**
 * PATCH /api/chat/[chatId]/mark-read
 * Body: { role: "teacher" | "student" }
 * Updates teacherLastRead or studentLastRead to now.
 */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const role = body?.role as "teacher" | "student" | undefined;

    if (!chatId || !role || (role !== "teacher" && role !== "student")) {
      return NextResponse.json({ error: "chatId und role (teacher|student) benoetigt" }, { status: 400 });
    }

    const chat = await prisma.chat.findUnique({ where: { id: chatId }, select: { id: true } });
    if (!chat) {
      return NextResponse.json({ error: "Chat nicht gefunden" }, { status: 404 });
    }

    await prisma.chat.update({
      where: { id: chatId },
      data: role === "teacher"
        ? { teacherLastRead: new Date() }
        : { studentLastRead: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/chat/[chatId]/mark-read error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
