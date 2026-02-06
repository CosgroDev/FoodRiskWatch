import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";
import { sendVerificationEmail, sendLoginEmail } from "../../../lib/email/send";
import crypto from "crypto";

const EMAIL_REGEX = /.+@.+\..+/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email: string | undefined = body?.email?.trim().toLowerCase();

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ message: "Invalid email" }, { status: 400 });
  }

  const sb = supabaseServer();
  const origin = new URL(req.url).origin;

  // Check if user already exists
  const { data: existingUser } = await sb
    .from("users")
    .select("id, status")
    .eq("email", email)
    .single();

  // If user exists and is active, send a login link instead of verification
  if (existingUser && existingUser.status === "active") {
    // Create/refresh manage token
    const manageToken = crypto.randomBytes(24).toString("base64url");
    const manageExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await sb.from("email_tokens").insert({
      token: manageToken,
      user_id: existingUser.id,
      purpose: "manage",
      expires_at: manageExpires,
    });

    const manageUrl = `${origin}/preferences?token=${manageToken}`;

    // Send login email with manage link
    const emailResult = await sendLoginEmail(email, manageUrl);

    return NextResponse.json({
      message: emailResult.success
        ? "You're already subscribed! Check your email for a link to manage your preferences."
        : "You're already subscribed. Check your email to manage preferences.",
      manageUrl,
      emailSent: emailResult.success,
      isExistingUser: true,
    });
  }

  // New user or pending user - create/update and send verification
  const { data: userRow, error: userErr } = await sb
    .from("users")
    .upsert({ email, status: "pending" }, { onConflict: "email" })
    .select("id, status")
    .single();

  if (userErr || !userRow) {
    console.error("subscribe upsert error", userErr);
    return NextResponse.json({ message: "Database error" }, { status: 500 });
  }

  const verifyToken = crypto.randomBytes(24).toString("base64url");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error: tokenErr } = await sb.from("email_tokens").insert({
    token: verifyToken,
    user_id: userRow.id,
    purpose: "verify",
    expires_at: expires,
  });

  if (tokenErr) {
    console.error("token insert error", tokenErr);
    return NextResponse.json({ message: "Could not create token" }, { status: 500 });
  }

  // Create a manage token upfront so testers can jump to preferences without email.
  const manageToken = crypto.randomBytes(24).toString("base64url");
  const manageExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await sb.from("email_tokens").insert({
    token: manageToken,
    user_id: userRow.id,
    purpose: "manage",
    expires_at: manageExpires,
  });

  const verifyUrl = `${origin}/verify?token=${verifyToken}`;
  const manageUrl = `${origin}/preferences?token=${manageToken}`;

  // Send verification email
  const emailResult = await sendVerificationEmail(email, verifyUrl);
  if (!emailResult.success) {
    console.error("Failed to send verification email:", emailResult.error);
  }

  return NextResponse.json({
    message: emailResult.success
      ? "Check your email to verify your subscription"
      : "Subscription created. Check your email (or use the URLs below for testing)",
    verifyUrl,
    manageUrl,
    emailSent: emailResult.success,
    isExistingUser: false,
  });
}
