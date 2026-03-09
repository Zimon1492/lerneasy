import prisma from "./prisma";

export type PricingSettings = {
  priceMin: number;
  priceMax: number;
  priceN: number;
  teacherShare: number; // decimal, e.g. 0.70
};

export type FullSettings = PricingSettings & {
  pending: {
    priceMin: number;
    priceMax: number;
    priceN: number;
    teacherShare: number;
    effectiveFrom: Date;
  } | null;
};

export const SETTINGS_DEFAULTS: PricingSettings = {
  priceMin: 25,
  priceMax: 45,
  priceN: 15,
  teacherShare: 0.70,
};

/**
 * Gibt die aktuell aktiven Einstellungen zurück.
 * Wenn pendingEffectiveFrom in der Vergangenheit liegt, werden die
 * Pending-Werte automatisch als neue aktive Werte übernommen.
 */
export async function getPlatformSettings(): Promise<PricingSettings> {
  try {
    const s = await prisma.platformSettings.findUnique({ where: { id: "default" } });
    if (!s) return SETTINGS_DEFAULTS;

    // Auto-Promotion: Pending-Werte aktivieren wenn Stichtag erreicht
    if (
      s.pendingEffectiveFrom &&
      s.pendingEffectiveFrom <= new Date() &&
      s.pendingPriceMin != null &&
      s.pendingPriceMax != null &&
      s.pendingPriceN != null &&
      s.pendingTeacherShare != null
    ) {
      await prisma.platformSettings.update({
        where: { id: "default" },
        data: {
          priceMin: s.pendingPriceMin,
          priceMax: s.pendingPriceMax,
          priceN: s.pendingPriceN,
          teacherShare: s.pendingTeacherShare,
          pendingPriceMin: null,
          pendingPriceMax: null,
          pendingPriceN: null,
          pendingTeacherShare: null,
          pendingEffectiveFrom: null,
        },
      });
      return {
        priceMin: s.pendingPriceMin,
        priceMax: s.pendingPriceMax,
        priceN: s.pendingPriceN,
        teacherShare: s.pendingTeacherShare,
      };
    }

    return {
      priceMin: s.priceMin,
      priceMax: s.priceMax,
      priceN: s.priceN,
      teacherShare: s.teacherShare,
    };
  } catch {
    return SETTINGS_DEFAULTS;
  }
}

/**
 * Gibt aktive + geplante Einstellungen zurück (nur für Admin-UI).
 */
export async function getFullSettings(): Promise<FullSettings> {
  try {
    const s = await prisma.platformSettings.findUnique({ where: { id: "default" } });
    if (!s) return { ...SETTINGS_DEFAULTS, pending: null };

    const active: PricingSettings = {
      priceMin: s.priceMin,
      priceMax: s.priceMax,
      priceN: s.priceN,
      teacherShare: s.teacherShare,
    };

    const pending =
      s.pendingEffectiveFrom &&
      s.pendingPriceMin != null &&
      s.pendingPriceMax != null &&
      s.pendingPriceN != null &&
      s.pendingTeacherShare != null
        ? {
            priceMin: s.pendingPriceMin,
            priceMax: s.pendingPriceMax,
            priceN: s.pendingPriceN,
            teacherShare: s.pendingTeacherShare,
            effectiveFrom: s.pendingEffectiveFrom,
          }
        : null;

    return { ...active, pending };
  } catch {
    return { ...SETTINGS_DEFAULTS, pending: null };
  }
}
