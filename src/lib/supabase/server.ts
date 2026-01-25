import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Create a fresh client for each request to avoid any caching issues
export function createServerClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Create new client instance each time - no singleton caching
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        // Add unique request ID to prevent any edge caching
        'x-request-id': `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
    },
  });
}
