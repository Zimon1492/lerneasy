// app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs"; // WICHTIG: Zugriff auf process.env sicherstellen

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    const envKeyRaw = process.env.ADMIN_KEY;
    if (!envKeyRaw) {
      // Server hat den Key nicht geladen -> ENV/Neustart prüfen
      return NextResponse.json(
        { error: "Serverkonfiguration fehlt (ADMIN_KEY nicht gesetzt)." },
        { status: 500 }
      );
    }

    const envKey = String(envKeyRaw).trim();
    const input = String(password ?? "").trim();

    if (!input) {
      return NextResponse.json({ error: "Kein Passwort übergeben." }, { status: 400 });
    }

    if (input !== envKey) {
      return NextResponse.json({ error: "Falscher Admin-Key." }, { status: 401 });
    }

    // ✅ Cookie setzen
    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_auth", "1", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 24h
    });
    return res;
  } catch (err) {
    logError("app/api/admin/login POST", err).catch(() => {});
    console.error("Login-Fehler:", err);
    return NextResponse.json({ error: "Serverfehler beim Login." }, { status: 500 });
  }
}
