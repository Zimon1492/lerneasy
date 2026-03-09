// pages/api/teacher/connect-balance.ts

import { prisma } from "../../../lib/prisma";
import { stripe } from "../../../lib/stripe";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teacherId } = req.query;

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId as string },
  });

  if (!teacher?.stripeAccountId) {
    return res.json({ available: 0, pending: 0 });
  }

  const balance = await stripe.balance.retrieve({
    stripeAccount: teacher.stripeAccountId,
  });

  const available = balance.available?.[0]?.amount || 0;
  const pending = balance.pending?.[0]?.amount || 0;

  res.json({
    availableCents: available,
    available: available / 100,
    pendingCents: pending,
    pending: pending / 100,
  });
}
