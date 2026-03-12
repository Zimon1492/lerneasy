import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { isAdminAuthed } from "@/app/api/admin/_auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "zahlungsbeleg" | "gutschrift" | null = alle

  const invoices = await prisma.invoice.findMany({
    where: type ? { type } : undefined,
    orderBy: { issuedAt: "desc" },
  });

  return NextResponse.json({ invoices });
}
