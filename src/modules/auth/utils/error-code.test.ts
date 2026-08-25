import { describe, expect, it } from 'vitest'

import { toAuthErrorCode } from '@/modules/auth/utils/error-code'

describe('toAuthErrorCode', () => {
  it('maps both duplicate-email codes to a single app code', () => {
    expect(toAuthErrorCode('user_already_exists')).toBe('AUTH_EMAIL_TAKEN')
    expect(toAuthErrorCode('email_exists')).toBe('AUTH_EMAIL_TAKEN')
  })

  it('groups codes by the action they leave the user', () => {
    expect(toAuthErrorCode('invalid_credentials')).toBe('AUTH_INVALID_CREDENTIALS')
    expect(toAuthErrorCode('weak_password')).toBe('VALIDATION')
    expect(toAuthErrorCode('over_email_send_rate_limit')).toBe('RATE_LIMITED')
    expect(toAuthErrorCode('over_request_rate_limit')).toBe('RATE_LIMITED')
    expect(toAuthErrorCode('user_banned')).toBe('AUTH_ACCOUNT_LOCKED')
    expect(toAuthErrorCode('signup_disabled')).toBe('AUTH_SIGNUP_DISABLED')
  })

  it('falls back to SERVER for the codes we do not surface', () => {
    expect(toAuthErrorCode('unexpected_failure')).toBe('SERVER')
    expect(toAuthErrorCode('hook_timeout')).toBe('SERVER')
    // Unreachable while email confirmation is off — see docs/decisions/0003-auth-error-mapping.md
    expect(toAuthErrorCode('email_not_confirmed')).toBe('SERVER')
  })

  it('handles a missing code (network drop, no HTTP response)', () => {
    expect(toAuthErrorCode(undefined)).toBe('SERVER')
    expect(toAuthErrorCode('')).toBe('SERVER')
  })
})
