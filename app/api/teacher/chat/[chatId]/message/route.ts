import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export async function GET(req: Request, { params }: any) {
  try {
    const chatId = params.chatId;

    const messages = await prisma.chatMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
    });

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    });

    return NextResponse.json({
      messages,
      studentEmail: chat?.studentEmail || "",
    });
  } catch (err) {
    logError("app/api/teacher/chat/[chatId]/message GET", err).catch(() => {});
    console.error("GET chat messages error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: any) {
  try {
    const chatId = params.chatId;
    const { sender, text } = await req.json();

    const message = await prisma.chatMessage.create({
      data: {
        chatId,
        sender,
        text,
      },
    });

    return NextResponse.json({ message });
  } catch (err) {
    logError("app/api/teacher/chat/[chatId]/message POST", err).catch(() => {});
    console.error("POST chat message error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
