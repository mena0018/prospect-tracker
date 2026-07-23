import { useCallback } from 'react'
import { toast } from 'sonner'

import { m } from '@/i18n/paraglide/messages'
import { toErrorMessage } from '@/lib/error'

type Options = Partial<{
  title: string
  onRetry: () => void
}>

export function useErrorToast() {
  return useCallback((error: unknown, { title, onRetry }: Options = {}) => {
    toast.error(title ?? m.error_title(), {
      description: toErrorMessage(error),
      action: onRetry ? { label: m.common_retry(), onClick: onRetry } : undefined
    })
  }, [])
}
