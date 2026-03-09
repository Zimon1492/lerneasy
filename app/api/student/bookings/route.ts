import { NextResponse } from "next/server";
import { getStudentSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getStudentSession();

  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.email },
    include: {
      bookings: {
        include: {
          teacher: { select: { id: true, name: true, subject: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json({ bookings: user?.bookings ?? [] });
}
