import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/app/api/admin/_auth";
import prisma from "@/app/lib/prisma";
import { getFullSettings } from "@/app/lib/settings";
import { logError } from "@/app/lib/logError";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const s = await getFullSettings();
  return NextResponse.json(s);
}

/**
 * PATCH body:
 *   { priceMin, priceMax, priceN, teacherShare, immediate?: boolean }
 *
 * immediate=true  → sofort aktiv (nur für Ersteinrichtung / Korrekturen ohne Nutzerwirkung)
 * immediate=false → als pending speichern, effectiveFrom wird von notify-agb-change gesetzt
 */
export async function PATCH(req: Request) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json().catch(() => ({}));
    const immediate = body?.immediate === true;

    const priceMin     = typeof body.priceMin     === "number" && body.priceMin >= 0          ? body.priceMin     : null;
    const priceMax     = typeof body.priceMax     === "number" && body.priceMax > 0           ? body.priceMax     : null;
    const priceN       = typeof body.priceN       === "number" && body.priceN > 0             ? body.priceN       : null;
    const teacherShare = typeof body.teacherShare === "number" && body.teacherShare > 0 && body.teacherShare <= 1 ? body.teacherShare : null;

    if (priceMin == null || priceMax == null || priceN == null || teacherShare == null) {
      return NextResponse.json({ error: "Ungültige Werte." }, { status: 400 });
    }

    if (immediate) {
      // Sofort anwenden — pending löschen falls vorhanden
      const s = await prisma.platformSettings.upsert({
        where: { id: "default" },
        create: { id: "default", priceMin, priceMax, priceN, teacherShare },
        update: {
          priceMin, priceMax, priceN, teacherShare,
          pendingPriceMin: null, pendingPriceMax: null,
          pendingPriceN: null, pendingTeacherShare: null,
          pendingEffectiveFrom: null,
        },
      });
      return NextResponse.json({ ok: true, immediate: true, data: s });
    } else {
      // Als pending speichern (effectiveFrom wird von notify-agb-change gesetzt)
      const s = await prisma.platformSettings.upsert({
        where: { id: "default" },
        create: {
          id: "default",
          pendingPriceMin: priceMin, pendingPriceMax: priceMax,
          pendingPriceN: priceN, pendingTeacherShare: teacherShare,
        },
        update: {
          pendingPriceMin: priceMin, pendingPriceMax: priceMax,
          pendingPriceN: priceN, pendingTeacherShare: teacherShare,
        },
      });
      return NextResponse.json({ ok: true, immediate: false, data: s });
    }
  } catch (err) {
    logError("api/admin/settings PATCH", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
