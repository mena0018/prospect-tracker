import { createBrowserClient } from '@supabase/ssr'

import { env } from '@/lib/env'

export function getSupabaseBrowserClient() {
  return createBrowserClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
}
