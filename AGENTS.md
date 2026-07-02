# AGENTS.md — ProspectTracker

## Contexte projet

SaaS de suivi de prospection pour freelances, alternants et chercheurs d'emploi.
Fondateur : Rabie — dev fullstack 5 ans (React, TypeScript, Node.js).
Référence produit complète : voir `PRD.md`.

L'app et la landing page vivent dans la **même application TanStack Start** (SSR) :
la LP = routes publiques, le dashboard = routes protégées. Un seul repo, un seul déploiement.

## Stack technique

| Couche              | Technologie                                          |
| ------------------- | ---------------------------------------------------- |
| Framework           | TanStack Start (Router + SSR, runtime Nitro)         |
| Data fetching       | TanStack Query                                       |
| Table               | TanStack Table (vue tableur : tri, filtres, pages)   |
| Langage             | TypeScript strict                                    |
| Style               | Tailwind CSS v4                                       |
| UI                  | Radix UI + shadcn (class-variance-authority, clsx)   |
| BDD                 | Supabase (PostgreSQL managé)                         |
| ORM                 | Drizzle ORM + drizzle-kit (migrations)               |
| Auth                | Supabase Auth via `@supabase/ssr`                    |
| Emails              | Resend                                               |
| Paiement            | Stripe                                               |
| Tracking            | PostHog                                              |
| Déploiement         | Vercel                                               |
| Extension Chrome    | Manifest V3, TypeScript (ajoutée plus tard)          |

**Décisions structurantes (ne pas revenir dessus sans raison) :**

- **Framework = TanStack Start**, choisi pour la suite TanStack (Query/Table) sur un produit
  centré table, et pour le SSR qui sert aussi la landing page dans la même app.
- **Auth = Supabase Auth** (pas Better Auth, pas Clerk) : mutualisé avec la BDD Supabase.
  Intégration Start via l'exemple officiel `start-supabase-basic` (`getSupabaseServerClient`
  + `createServerFn` + `beforeLoad`).
- **ORM = Drizzle** (pas Prisma) : léger, edge-friendly, SQL-first, bien aligné Start/Supabase.

## Identité utilisateur (point critique)

Supabase Auth gère les comptes dans le schéma `auth.users` (id = UUID). **Notre table
applicative `users` ne recrée pas l'auth** : elle référence l'UUID Supabase comme clé.

- `users.id` = **UUID = `auth.users.id`** (jamais un `cuid()` ou un id auto-généré).
- Une ligne `users` est créée à la première connexion (upsert dans le `createServerFn`
  d'auth, ou trigger Postgres `on auth.users insert`).
- Toutes les FK applicatives (`opportunities.user_id`, `reminders`…) pointent vers `users.id`.

## Mode invité & persistance (une seule source de vérité)

Objectif : réduire la friction d'entrée (essayer sans compte) SANS maintenir deux sources
de vérité ni de sync bidirectionnelle.

- **Non connecté = essai éphémère.** Les entrées sont stockées en `localStorage`
  uniquement. On incite vite l'utilisateur à créer un compte (CTA visible).
- **Migration one-shot au login.** Au premier chargement du dashboard, si
  (`localStorage` non vide ET user connecté) → insérer les entrées en base via un
  `createServerFn`, puis **vider le `localStorage`**. Déclencher la migration au chargement
  du dashboard (pas dans le callback d'auth) pour être robuste au flow OAuth Google
  (redirection complète).
- **Pas de gestion de doublons** au MVP (choix de simplicité assumé).
- **Connecté = BDD seule source de vérité.** Plus aucune lecture/écriture `localStorage`.
  Tout passe par TanStack Query + `createServerFn`.
- Une ligne en cours d'ajout **non sauvegardée est perdue** si l'utilisateur quitte
  (comportement de formulaire classique — rien n'est persisté avant validation).

## Structure du dépôt

Démarrage en **repo simple** (une seule app TanStack Start). Passage en **monorepo pnpm
workspaces** plus tard, quand l'extension Chrome arrivera (elle partagera les types via un
futur `packages/shared`, mais n'accède JAMAIS à la BDD en direct — elle passe par l'API).

```
/
├── src/
│   ├── routes/                 # Routing fichier TanStack Router
│   │   ├── __root.tsx          # Root : fetchUser + beforeLoad (session SSR)
│   │   ├── index.tsx           # Landing page (public)
│   │   ├── pricing.tsx         # LP pricing (public)
│   │   ├── login.tsx           # Auth
│   │   ├── _authed.tsx         # Layout protégé : beforeLoad redirige si non connecté
│   │   ├── _authed/
│   │   │   ├── tracker.tsx      # Vue principale (table)
│   │   │   └── settings.tsx     # Paramètres utilisateur
│   │   └── api/
│   │       └── auth.$.tsx       # Handler Supabase auth (routes serveur)
│   ├── server/                 # createServerFn : opportunities, reminders, auth
│   ├── components/
│   │   ├── ui/                 # Composants génériques (shadcn)
│   │   ├── tracker/            # Composants du tracker (table, KPI, badges)
│   │   └── layout/             # Sidebar, header, etc.
│   ├── db/
│   │   ├── schema.ts           # Schéma Drizzle
│   │   └── client.ts           # Client Drizzle
│   ├── lib/
│   │   ├── supabase.ts         # getSupabaseServerClient / browser client (@supabase/ssr)
│   │   ├── resend.ts           # Config emails
│   │   └── stripe.ts           # Config Stripe
│   └── styles/
├── drizzle/                    # Migrations générées par drizzle-kit
├── drizzle.config.ts
├── PRD.md
└── AGENTS.md
```

## Modèle de données (Drizzle)

```ts
import { pgTable, uuid, text, integer, real, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core'

export const stage = pgEnum('stage', [
  'SAVED',
  'CONTACTED',
  'CV_SENT',
  'INTERVIEW',
  'OFFER',
  'REFUSED',
  'GHOSTED',
])

export const plan = pgEnum('plan', ['FREE', 'PRO'])

// id = UUID de auth.users (Supabase Auth). On ne gère pas les credentials ici.
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // = auth.users.id
  email: text('email').notNull().unique(),
  plan: plan('plan').notNull().default('FREE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const opportunities = pgTable('opportunities', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  recruiter: text('recruiter'),
  esn: text('esn'),
  need: text('need'),
  tjm: real('tjm'),
  salary: real('salary'),
  client: text('client'),
  stage: stage('stage').notNull().default('SAVED'),
  role: text('role'),
  onsiteDays: integer('onsite_days'), // 0 = full remote, 5 = full présentiel
  location: text('location'),
  experience: text('experience'),
  phone: text('phone'),
  offerUrl: text('offer_url'),
  pinned: boolean('pinned').notNull().default(false),
  lastContact: timestamp('last_contact', { withTimezone: true }).notNull().defaultNow(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relances : une par opportunité active, replanifiée après chaque contact.
export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  opportunityId: uuid('opportunity_id')
    .notNull()
    .references(() => opportunities.id, { onDelete: 'cascade' }),
  dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

Notes :

- `onsiteDays` (0–5) remplace l'ancien `remote Boolean` — c'est la vraie donnée du terrain
  (nombre de jours sur site par semaine).
- `phone` et `notes` existent (présents dans le tableur d'origine).
- Le seuil « TJM vs marché » (colorer le TJM vert/rouge) n'est pas en base pour le MVP :
  constante applicative configurable (défaut 450 €), à faire évoluer vers un vrai scoring
  au tier Pro.

## Conventions de code (alignées sur le portfolio)

- **Composants** : PascalCase, un composant par fichier.
- **Fonctions utilitaires** : camelCase.
- **Variables d'environnement** : dans `.env` (jamais hardcodées, jamais commit).
- **Validation** : Zod sur tous les `createServerFn` avant de toucher la BDD (`.validator`).
- **Typage** : strict, pas de `any`. `noUncheckedIndexedAccess` activé.
- **Import alias** : `@/*` → `src/*`.

### Lint & format : Biome (`biome.json`)

Lint + formatage assurés par **Biome** (un seul outil, pas d'ESLint ni Prettier).
Choix : rapidité + config unique sur un projet neuf. Style aligné sur les habitudes du
portfolio : pas de point-virgule, single quotes, `trailingComma: all`, largeur de ligne 100.

> Réévaluation prévue via un ticket Linear (« Revoir le choix Biome vs ESLint/Prettier »)
> si des règles spécifiques à un plugin (react-hooks exhaustive-deps, règles TanStack) nous
> manquent. Biome couvre l'essentiel React/hooks aujourd'hui.

### Husky + lint-staged

- `prepare: "husky"`, hook `pre-commit` → `pnpm exec lint-staged`.
- `.lintstagedrc.mjs` : `biome check --write` sur `{js,jsx,mjs,cjs,ts,tsx,json}`,
  Biome formate aussi les fichiers supportés.

### Scripts package.json

```json
{
  "lint": "biome lint --write .",
  "lint:ci": "biome ci .",
  "format": "biome format --write .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "prepare": "husky"
}
```

### CI — `.github/workflows/quality-checks.yml`

Sur PR vers `main` : `pnpm install --frozen-lockfile` → `lint:ci` (`biome ci`) →
`typecheck` → `test`. `pnpm/action-setup@v4` (lit `packageManager`), `setup-node` avec
`.nvmrc`.

### Outils

- **pnpm** `10.x` (champ `packageManager`), **Node** `24` (`.nvmrc`).
- `.npmrc` : `strict-peer-dependencies=false`, `auto-install-peers=true`.
- **Tests** : Vitest.

## Variables d'environnement requises

```env
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Base de données (Drizzle → Postgres Supabase)
DATABASE_URL=

# OAuth Google (configuré côté Supabase Auth)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Resend
RESEND_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=

# PostHog
POSTHOG_KEY=
POSTHOG_HOST=
```

## Règles importantes

- Ne jamais modifier `src/db/schema.ts` sans générer une migration
  (`drizzle-kit generate` puis `drizzle-kit migrate`).
- Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` côté client.
- Toujours valider les inputs avec Zod (`.validator`) avant de toucher la BDD.
- Auth SSR : résoudre la session dans un `createServerFn` + `beforeLoad` (root pour
  l'utilisateur courant, `_authed.tsx` pour protéger le dashboard). Utiliser
  `supabase.auth.getUser()` (vérifié) pour les checks d'identité, pas seulement `getSession()`.
- **RLS** : activer Row Level Security sur les tables applicatives et faire les accès
  utilisateur via le client Supabase authentifié. Les accès service-role (Drizzle admin,
  crons) contournent la RLS — les réserver au serveur, jamais côté client.
- Les relances email tournent via un **cron Vercel** (route serveur) — jamais côté client.
- L'extension Chrome (plus tard) passe par l'API, n'accède jamais à Postgres en direct, et
  ne stocke pas de token en clair.

## Commandes utiles

```bash
# Dev
pnpm dev

# Drizzle
pnpm drizzle-kit generate     # Générer une migration depuis le schéma
pnpm drizzle-kit migrate      # Appliquer les migrations
pnpm drizzle-kit studio       # Interface BDD

# Qualité
pnpm lint
pnpm typecheck
pnpm test
pnpm format

# Build
pnpm build
```

---

_Dernière mise à jour : juillet 2026_
