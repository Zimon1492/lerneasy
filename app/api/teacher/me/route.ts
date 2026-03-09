// app/api/teacher/me/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "email fehlt" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, subject: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: teacher });
  } catch (err) {
    logError("app/api/teacher/me GET", err).catch(() => {});
    console.error("GET /api/teacher/me error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
