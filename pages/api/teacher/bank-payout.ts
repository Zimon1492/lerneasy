import { stripe } from "../../../lib/stripe";
import { prisma } from "../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teacherId } = req.body;

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId }
  });

  if (!teacher || !teacher.stripeAccountId) {
    return res.status(400).json({ error: "Teacher has no connect account" });
  }

  // Stripe Connect Guthaben abrufen
  const balance = await stripe.balance.retrieve({
    stripeAccount: teacher.stripeAccountId
  });

  const available = balance.available?.[0]?.amount || 0;

  if (available <= 0) {
    return res.status(400).json({ error: "No available balance" });
  }

  // Auszahlung AUSLÖSEN
  const payout = await stripe.payouts.create({
    amount: available,
    currency: "eur",
  }, {
    stripeAccount: teacher.stripeAccountId
  });

  return res.json({ success: true, payout });
}
