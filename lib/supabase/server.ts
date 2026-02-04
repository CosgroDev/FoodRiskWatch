import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn("Supabase server client missing env vars. Check NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY.");
}

export const supabaseServer = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server env vars are not set");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};
