import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export const runtime = "nodejs";

/**
 * GET /api/student/unread-chats-count
 * Returns how many chats have messages newer than studentLastRead.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ count: 0 });
    }

    const studentEmail = session.user.email.toLowerCase();

    const chats = await prisma.chat.findMany({
      where: { studentEmail },
      select: {
        id: true,
        studentLastRead: true,
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
      // only count messages sent by the teacher (not by the student themselves)
      if (latest.sender === "student") return false;
      if (!chat.studentLastRead) return true;
      return latest.createdAt > chat.studentLastRead;
    }).length;

    return NextResponse.json({ count });
  } catch (err) {
    console.error("GET /api/student/unread-chats-count error:", err);
    return NextResponse.json({ count: 0 });
  }
}
