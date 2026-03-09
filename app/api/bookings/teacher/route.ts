// app/api/bookings/teacher/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const runtime = "nodejs";

/**
 * GET /api/bookings/teacher?email=teacher@mail.at
 * -> liefert alle Buchungen eines Lehrers + Schülerdaten
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "email fehlt" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher nicht gefunden" }, { status: 404 });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        teacherId: teacher.id,
        status: { in: ["payment_method_saved", "paid", "declined"] },
      },
      orderBy: { start: "asc" },
      select: {
        id: true,
        start: true,
        end: true,
        status: true,
        note: true,

        // ✅ Schülerdaten vollständig mitsenden
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            schoolName: true,
            schoolTrack: true,
            schoolForm: true,
            level: true,
            grade: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, bookings });
  } catch (err) {
    console.error("GET /api/bookings/teacher error:", err);
    return NextResponse.json({ error: "Serverfehler", bookings: [] }, { status: 500 });
  }
}
