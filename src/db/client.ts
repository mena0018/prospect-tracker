import postgres from 'postgres'
import * as schema from './schema'

import { env } from '@/lib/env'
import { drizzle } from 'drizzle-orm/postgres-js'

// `prepare: false` is required for Supabase's transaction pooler (pgBouncer).
const client = postgres(env.DATABASE_URL, { prepare: false })

// Server-only: direct Postgres connection, bypasses RLS. Never import into browser code.
export const db = drizzle({ client, schema })
