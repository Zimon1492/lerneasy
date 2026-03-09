import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { isAdminAuthed } from "@/app/api/admin/_auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [teachers, students, bookings, applications] = await Promise.all([
    prisma.teacher.count(),
    prisma.user.count(),
    prisma.booking.count(),
    prisma.teacherApplication.count(),
  ]);

  const paidRevenue = await prisma.booking.aggregate({
    where: { status: "paid" },
    _sum: { priceCents: true },
  });

  const pendingBookings = await prisma.booking.count({
    where: { status: { in: ["pending", "checkout_started", "accepted"] } },
  });

  return NextResponse.json({
    teachers,
    students,
    bookings,
    applications,
    pendingBookings,
    totalRevenueCents: paidRevenue._sum.priceCents ?? 0,
  });
}
