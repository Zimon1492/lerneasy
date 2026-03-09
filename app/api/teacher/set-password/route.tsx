import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { logError } from "@/app/lib/logError";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { token, password } = (await req.json()) as {
      token?: string;
      password?: string;
    };

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token oder Passwort fehlt." },
        { status: 400 }
      );
    }

    // Token in DB suchen
    const reset = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { teacher: true },
    });

    if (!reset) {
      return NextResponse.json({ error: "Ungültiger oder abgelaufener Link." }, { status: 400 });
    }

    // Ablauf prüfen
    if (reset.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: reset.id } });
      return NextResponse.json({ error: "Dieser Link ist abgelaufen." }, { status: 400 });
    }

    // Neues Passwort hashen und speichern
    const hashed = await bcrypt.hash(password, 10);
    await prisma.teacher.update({
      where: { id: reset.teacherId },
      data: { password: hashed, mustChangePassword: false },
    });

    // Token löschen
    await prisma.passwordResetToken.delete({ where: { id: reset.id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError("app/api/teacher/set-password POST", err).catch(() => {});
    console.error("POST /api/teacher/set-password error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
