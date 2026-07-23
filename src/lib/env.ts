import { z } from 'zod/v4'
import { createEnv } from '@t3-oss/env-core'

export const env = createEnv({
  clientPrefix: 'VITE_',
  emptyStringAsUndefined: true,

  server: {
    DATABASE_URL: z.url()
  },
  client: {
    VITE_SUPABASE_URL: z.url(),
    VITE_SUPABASE_ANON_KEY: z.string().min(1)
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
  }
})
