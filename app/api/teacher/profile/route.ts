import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "email fehlt" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        subject: true,
        profilePicture: true,
        address: true,
        description: true,
        taxNumber: true,
        unterstufeOnly: true,
        schoolTrack: true,
        allowedForms: true,
        ratings: { select: { stars: true } },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher nicht gefunden" }, { status: 404 });
    }

    const avgRating =
      teacher.ratings.length > 0
        ? teacher.ratings.reduce((s, r) => s + r.stars, 0) / teacher.ratings.length
        : null;

    return NextResponse.json({
      ok: true,
      data: { ...teacher, avgRating, ratingCount: teacher.ratings.length },
    });
  } catch (err) {
    logError("app/api/teacher/profile GET", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

/**
 * PATCH /api/teacher/profile
 * Body: { email, description?, address?, name? }
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body?.email as string | undefined)?.trim().toLowerCase();

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

    const data: Record<string, string> = {};
    if (typeof body.description === "string") data.description = body.description.trim();
    if (typeof body.address === "string") data.address = body.address.trim();
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body.taxNumber === "string") data.taxNumber = body.taxNumber.trim();

    const updated = await prisma.teacher.update({
      where: { id: teacher.id },
      data,
      select: { id: true, name: true, description: true, address: true, taxNumber: true },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    logError("app/api/teacher/profile PATCH", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
