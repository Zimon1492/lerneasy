import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { cookies } from "next/headers";

export const runtime = "nodejs";

async function isAdmin() {
  const c = await cookies();
  return c.get("admin_auth")?.value === "1";
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = await prisma.errorLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json({ logs });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    await prisma.errorLog.delete({ where: { id } });
  } else {
    await prisma.errorLog.deleteMany();
  }

  return NextResponse.json({ ok: true });
}
