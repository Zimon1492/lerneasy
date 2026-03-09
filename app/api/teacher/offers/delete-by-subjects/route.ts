// app/api/teacher/offers/delete-by-subjects/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

/**
 * POST /api/teacher/offers/delete-by-subjects
 * Body: { email, subjectId }
 *
 * ✅ Löscht NUR TeachingOffers (und löst offerId in Availability),
 * ❌ verändert NICHT Teacher.subject (die Profil-Fächer-Liste)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const email = (body?.email as string | undefined)?.trim().toLowerCase();
    const subjectId = body?.subjectId as string | undefined;

    if (!email || !subjectId) {
      return NextResponse.json(
        { error: "Fehlende Felder: email, subjectId" },
        { status: 400 }
      );
    }

    // Teacher finden
    const teacher = await prisma.teacher.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher nicht gefunden." }, { status: 404 });
    }

    // Alle Offers dieses Lehrers für das Subject holen
    const offers = await prisma.teachingOffer.findMany({
      where: { teacherId: teacher.id, subjectId },
      select: { id: true },
    });

    const offerIds = offers.map((o) => o.id);

    // Nichts zu löschen -> ok true
    if (offerIds.length === 0) {
      return NextResponse.json({ ok: true, deletedOffers: 0 });
    }

    // Transaktion: erst Availabilities entkoppeln, dann Offers löschen
    const result = await prisma.$transaction(async (tx) => {
      // Availabilities, die auf diese offers zeigen -> offerId = null
      await tx.availability.updateMany({
        where: { offerId: { in: offerIds } },
        data: { offerId: null },
      });

      // Offers löschen
      const del = await tx.teachingOffer.deleteMany({
        where: { id: { in: offerIds }, teacherId: teacher.id },
      });

      return del.count;
    });

    return NextResponse.json({ ok: true, deletedOffers: result });
  } catch (err) {
    logError("app/api/teacher/offers/delete-by-subjects POST", err).catch(() => {});
    console.error("POST /api/teacher/offers/delete-by-subjects error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
