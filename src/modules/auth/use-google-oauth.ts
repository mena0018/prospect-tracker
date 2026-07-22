import { useMutation } from '@tanstack/react-query'

import { API_ROUTES } from '@/lib/routes'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export function useGoogleOAuth(next: string, oauthFailed: boolean) {
  const mutation = useMutation({
    mutationFn: async () => {
      const callback = `${window.location.origin}${API_ROUTES.authCallback}?next=${encodeURIComponent(next)}`
      const { error } = await getSupabaseBrowserClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callback }
      })
      if (error) throw new Error('Impossible de démarrer la connexion Google.')
    }
  })

  const error =
    mutation.error?.message ?? (oauthFailed ? 'La connexion Google a échoué. Réessayez.' : null)

  return { googleMutation: mutation, googleError: error }
}
