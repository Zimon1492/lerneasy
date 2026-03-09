// pages/api/teacher/platform-balance.ts

import { prisma } from "../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teacherId } = req.query;

  const now = new Date();
  const cutoff = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 Tage

  // Buchungen, die bezahlt sind, aber noch NICHT transferiert werden sollen
  const bookings = await prisma.booking.findMany({
    where: {
      teacherId: teacherId as string,
      status: "paid",
      end: { gt: cutoff }, // Termin < 15 Tage her
    },
  });

  const teacherPercent = 0.7;

  const amountCents = bookings.reduce((sum: number, booking: any) => {
    return sum + Math.round(booking.priceCents * teacherPercent);
    }, 0);

  res.json({
    pendingReleaseCents: amountCents,
    pendingRelease: amountCents / 100,
  });
}
