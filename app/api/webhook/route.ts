import { NextRequest, NextResponse } from "next/server";
import { getStripe, getFrequencyFromPrice } from "../../../lib/stripe/client";
import { supabaseServer } from "../../../lib/supabase/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const sb = supabaseServer();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.metadata?.subscription_id;
        const frequency = session.metadata?.frequency as "weekly" | "daily";

        if (subscriptionId && frequency) {
          await sb
            .from("subscriptions")
            .update({
              frequency,
              stripe_subscription_id: session.subscription as string,
              stripe_status: "active",
            })
            .eq("id", subscriptionId);

          console.log(`[Webhook] Upgraded subscription ${subscriptionId} to ${frequency}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const status = subscription.status;
        const priceId = subscription.items.data[0]?.price?.id;
        const frequency = priceId ? getFrequencyFromPrice(priceId) : undefined;

        console.log(`[Webhook] subscription.updated - priceId: ${priceId}, resolved frequency: ${frequency}`);

        // Find subscription by stripe_subscription_id
        const { data: sub } = await sb
          .from("subscriptions")
          .select("id, frequency")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (sub) {
          // Only update stripe_status, NOT frequency
          // Frequency is managed by our upgrade/checkout endpoints directly
          // This prevents race conditions where webhook overwrites API changes
          await sb
            .from("subscriptions")
            .update({ stripe_status: status })
            .eq("id", sub.id);

          console.log(`[Webhook] Updated subscription ${sub.id} status to ${status} (frequency unchanged: ${sub.frequency})`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Find subscription and downgrade to monthly (free)
        const { data: sub } = await sb
          .from("subscriptions")
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (sub) {
          await sb
            .from("subscriptions")
            .update({
              frequency: "monthly",
              stripe_status: "canceled",
              stripe_subscription_id: null,
            })
            .eq("id", sub.id);

          console.log(`[Webhook] Downgraded subscription ${sub.id} to monthly (canceled)`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stripeSubId = (invoice as any).subscription as string | null;

        if (stripeSubId) {
          const { data: sub } = await sb
            .from("subscriptions")
            .select("id")
            .eq("stripe_subscription_id", stripeSubId)
            .single();

          if (sub) {
            await sb
              .from("subscriptions")
              .update({ stripe_status: "past_due" })
              .eq("id", sub.id);

            console.log(`[Webhook] Marked subscription ${sub.id} as past_due`);
          }
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Webhook] Error processing event:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
