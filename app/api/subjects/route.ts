// app/api/subjects/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: subjects });
  } catch (err) {
    logError("app/api/subjects GET", err).catch(() => {});
    console.error("GET /api/subjects error:", err);
    return NextResponse.json({ data: [], error: "Serverfehler" }, { status: 500 });
  }
}
