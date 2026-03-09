import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const runtime = "nodejs";

/**
 * GET /api/teacher/unread-chats-count?email=...
 * Returns how many chats have messages newer than teacherLastRead.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ count: 0 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ count: 0 });
    }

    const chats = await prisma.chat.findMany({
      where: { teacherId: teacher.id },
      select: {
        id: true,
        teacherLastRead: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, sender: true },
        },
      },
    });

    const count = chats.filter((chat) => {
      const latest = chat.messages[0];
      if (!latest) return false;
      // only count messages sent by the student (not by the teacher themselves)
      if (latest.sender === "teacher") return false;
      if (!chat.teacherLastRead) return true;
      return latest.createdAt > chat.teacherLastRead;
    }).length;

    return NextResponse.json({ count });
  } catch (err) {
    console.error("GET /api/teacher/unread-chats-count error:", err);
    return NextResponse.json({ count: 0 });
  }
}
