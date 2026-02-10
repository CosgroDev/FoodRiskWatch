import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";
import { getStripe, PRICE_IDS } from "../../../lib/stripe/client";

type UpgradePayload = {
  token?: string;
  frequency?: "weekly" | "daily";
};

async function validateManageToken(sb: ReturnType<typeof supabaseServer>, token?: string) {
  if (!token) return { error: "Missing token" as const };
  const { data, error } = await sb
    .from("email_tokens")
    .select("user_id, purpose, expires_at")
    .eq("token", token)
    .single();

  if (error || !data || data.purpose !== "manage") return { error: "Invalid token" as const };
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { error: "Token expired" as const };
  return { userId: data.user_id };
}

export async function POST(req: NextRequest) {
  const sb = supabaseServer();
  const body = (await req.json().catch(() => ({}))) as UpgradePayload;

  // Validate token
  const validation = await validateManageToken(sb, body.token);
  if ("error" in validation) {
    return NextResponse.json({ message: validation.error }, { status: 400 });
  }

  // Validate frequency
  if (!body.frequency || !["weekly", "daily"].includes(body.frequency)) {
    return NextResponse.json({ message: "Invalid frequency" }, { status: 400 });
  }

  const newPriceId = PRICE_IDS[body.frequency];
  if (!newPriceId) {
    console.error(`[Upgrade] Missing price ID for frequency: ${body.frequency}`);
    return NextResponse.json({
      message: `Stripe price not configured for ${body.frequency} plan. Please contact support.`
    }, { status: 500 });
  }

  // Get subscription with stripe info
  const { data: subscription } = await sb
    .from("subscriptions")
    .select("id, frequency, stripe_subscription_id, stripe_status")
    .eq("user_id", validation.userId)
    .limit(1)
    .maybeSingle();

  if (!subscription) {
    return NextResponse.json({ message: "No subscription found" }, { status: 404 });
  }

  // Check if user has an active Stripe subscription
  if (!subscription.stripe_subscription_id || subscription.stripe_status !== "active") {
    return NextResponse.json({
      message: "No active paid subscription. Please use checkout for new subscriptions.",
      requiresCheckout: true
    }, { status: 400 });
  }

  // Check if already on this plan
  if (subscription.frequency === body.frequency) {
    return NextResponse.json({ message: "You are already on this plan" }, { status: 400 });
  }

  try {
    const stripe = getStripe();

    // Get the current Stripe subscription to find the item ID
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
    const subscriptionItemId = stripeSubscription.items.data[0]?.id;

    if (!subscriptionItemId) {
      return NextResponse.json({ message: "Could not find subscription item" }, { status: 500 });
    }

    // Determine if this is an upgrade or downgrade
    const currentFrequency = subscription.frequency;
    const isUpgrade =
      (currentFrequency === "weekly" && body.frequency === "daily") ||
      (currentFrequency === "monthly" && (body.frequency === "weekly" || body.frequency === "daily"));

    // Update the subscription
    // For upgrades: prorate immediately
    // For downgrades: change at end of billing period
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      items: [
        {
          id: subscriptionItemId,
          price: newPriceId,
        },
      ],
      proration_behavior: isUpgrade ? "create_prorations" : "none",
      // For downgrades, we could use billing_cycle_anchor but keeping it simple
      metadata: {
        frequency: body.frequency,
      },
    });

    // Update local database
    await sb
      .from("subscriptions")
      .update({ frequency: body.frequency })
      .eq("id", subscription.id);

    console.log(`[Upgrade] Changed subscription ${subscription.id} from ${currentFrequency} to ${body.frequency}`);

    return NextResponse.json({
      ok: true,
      message: isUpgrade
        ? `Upgraded to ${body.frequency}. The price difference has been prorated.`
        : `Changed to ${body.frequency}. Your new rate applies from the next billing cycle.`,
      isUpgrade,
    });
  } catch (err) {
    console.error("[Upgrade] Stripe error:", err);
    const message = err instanceof Error ? err.message : "Failed to update subscription";
    return NextResponse.json({ message }, { status: 500 });
  }
}
