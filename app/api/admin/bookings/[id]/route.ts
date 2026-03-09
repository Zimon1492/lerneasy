import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { isAdminAuthed } from "@/app/api/admin/_auth";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthed(_req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const exists = await prisma.booking.findUnique({ where: { id } });
  if (!exists) return NextResponse.json({ error: "Buchung nicht gefunden." }, { status: 404 });

  await prisma.booking.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();

  if (!status) return NextResponse.json({ error: "status fehlt." }, { status: 400 });

  const updated = await prisma.booking.update({
    where: { id },
    data: { status },
    select: { id: true, status: true },
  });

  return NextResponse.json({ ok: true, booking: updated });
}
