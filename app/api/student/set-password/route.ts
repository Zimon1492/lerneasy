import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json().catch(() => ({}));
    if (!token || !password || password.length < 8) {
      return NextResponse.json({ error: "Token und Passwort (min. 8 Zeichen) erforderlich." }, { status: 400 });
    }

    const record = await prisma.userPasswordResetToken.findUnique({ where: { token } });
    if (!record || record.expiresAt < new Date()) {
      return NextResponse.json({ error: "Link ungültig oder abgelaufen." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: record.userId }, data: { password: hashed } });
    await prisma.userPasswordResetToken.delete({ where: { token } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError("api/student/set-password POST", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
