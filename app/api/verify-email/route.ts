import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/verify-email?error=missing", req.url));
    }

    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, emailVerified: true } } },
    });

    if (!record) {
      return NextResponse.redirect(new URL("/verify-email?error=invalid", req.url));
    }

    if (record.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({ where: { token } });
      return NextResponse.redirect(new URL("/verify-email?error=expired", req.url));
    }

    // E-Mail als bestätigt markieren + Token löschen
    await prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    });
    await prisma.emailVerificationToken.delete({ where: { token } });

    return NextResponse.redirect(new URL("/?verified=1", req.url));
  } catch (err) {
    logError("api/verify-email GET", err).catch(() => {});
    return NextResponse.redirect(new URL("/verify-email?error=server", req.url));
  }
}
