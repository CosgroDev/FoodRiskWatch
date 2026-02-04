import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return NextResponse.json({ message: "Token missing" }, { status: 400 });

  const sb = supabaseServer();
  const { data: tokenRow, error } = await sb
    .from("email_tokens")
    .select("user_id, purpose")
    .eq("token", token)
    .single();

  if (error || !tokenRow || tokenRow.purpose !== "manage") {
    return NextResponse.json({ message: "Invalid token" }, { status: 400 });
  }

  await sb.from("users").update({ status: "unsubscribed" }).eq("id", tokenRow.user_id);
  await sb.from("subscriptions").update({ is_active: false }).eq("user_id", tokenRow.user_id);

  return NextResponse.json({ message: "You have been unsubscribed." });
}
