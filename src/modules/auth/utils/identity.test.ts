import { describe, expect, it } from 'vitest'

import { toAuthUser, toSafeRedirect } from '@/modules/auth/utils/identity'

describe('toSafeRedirect', () => {
  const fallback = '/app'

  it('keeps a relative path, query and hash included', () => {
    expect(toSafeRedirect('/app', fallback)).toBe('/app')
    expect(toSafeRedirect('/app/opportunities?stage=won', fallback)).toBe(
      '/app/opportunities?stage=won'
    )
    expect(toSafeRedirect('/app#top', fallback)).toBe('/app#top')
  })

  it('rejects an absolute URL pointing off-origin', () => {
    expect(toSafeRedirect('https://evil.com', fallback)).toBe(fallback)
    expect(toSafeRedirect('http://evil.com/app', fallback)).toBe(fallback)
  })

  it('rejects a protocol-relative URL, which resolves off-origin', () => {
    expect(toSafeRedirect('//evil.com', fallback)).toBe(fallback)
    expect(toSafeRedirect('//evil.com/app', fallback)).toBe(fallback)
  })

  it('rejects a backslash authority, which browsers read as //', () => {
    expect(toSafeRedirect('/\\evil.com', fallback)).toBe(fallback)
  })

  it('rejects a non-http scheme', () => {
    expect(toSafeRedirect('javascript:alert(1)', fallback)).toBe(fallback)
    expect(toSafeRedirect('data:text/html,<script>', fallback)).toBe(fallback)
  })

  it('falls back when there is no target', () => {
    expect(toSafeRedirect(undefined, fallback)).toBe(fallback)
    expect(toSafeRedirect('', fallback)).toBe(fallback)
    // searchParams.get() returns null for a missing param
    expect(toSafeRedirect(null, fallback)).toBe(fallback)
  })

  it('passes the fallback through as given', () => {
    expect(toSafeRedirect('https://evil.com', undefined)).toBeUndefined()
  })
})

describe('toAuthUser', () => {
  // A verified token always carries the registered claims; only the profile fields vary.
  const claims = {
    iss: 'https://project.supabase.co/auth/v1',
    aud: 'authenticated',
    exp: 2000000000,
    iat: 1000000000,
    sub: 'user-id',
    role: 'authenticated',
    aal: 'aal1' as const,
    session_id: 'session-id',
    email: 'camille@example.com',
    user_metadata: { full_name: 'Camille Martin', job_title: 'Développeuse', provisioned: true }
  }

  it('maps the claims a verified token carries', () => {
    expect(toAuthUser(claims)).toEqual({
      id: 'user-id',
      email: 'camille@example.com',
      fullName: 'Camille Martin',
      jobTitle: 'Développeuse',
      avatarUrl: null,
      provisioned: true
    })
  })

  it('treats a missing provisioned claim as not provisioned', () => {
    expect(toAuthUser({ ...claims, user_metadata: {} })?.provisioned).toBe(false)
  })

  it('rejects a token with no email, which cannot identify a user', () => {
    expect(toAuthUser({ ...claims, email: undefined })).toBeNull()
  })
})
