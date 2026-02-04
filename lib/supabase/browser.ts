import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase browser client missing env vars. Check NEXT_PUBLIC_SUPABASE_URL/ANON_KEY.");
}

export const supabaseBrowser = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase browser env vars are not set");
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};
