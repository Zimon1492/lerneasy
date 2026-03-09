// pages/api/stripe/prices.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

//
//  prices.ts:
//    -Testseite zum Ausgeben der Angebote
//


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const prices = await stripe.prices.list({
      expand: ["data.product"],
      active: true,
    });

    res.status(200).json(prices.data);
  } catch (error: any) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: error.message });
  }
}
