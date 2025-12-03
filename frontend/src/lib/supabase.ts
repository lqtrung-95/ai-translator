import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client for browser (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server client for API routes (uses service role key for admin access)
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    // Fallback to anon key if service role not available
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

// Database types
export interface GlossaryTerm {
  id: string;
  english: string;
  chinese: string;
  category: string;
  explanation: string | null;
  examples: string[] | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface Translation {
  id: string;
  user_id: string;
  title: string;
  source_text: string;
  translated_text: string | null;
  source_language: string;
  target_language: string;
  mode: string;
  provider: string;
  created_at: string;
  updated_at: string;
}

