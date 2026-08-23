import { useCallback } from 'react'
import { toast } from 'sonner'

import { m } from '@/i18n/paraglide/messages'
import { toErrorMessage } from '@/lib/error'

type Options = Partial<{
  title: string
}>

export function useErrorToast() {
  return useCallback((error: unknown, { title }: Options = {}) => {
    toast.error(title ?? m.error_title(), { description: toErrorMessage(error) })
  }, [])
}
