// pages/api/cron/cleanupUnverified.ts
// Läuft täglich – löscht unverifizierte Accounts die älter als 48h sind
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { logError } from "@/app/lib/logError";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const secret = req.headers["x-cron-secret"];
  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Lösche User, die sich registriert aber nie verifiziert haben
    // emailVerified IS NULL UND createdAt > 48h her
    const deleted = await prisma.user.deleteMany({
      where: {
        emailVerified: null,
        createdAt: { lt: cutoff },
        // Nur Schüler (nicht Lehrer oder Admins)
        role: "student",
      },
    });

    console.log(`[cleanupUnverified] Gelöschte unverifizierte Accounts: ${deleted.count}`);
    return res.json({ ok: true, deleted: deleted.count });
  } catch (err) {
    logError("cron/cleanupUnverified", err).catch(() => {});
    return res.status(500).json({ error: "Serverfehler" });
  }
}
