// app/api/teacher/chat/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getTeacherSession } from "@/app/lib/auth";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const session = await getTeacherSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
    }

    // Use the authenticated session email — ignore any email query param
    const teacher = await prisma.teacher.findUnique({
      where: { email: session.email },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Lehrer nicht gefunden" }, { status: 404 });
    }

    const chats = await prisma.chat.findMany({
      where: { teacherId: teacher.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ chats });
  } catch (err) {
    logError("app/api/teacher/chat GET", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
