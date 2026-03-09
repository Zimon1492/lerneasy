import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { logError } from "@/app/lib/logError";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
    }

    // optional: du schickst im Frontend ?email=...
    // wir akzeptieren es, aber nutzen als Wahrheit die Session
    const { searchParams } = new URL(req.url);
    const emailFromQuery = searchParams.get("email");

    // Sicherheit: wenn Query-Email gesetzt ist, muss sie zur Session passen
    if (emailFromQuery && emailFromQuery !== session.user.email) {
      return NextResponse.json(
        { error: "Ungültige Anfrage (Email passt nicht zur Session)" },
        { status: 403 }
      );
    }

    const chats = await prisma.chat.findMany({
      where: { studentEmail: session.user.email },
      include: {
        teacher: { select: { id: true, name: true, email: true, subject: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Damit dein Frontend chat.teacherEmail anzeigen kann:
    const mapped = chats.map((c) => ({
      id: c.id,
      teacherEmail: c.teacher.email,
      teacherName: c.teacher.name,
      subject: c.teacher.subject,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ chats: mapped });
  } catch (err) {
    logError("app/api/student/chat GET", err).catch(() => {});
    console.error("GET /api/student/chat error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
