import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { isServer } from '@/lib/utils'
import { fetchUser } from '@/modules/auth/auth-server'
import type { AuthUser } from '@/modules/auth/auth-schema'
import { toAuthUser } from '@/modules/auth/utils/identity'

// Asymmetric signing keys let the browser verify the token itself, so navigation never waits on
// a round-trip — see docs/reference/auth.md
async function readBrowserIdentity(): Promise<AuthUser | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data) return null

  return toAuthUser(data.claims)
}

// SSR has no browser crypto, so the first document still resolves the identity server-side.
export function getIdentity(): Promise<AuthUser | null> {
  return isServer() ? fetchUser() : readBrowserIdentity()
}
