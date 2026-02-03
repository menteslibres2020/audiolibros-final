
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL ERROR: Supabase environment variables are missing. Please check your Cloudflare Pages configuration. Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder_key")
