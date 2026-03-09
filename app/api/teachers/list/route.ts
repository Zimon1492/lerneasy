// app/api/teachers/list/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

// GET /api/teachers/list
export async function GET() {
  try {
    const teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        name: true,
        subject: true,
        // email intentionally omitted from public list to prevent enumeration
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: teachers });
  } catch (err) {
    logError("app/api/teachers/list GET", err).catch(() => {});
    console.error("GET /api/teachers/list error:", err);
    return NextResponse.json(
      { data: [], error: "ServerFehler" },
      { status: 500 }
    );
  }
}
