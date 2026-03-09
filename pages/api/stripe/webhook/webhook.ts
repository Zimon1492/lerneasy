// pages/api/stripe/webhook.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { stripe } from "../../../../lib/stripe";
import { prisma } from "../../../../lib/prisma";

//
//  Webhook.ts:
//    Sobald ein Stripe-Ereignis passiert, wird je nach case programm ausgeführt.
//    In lokaler Entwicklungs-Umgebung muss im Hintergrund 
//    stripe listen --forward-to http://localhost:3000/api/stripe/webhook
//    In einer Konsole ausgeführt werden. Später wenn alles Live ist, wird es nicht mehr benötigt.
//    Falls in lokaler Umgebung nämlich nicht gelauscht wird, werden die cases nicht ausgeführt
//


// Disable Next.js body-parser
export const config = {
  api: {
    bodyParser: false,
  },
};

// Read raw body
const buffer = async (req: NextApiRequest): Promise<Buffer> => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"] as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ---------------------------------------------------
  // 🔥 Handle Stripe events
  // ---------------------------------------------------
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      // For setup mode:
      const bookingId = session.metadata?.bookingId as string | undefined;
      const customerId = session.customer as string | undefined;
      const setupIntentId = session.setup_intent as string | undefined;
      // ❗ Payment Method kommt NICHT aus session → SetupIntent muss abgerufen werden
      let paymentMethodId: string | null = null;

      if (setupIntentId) {
        const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
        paymentMethodId = setupIntent.payment_method as string;
      }

      if (bookingId) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            stripeCustomerId: customerId,
            stripeSetupIntentId: setupIntentId,
            stripePaymentMethodId: paymentMethodId,
            status: "payment_method_saved",
          },
        });
      }
      console.log("checkout.session.completed handled", { bookingId, customerId, setupIntentId });
      break;


    case "payment_intent.succeeded":
      console.log("💸 Zahlung erfolgreich");
      break;

    case "payment_intent.payment_failed":
      console.log("❌ Zahlung fehlgeschlagen");
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
}
