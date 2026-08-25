import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { getIdentity } from '@/modules/auth/auth-identity'
import { fetchUser } from '@/modules/auth/auth-server'

vi.mock('@/modules/auth/auth-server', () => ({ fetchUser: vi.fn() }))
vi.mock('@/lib/supabase/client', () => ({ getSupabaseBrowserClient: vi.fn() }))

const CLAIMS = {
  iss: 'https://project.supabase.co/auth/v1',
  aud: 'authenticated',
  exp: 2000000000,
  iat: 1000000000,
  sub: 'user-id',
  role: 'authenticated',
  aal: 'aal1' as const,
  session_id: 'session-id',
  email: 'camille@example.com',
  user_metadata: { full_name: 'Camille Martin', provisioned: true }
}

const getClaims = vi.fn()

// The suite runs on the node environment, so the browser cases have to stub `window` in.
const asBrowser = () => vi.stubGlobal('window', {})

beforeEach(() => {
  vi.mocked(fetchUser).mockReset()
  getClaims.mockReset()
  vi.mocked(getSupabaseBrowserClient).mockReturnValue({
    auth: { getClaims }
  } as unknown as ReturnType<typeof getSupabaseBrowserClient>)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getIdentity', () => {
  // The whole point of DEV-53: no server round-trip on the click path.
  it('verifies locally in the browser, without calling the server function', async () => {
    asBrowser()
    getClaims.mockResolvedValue({ data: { claims: CLAIMS }, error: null })

    const user = await getIdentity()

    expect(getClaims).toHaveBeenCalledTimes(1)
    expect(fetchUser).not.toHaveBeenCalled()
    expect(user?.id).toBe('user-id')
  })

  it('falls back to the server function during SSR, which has no browser crypto', async () => {
    vi.mocked(fetchUser).mockResolvedValue({
      id: 'user-id',
      email: 'camille@example.com',
      fullName: null,
      jobTitle: null,
      avatarUrl: null,
      provisioned: true
    })

    const user = await getIdentity()

    expect(fetchUser).toHaveBeenCalledTimes(1)
    expect(getClaims).not.toHaveBeenCalled()
    expect(user?.id).toBe('user-id')
  })

  it('reports no user when verification fails', async () => {
    asBrowser()
    getClaims.mockResolvedValue({ data: null, error: new Error('Invalid JWT signature') })

    expect(await getIdentity()).toBeNull()
  })
})
