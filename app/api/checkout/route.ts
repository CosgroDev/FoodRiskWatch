import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";
import { getStripe, PRICE_IDS } from "../../../lib/stripe/client";

type CheckoutPayload = {
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
  const body = (await req.json().catch(() => ({}))) as CheckoutPayload;

  // Validate token
  const validation = await validateManageToken(sb, body.token);
  if ("error" in validation) {
    return NextResponse.json({ message: validation.error }, { status: 400 });
  }

  // Validate frequency
  if (!body.frequency || !["weekly", "daily"].includes(body.frequency)) {
    return NextResponse.json({ message: "Invalid frequency" }, { status: 400 });
  }

  const priceId = PRICE_IDS[body.frequency];
  if (!priceId) {
    return NextResponse.json({ message: "Pricing not configured" }, { status: 500 });
  }

  // Get user email
  const { data: user } = await sb
    .from("users")
    .select("email")
    .eq("id", validation.userId)
    .single();

  if (!user?.email) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  // Get or create subscription record
  const { data: subscription } = await sb
    .from("subscriptions")
    .select("id, stripe_customer_id")
    .eq("user_id", validation.userId)
    .limit(1)
    .maybeSingle();

  const stripe = getStripe();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}` || "http://localhost:3000";

  let customerId = subscription?.stripe_customer_id;

  // Create Stripe customer if needed
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        user_id: validation.userId,
        subscription_id: subscription?.id || "",
      },
    });
    customerId = customer.id;

    // Save customer ID
    if (subscription) {
      await sb
        .from("subscriptions")
        .update({ stripe_customer_id: customerId })
        .eq("id", subscription.id);
    }
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: 7,
      metadata: {
        user_id: validation.userId,
        subscription_id: subscription?.id || "",
        frequency: body.frequency,
      },
    },
    success_url: `${baseUrl}/preferences?token=${encodeURIComponent(body.token!)}&upgraded=true`,
    cancel_url: `${baseUrl}/pricing?token=${encodeURIComponent(body.token!)}`,
    metadata: {
      user_id: validation.userId,
      subscription_id: subscription?.id || "",
      frequency: body.frequency,
    },
  });

  return NextResponse.json({ url: session.url });
}
