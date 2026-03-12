// app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { logError } from "@/app/lib/logError";
import { rateLimitDb } from "@/lib/rateLimitDb";
import { makeAdminCookieValue } from "@/app/api/admin/_auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Rate limit: 5 attempts per IP per 15 minutes
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!await rateLimitDb(`admin-login:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Zu viele Anmeldeversuche. Bitte warte 15 Minuten." },
      { status: 429 }
    );
  }

  try {
    const { password } = await req.json();

    const envKeyRaw = process.env.ADMIN_KEY;
    if (!envKeyRaw) {
      return NextResponse.json(
        { error: "Serverkonfiguration fehlt." },
        { status: 500 }
      );
    }

    const envKey = String(envKeyRaw).trim();
    const input = String(password ?? "").trim();

    if (!input) {
      return NextResponse.json({ error: "Kein Passwort übergeben." }, { status: 400 });
    }

    // Timing-safe comparison to prevent timing attacks
    const inputBuf = Buffer.from(input);
    const keyBuf = Buffer.from(envKey);
    const match =
      inputBuf.length === keyBuf.length &&
      crypto.timingSafeEqual(inputBuf, keyBuf);

    if (!match) {
      return NextResponse.json({ error: "Ungültige Anmeldedaten." }, { status: 401 });
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_auth", makeAdminCookieValue(), {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 24h
      sameSite: "strict",
    });
    return res;
  } catch (err) {
    logError("app/api/admin/login POST", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler beim Login." }, { status: 500 });
  }
}
