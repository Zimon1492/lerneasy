import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { isAdminAuthed } from "@/app/api/admin/_auth";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthed(_req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const exists = await prisma.teacher.findUnique({ where: { id } });
  if (!exists) return NextResponse.json({ error: "Lehrer nicht gefunden." }, { status: 404 });

  await prisma.teacher.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
