import { prisma } from "../../../lib/prisma";
import { stripe } from "../../../lib/stripe";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teacherId } = req.body;

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });

  if (!teacher?.stripeAccountId) {
    return res.status(400).json({ error: "Teacher has no Stripe account" });
  }

  const link = await stripe.accountLinks.create({
    account: teacher.stripeAccountId,
    refresh_url: `${process.env.NEXT_PUBLIC_DOMAIN}/teacher/onboarding`,
    return_url: `${process.env.NEXT_PUBLIC_DOMAIN}/teacher/dashboard`,
    type: "account_onboarding",
  });

  res.status(200).json({ url: link.url });
}
