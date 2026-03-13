import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/app/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || (session.user as any).role !== "teacher") {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const teacher = await prisma.teacher.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!teacher) {
    return NextResponse.json({ error: "Lehrer nicht gefunden." }, { status: 404 });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      teacherId: teacher.id,
      status: { notIn: ["checkout_started", "pending"] },
    },
    orderBy: { start: "desc" },
    select: {
      id: true,
      start: true,
      end: true,
      priceCents: true,
      currency: true,
      status: true,
      note: true,
      stripePaymentIntentId: true,
      stripeCustomerId: true,
      createdAt: true,
      payoutAvailableAt: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({ bookings });
}
