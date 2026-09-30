import { createClient } from '@supabase/supabase-js';

// Retrieve Vite environment variables using direct static access for Vite bundling
const supabaseUrl: string = (
  import.meta.env.VITE_SUPABASE_URL ||
  'https://snpxhrovyogwboydqcmh.supabase.co'
).replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

const supabasePublishableKey: string =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHhocm92eW9nd2JveWRxY21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzM0MzIsImV4cCI6MjEwNTQwOTQzMn0.WbAr1yCceQ5L9vN-_n4W9IkeQorPo8HuqagazNmXhwg';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase Configuration Notice: VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is not defined. Please verify .env or .env.local.'
  );
}

// Initialize and export single Supabase Client
export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Live connection test that verifies Supabase reachability by executing a real SELECT query
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; rows?: number }> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: 'Supabase credentials are not configured in environment variables (VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY missing).',
    };
  }

  try {
    // Perform a real SELECT query against the projects table to confirm PostgreSQL connectivity
    const { data, error } = await supabase.from('projects').select('id').limit(1);
    if (error) {
      return {
        success: false,
        message: `Supabase database SELECT error: [${error.code}] ${error.message}`,
      };
    }

    return {
      success: true,
      message: 'Supabase client connected successfully and verified PostgreSQL SELECT query.',
      rows: data ? data.length : 0,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown network error';
    return {
      success: false,
      message: `Failed to connect to Supabase: ${errorMessage}`,
    };
  }
}

export default supabase;

