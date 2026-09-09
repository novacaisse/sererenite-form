import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role client — bypasses RLS entirely. Only ever import this from
 * server-only code (API routes). Never expose SUPABASE_SERVICE_ROLE_KEY to
 * the browser.
 *
 * Used exclusively by POST /api/leads: the public form has no direct write
 * access to Supabase (the anon key carries no insert policy on `leads`), so
 * this is the one controlled path that can create a lead, after the route
 * has already applied honeypot + rate-limit checks server-side.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
