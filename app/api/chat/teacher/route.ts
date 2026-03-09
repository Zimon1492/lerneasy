import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Lehrer-E-Mail fehlt" },
        { status: 400 }
      );
    }

    // Lehrer anhand der E-Mail finden
    const teacher = await prisma.teacher.findUnique({
      where: { email },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Lehrer nicht gefunden" },
        { status: 404 }
      );
    }

    // Alle Chats dieses Lehrers laden
    const chats = await prisma.chat.findMany({
      where: { teacherId: teacher.id },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // letzte Nachricht
        },
      },
    });

    return NextResponse.json({ chats });
  } catch (err) {
    logError("app/api/chat/teacher GET", err).catch(() => {});
    console.error("GET /api/chats/teacher error:", err);
    return NextResponse.json(
      { error: "Serverfehler beim Laden der Chats" },
      { status: 500 }
    );
  }
}
