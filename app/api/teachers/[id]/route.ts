// app/api/teachers/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        profilePicture: true,
        description: true,
        address: true,
        ratings: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            stars: true,
            comment: true,
            createdAt: true,
            student: { select: { name: true } },
          },
        },
        offers: {
          select: { subject: { select: { name: true } } },
          distinct: ["subjectId"],
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Lehrer nicht gefunden" }, { status: 404 });
    }

    const avgRating =
      teacher.ratings.length > 0
        ? teacher.ratings.reduce((s, r) => s + r.stars, 0) / teacher.ratings.length
        : null;

    // Distinct subject names from actual TeachingOffers
    const offerSubjects = [...new Set(teacher.offers.map((o) => o.subject.name).filter(Boolean))];

    return NextResponse.json({
      data: { ...teacher, avgRating, ratingCount: teacher.ratings.length, offerSubjects },
    });
  } catch (err) {
    logError("app/api/teachers/[id] GET", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
