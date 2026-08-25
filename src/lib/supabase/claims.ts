import type { getSupabaseBrowserClient } from '@/lib/supabase/client'

type SupabaseAuth = ReturnType<typeof getSupabaseBrowserClient>['auth']

type GetClaimsResult = Awaited<ReturnType<SupabaseAuth['getClaims']>>

// Derived from the SDK rather than redeclared, so a claims change surfaces at compile time.
export type AuthClaims = NonNullable<GetClaimsResult['data']>['claims']

// Only what readUser actually calls — so the server client satisfies it too.
export type ClaimsReader = { auth: Pick<SupabaseAuth, 'getClaims'> }
