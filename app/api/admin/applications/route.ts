import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { isAdminAuthed } from "@/app/api/admin/_auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applications = await prisma.teacherApplication.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ applications });
}

export async function DELETE(req: Request) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id fehlt." }, { status: 400 });

  await prisma.teacherApplication.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
