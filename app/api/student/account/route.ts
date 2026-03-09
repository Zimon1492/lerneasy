import { NextResponse } from "next/server";
import { getStudentSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

export async function DELETE() {
  try {
    const session = await getStudentSession();
    if (!session) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.email },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "Konto nicht gefunden." }, { status: 404 });

    // Delete in dependency order (Chat uses studentEmail, not a FK to User)
    await prisma.userPasswordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.teacherRating.deleteMany({ where: { studentId: user.id } });

    // Chat uses studentEmail string, not a User FK
    const chats = await prisma.chat.findMany({
      where: { studentEmail: session.email },
      select: { id: true },
    });
    await prisma.chatMessage.deleteMany({ where: { chatId: { in: chats.map((c) => c.id) } } });
    await prisma.chat.deleteMany({ where: { studentEmail: session.email } });

    await prisma.booking.deleteMany({ where: { studentId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError("api/student/account DELETE", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
