import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import crypto from "crypto";
import { rateLimit } from "@/lib/rateLimit";
import { sendVerificationEmail } from "@/app/lib/mailer";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!rateLimit(`resend-verification:${ip}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Zu viele Versuche. Bitte versuche es in einer Stunde erneut." },
      { status: 429 }
    );
  }

  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "E-Mail fehlt." }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true, emailVerified: true },
    });

    // Gleiche Antwort egal ob User existiert (verhindert E-Mail-Enumeration)
    if (!user || user.emailVerified) {
      return NextResponse.json({ ok: true });
    }

    // Alte Tokens löschen + neuen erstellen
    await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.emailVerificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendVerificationEmail(user.email, user.name, token).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError("api/resend-verification POST", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
