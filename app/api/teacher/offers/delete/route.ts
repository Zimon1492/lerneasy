// app/api/teacher/offers/delete/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

/**
 * POST /api/teacher/offers/delete
 * Body: { offerId: string }  (oder { id: string } als Fallback)
 *
 * Löscht GENAU ein TeachingOffer.
 * Wichtig: Teacher.subject wird NICHT verändert.
 * Availability bleibt bestehen (offerId wird durch onDelete:SetNull auf null gesetzt).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // frontend sendet bei dir: { offerId }
    const offerId = (body?.offerId || body?.id || "").trim();

    if (!offerId) {
      return NextResponse.json({ error: "offerId fehlt" }, { status: 400 });
    }

    // optional: existiert es?
    const existing = await prisma.teachingOffer.findUnique({
      where: { id: offerId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Angebot nicht gefunden" }, { status: 404 });
    }

    await prisma.teachingOffer.delete({
      where: { id: offerId },
    });

    return NextResponse.json({ ok: true, deletedOfferId: offerId });
  } catch (err) {
    logError("app/api/teacher/offers/delete POST", err).catch(() => {});
    console.error("POST /api/teacher/offers/delete error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
