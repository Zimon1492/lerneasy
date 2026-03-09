import { prisma } from "../../../lib/prisma";
import { stripe } from "../../../lib/stripe";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 Tage

  const due = await prisma.booking.findMany({
    where: {
      status: "paid",
      end: { lt: cutoff },
    },
    include: { teacher: true },
  });

  const results = [];

  for (const booking of due) {
    if (!booking.teacher.stripeAccountId) continue;

    const account = await stripe.accounts.retrieve(booking.teacher.stripeAccountId);

    if (!account.charges_enabled || !account.payouts_enabled) {
      console.log("Account not verified:", booking.teacherId);
      continue;
    }

    const teacherAmount = Math.round(booking.priceCents * 0.6);

    const transfer = await stripe.transfers.create({
      amount: teacherAmount,
      currency: "eur",
      destination: booking.teacher.stripeAccountId,
      transfer_group: booking.id,
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "teacher_paid" },
    });

    results.push({ bookingId: booking.id, transferId: transfer.id });
  }

  res.json(results);
}
