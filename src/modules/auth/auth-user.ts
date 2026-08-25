import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { isServer } from '@/lib/utils'
import { getUserFromServer } from '@/modules/auth/auth-server'
import type { AuthUser } from '@/modules/auth/auth-schema'
import { readUser } from '@/modules/auth/utils/user'

// SSR has no browser crypto, so the first document still resolves the user server-side.
export async function getUser(): Promise<AuthUser | null> {
  if (isServer()) return await getUserFromServer()

  const supabase = getSupabaseBrowserClient()
  const user = await readUser(supabase)

  return user
}
