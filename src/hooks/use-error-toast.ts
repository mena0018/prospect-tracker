import { useCallback } from 'react'
import { toast } from 'sonner'

import { toErrorMessage } from '@/lib/error'

type Options = Partial<{
  title: string
  onRetry: () => void
}>

export function useErrorToast() {
  return useCallback((error: unknown, { title, onRetry }: Options = {}) => {
    toast.error(title ?? 'Une erreur est survenue.', {
      description: toErrorMessage(error),
      action: onRetry ? { label: 'Réessayer', onClick: onRetry } : undefined
    })
  }, [])
}
