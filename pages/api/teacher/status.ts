import { prisma } from "../../../lib/prisma";
import { stripe } from "../../../lib/stripe";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teacherId } = req.query;

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId as string } });
  if (!teacher?.stripeAccountId)
    return res.status(200).json({ hasConnect: false });

  const account = await stripe.accounts.retrieve(teacher.stripeAccountId);

  res.status(200).json({
    hasConnect: true,
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    requirements: account.requirements,
  });
}
