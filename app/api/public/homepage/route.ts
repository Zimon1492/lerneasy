import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const [teachers, ratings] = await Promise.all([
    prisma.teacher.findMany({
      include: { ratings: { select: { stars: true } } },
    }),
    prisma.teacherRating.findMany({
      where: { comment: { not: null } },
      include: {
        student: { select: { name: true } },
        teacher: { select: { subject: true } },
      },
    }),
  ]);

  const teacherData = teachers
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((t) => ({
    id: t.id,
    name: t.name,
    subject: t.subject,
    profilePicture: t.profilePicture ?? null,
    avgRating:
      t.ratings.length > 0
        ? Math.round((t.ratings.reduce((s, r) => s + r.stars, 0) / t.ratings.length) * 10) / 10
        : null,
    ratingCount: t.ratings.length,
  }));

  // pick up to 3 random ratings with a comment
  const shuffled = ratings.sort(() => Math.random() - 0.5).slice(0, 3);
  const ratingData = shuffled.map((r) => ({
    id: r.id,
    stars: r.stars,
    comment: r.comment,
    studentName: r.student.name ?? "Schüler:in",
    teacherSubject: r.teacher.subject,
  }));

  return NextResponse.json({ teachers: teacherData, ratings: ratingData });
}
