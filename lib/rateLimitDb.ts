/**
 * Persistenter Rate-Limiter auf PostgreSQL-Basis.
 * Funktioniert korrekt auf Vercel (serverless) — kein in-memory State nötig.
 * Verwendet Prisma-Transaktionen für atomare Inkrementierung.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export async function rateLimitDb(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const entry = await tx.rateLimitEntry.findUnique({ where: { key } });

      // Kein Eintrag oder Zeitfenster abgelaufen → zurücksetzen
      if (!entry || entry.resetAt < now) {
        await tx.rateLimitEntry.upsert({
          where:  { key },
          create: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) },
          update: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
        });
        return true;
      }

      // Limit überschritten
      if (entry.count >= limit) return false;

      // Zähler erhöhen
      await tx.rateLimitEntry.update({
        where: { key },
        data:  { count: { increment: 1 } },
      });
      return true;
    });

    return result;
  } catch {
    // Im Fehlerfall (DB nicht erreichbar) → Request durchlassen, nicht blockieren
    return true;
  }
}
