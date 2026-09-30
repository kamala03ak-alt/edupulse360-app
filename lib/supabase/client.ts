import { createBrowserClient } from "@supabase/ssr";

import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

export function createClient(): SupabaseClient {
  if (client) {
    return client;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  client = createBrowserClient(url, publishableKey);
  return client;
}
