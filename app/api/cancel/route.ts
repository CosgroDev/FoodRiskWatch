import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";
import { getStripe } from "../../../lib/stripe/client";

type CancelPayload = {
  token?: string;
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
  const body = (await req.json().catch(() => ({}))) as CancelPayload;

  // Validate token
  const validation = await validateManageToken(sb, body.token);
  if ("error" in validation) {
    return NextResponse.json({ message: validation.error }, { status: 400 });
  }

  // Get subscription
  const { data: subscription } = await sb
    .from("subscriptions")
    .select("id, stripe_subscription_id, frequency")
    .eq("user_id", validation.userId)
    .limit(1)
    .maybeSingle();

  if (!subscription) {
    return NextResponse.json({ message: "No subscription found" }, { status: 404 });
  }

  // If already on free plan, nothing to cancel
  if (subscription.frequency === "monthly" || !subscription.stripe_subscription_id) {
    return NextResponse.json({ message: "You are already on the free plan" }, { status: 400 });
  }

  try {
    const stripe = getStripe();

    // Cancel the Stripe subscription immediately
    await stripe.subscriptions.cancel(subscription.stripe_subscription_id);

    // Update local database
    await sb
      .from("subscriptions")
      .update({
        frequency: "monthly",
        stripe_status: "canceled",
        stripe_subscription_id: null,
      })
      .eq("id", subscription.id);

    console.log(`[Cancel] Canceled subscription ${subscription.id}, downgraded to monthly`);

    return NextResponse.json({ ok: true, message: "Subscription canceled. You are now on the free monthly plan." });
  } catch (err) {
    console.error("[Cancel] Stripe error:", err);
    const message = err instanceof Error ? err.message : "Failed to cancel subscription";
    return NextResponse.json({ message }, { status: 500 });
  }
}
