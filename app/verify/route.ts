import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServer } from "../../lib/supabase/server";
import { sendWelcomeDigestEmail } from "../../lib/email/send";
import { getAppBaseUrl } from "../../lib/config";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ message: "Token missing" }, { status: 400 });
  }

  const sb = supabaseServer();
  const { data: tokenRow, error: tokenErr } = await sb
    .from("email_tokens")
    .select("token, user_id, purpose, expires_at, used_at")
    .eq("token", token)
    .single();

  if (tokenErr || !tokenRow || tokenRow.purpose !== "verify") {
    return NextResponse.json({ message: "Invalid token" }, { status: 400 });
  }

  if (tokenRow.used_at) {
    return NextResponse.json({ message: "Token already used" }, { status: 400 });
  }

  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ message: "Token expired" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: updateErr } = await sb
    .from("email_tokens")
    .update({ used_at: now })
    .eq("token", token);
  if (updateErr) {
    console.error(updateErr);
  }

  await sb.from("users").update({ status: "active" }).eq("id", tokenRow.user_id);

  // Get user email for welcome digest
  const { data: user } = await sb
    .from("users")
    .select("email")
    .eq("id", tokenRow.user_id)
    .single();

  // Ensure a default subscription exists
  const { data: existingSub } = await sb
    .from("subscriptions")
    .select("id, welcome_digest_sent")
    .eq("user_id", tokenRow.user_id)
    .limit(1)
    .maybeSingle();

  let subscriptionId = existingSub?.id;
  let welcomeDigestSent = existingSub?.welcome_digest_sent || false;

  if (!existingSub) {
    const { data: newSub } = await sb.from("subscriptions").insert({
      user_id: tokenRow.user_id,
      tier: "free",
      frequency: "monthly",
      timezone: "Europe/London",
      is_active: true,
      welcome_digest_sent: false,
    }).select("id").single();
    subscriptionId = newSub?.id;
  }

  // Send welcome digest with last 30 days of alerts (only once)
  if (user?.email && subscriptionId && !welcomeDigestSent) {
    try {
      const baseUrl = getAppBaseUrl();
      await sendWelcomeDigestEmail(user.email, subscriptionId, baseUrl, sb);

      // Mark welcome digest as sent
      await sb
        .from("subscriptions")
        .update({ welcome_digest_sent: true })
        .eq("id", subscriptionId);
    } catch (err) {
      console.error("[Verify] Failed to send welcome digest:", err);
      // Don't fail verification if welcome digest fails
    }
  }

  // Reuse an existing manage token or create a fresh one
  let manageToken = "";
  const { data: manageRow } = await sb
    .from("email_tokens")
    .select("token, expires_at")
    .eq("user_id", tokenRow.user_id)
    .eq("purpose", "manage")
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (manageRow && (!manageRow.expires_at || new Date(manageRow.expires_at) > new Date())) {
    manageToken = manageRow.token;
  } else {
    manageToken = crypto.randomBytes(24).toString("base64url");
    const manageExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await sb.from("email_tokens").upsert({
      token: manageToken,
      user_id: tokenRow.user_id,
      purpose: "manage",
      expires_at: manageExpires,
    });
  }

  const manageUrl = `${getAppBaseUrl()}/preferences?token=${manageToken}`;
  return NextResponse.redirect(manageUrl);
}
