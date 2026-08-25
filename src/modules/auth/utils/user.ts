import { asString } from '@/lib/utils'
import type { AuthClaims, ClaimsReader } from '@/lib/supabase/claims'
import type { AuthUser } from '@/modules/auth/auth-schema'

// Shared so the server handler and the browser's local verification map claims identically.
export function toAuthUser(claims: AuthClaims): AuthUser | null {
  const email = asString(claims.email)

  if (!email) return null

  return {
    id: claims.sub,
    email,
    fullName: asString(claims.user_metadata?.full_name),
    jobTitle: asString(claims.user_metadata?.job_title),
    avatarUrl: asString(claims.user_metadata?.avatar_url),
    provisioned: claims.user_metadata?.provisioned === true
  }
}

// `getClaims()` verifies locally; why that is enough here: docs/reference/auth.md
export async function readUser(supabase: ClaimsReader) {
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data) return null

  return toAuthUser(data.claims)
}

// A caller-supplied redirect must stay on our origin — see docs/reference/auth.md
export function toSafeRedirect<T extends string | undefined>(
  target: string | null | undefined,
  fallback: T
) {
  if (!target?.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) {
    return fallback
  }
  return target
}
