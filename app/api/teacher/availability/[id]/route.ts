// app/api/teacher/availability/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

/**
 * DELETE /api/teacher/availability/:id?email=...
 * -> löscht ein Zeitfenster, aber nur wenn es dem Lehrer gehört
 */
export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "").trim().toLowerCase();

    if (!id) {
      return NextResponse.json({ error: "id fehlt" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "email fehlt" }, { status: 400 });
    }

    // Lehrer finden
    const teacher = await prisma.teacher.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher nicht gefunden" }, { status: 404 });
    }

    // Slot prüfen + Ownership
    const slot = await prisma.availability.findUnique({
      where: { id },
      select: { id: true, teacherId: true },
    });

    if (!slot) {
      return NextResponse.json({ error: "Zeitfenster nicht gefunden" }, { status: 404 });
    }

    if (slot.teacherId !== teacher.id) {
      return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
    }

    await prisma.availability.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError("app/api/teacher/availability/[id] DELETE", err).catch(() => {});
    console.error("DELETE /api/teacher/availability/[id] error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
