// app/api/teacher/chat/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email fehlt" },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Lehrer nicht gefunden" },
        { status: 404 }
      );
    }

    const chats = await prisma.chat.findMany({
      where: { teacherId: teacher.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ chats });
  } catch (err) {
    logError("app/api/teacher/chat GET", err).catch(() => {});
    console.error("GET /api/teacher/chat error:", err);
    return NextResponse.json(
      { error: "Serverfehler" },
      { status: 500 }
    );
  }
}
