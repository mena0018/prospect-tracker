import type { getSupabaseBrowserClient } from '@/lib/supabase/client'

type GetClaimsResult = Awaited<
  ReturnType<ReturnType<typeof getSupabaseBrowserClient>['auth']['getClaims']>
>

// Derived from the SDK rather than redeclared, so a claims change surfaces at compile time.
export type AuthClaims = NonNullable<GetClaimsResult['data']>['claims']
