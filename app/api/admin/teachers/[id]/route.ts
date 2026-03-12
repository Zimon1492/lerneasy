import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { isAdminAuthed } from "@/app/api/admin/_auth";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { subject } = body as { subject?: string };

  if (!subject?.trim()) {
    return NextResponse.json({ error: "subject darf nicht leer sein." }, { status: 400 });
  }

  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) return NextResponse.json({ error: "Lehrer nicht gefunden." }, { status: 404 });

  await prisma.teacher.update({
    where: { id },
    data: { subject: subject.trim() },
  });

  // Ensure each subject exists in the Subject table so the teacher can manage offers
  const subjectNames = subject.split(",").map((s) => s.trim()).filter(Boolean);
  for (const name of subjectNames) {
    await prisma.subject.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  return NextResponse.json({ ok: true });
}

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
