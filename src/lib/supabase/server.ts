import type { User } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { getCookies, setCookie, setResponseHeader } from '@tanstack/react-start/server'

import { env } from '@/lib/env'

export function getSupabaseServerClient() {
  return createServerClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        const cookies = getCookies()
        return Object.entries(cookies).map(([name, value]) => ({ name, value }))
      },
      setAll(cookies, headers) {
        for (const { name, value, options } of cookies) {
          setCookie(name, value, options)
        }
        // No-cache headers, so a CDN can't leak a session cookie across users.
        // See docs/reference/auth.md.
        for (const [key, value] of Object.entries(headers)) {
          setResponseHeader(key, value)
        }
      }
    }
  })
}

export async function requireUser(): Promise<User> {
  const supabase = getSupabaseServerClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  return user
}
