import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { isAdminAuthed } from "@/app/api/admin/_auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      start: true,
      end: true,
      priceCents: true,
      currency: true,
      status: true,
      note: true,
      createdAt: true,
      teacher: { select: { id: true, name: true, email: true } },
      student: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ bookings });
}
