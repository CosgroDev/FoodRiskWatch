import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";
import crypto from "crypto";

const EMAIL_REGEX = /.+@.+\..+/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email: string | undefined = body?.email?.trim().toLowerCase();

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ message: "Invalid email" }, { status: 400 });
  }

  const sb = supabaseServer();

  // Check if user already exists
  const { data: existingUser } = await sb
    .from("users")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();

  let userRow: { id: string; status: string };

  if (existingUser) {
    userRow = existingUser;
  } else {
    const { data: newUser, error: insertErr } = await sb
      .from("users")
      .insert({ email, status: "pending" })
      .select("id, status")
      .single();

    if (insertErr || !newUser) {
      console.error("subscribe insert error", insertErr);
      return NextResponse.json({ message: "Database error" }, { status: 500 });
    }
    userRow = newUser;
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
  await sb.from("email_tokens").upsert({
    token: manageToken,
    user_id: userRow.id,
    purpose: "manage",
    expires_at: manageExpires,
  });

  const origin = new URL(req.url).origin;
  const verifyUrl = `${origin}/verify?token=${verifyToken}`;
  const manageUrl = `${origin}/preferences?token=${manageToken}`;

  return NextResponse.json({ verifyUrl, manageUrl });
}
