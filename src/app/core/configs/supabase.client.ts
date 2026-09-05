import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@environments/environment';

export const supabase: SupabaseClient = createClient(
  environment.SUPABASE_URL,
  environment.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      // Explicit: the 30-day cap in AuthService relies on the token being
      // refreshed in the background for as long as the session is allowed to live.
      autoRefreshToken: true,
      detectSessionInUrl: false,
      lock: undefined
    }
  }
);
