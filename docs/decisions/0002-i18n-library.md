# ADR 0002 — i18n library: Paraglide JS

- **Status**: Accepted
- **Date**: 2026-07-23
- **Context ticket**: DEV-34 (i18n fr / en)

## Context

The app ships copy in French (primary market: French freelancers) and needs English
as a second locale. This had to land **before** any further UI work — every new screen
otherwise adds hardcoded strings to migrate later.

TanStack's own i18n guide is explicitly library-agnostic. It documents a full worked
integration only for **Paraglide**; **Intlayer** and **use-intl** appear as bare links.
Three candidates were evaluated.

## Options considered

- **use-intl** (core of `next-intl`) — runtime library. Does SSR, but ships none of the
  routing / locale-detection / URL-prefix machinery; all of it would be hand-written.
  Rejected: worst work-to-benefit ratio for a solo MVP.
- **Intlayer** — the most feature-rich: co-located `.content.ts`, an `extract` command that
  pulls hardcoded strings out of components, native `{-$locale}` routing, plurals / gender /
  conditionals / markdown / JSX. Runs a runtime plus a build step.
- **Paraglide JS** — compiler-based: messages compile to typed, tree-shakable ESM functions.
  No runtime. Bundle stays proportional to _used_ messages, not catalogue size.

## Decision

**Paraglide JS**, with the manual-middleware TanStack Start integration.

Comparison on the three axes that mattered:

- **TanStack integration** — advantage Intlayer (more complete out of the box), but Paraglide
  is the one TanStack documents, and its middleware + router rewrite cover our needs.
- **Type safety** — tie. Both fail the build on an unknown key; Paraglide via generated ESM
  functions, Intlayer via generated types + module augmentation.
- **Performance** — advantage Paraglide: zero runtime, per-message tree-shaking.

Two facts broke the tie:

1. **Maintenance cadence.** Intlayer reached v9 in ~2 years (a new major roughly every
   10 weeks); Paraglide is on v2 since late 2023. For a dependency that ends up in _every_
   component, Intlayer's breaking-change rate is the real recurring cost.
2. **Reversibility.** Paraglide compiles to plain JS functions (`m.foo()`) — removable without
   a rewrite. Intlayer brings a Vite plugin, a proxy middleware, a generated `.intlayer/` dir
   and a proprietary content format that the whole app would depend on.

Intlayer's headline advantages don't apply yet: the hardcoded copy is ~60 lines (labels +
error messages), so `extract` automates little, and gender / conditionals / markdown-in-copy
have no current use case. Paraglide's known weakness (dynamic / CMS-driven keys) is a
non-issue — our copy is static in components.

## Consequences

- URLs are always locale-prefixed (`/fr/app`, `/en/app`); `baseLocale` is `fr`.
- Setup details and how to add copy: [`docs/reference/i18n.md`](../reference/i18n.md).
- Manual middleware (not the experimental generated server entry) — avoids version pinning
  and `routeStrategies` restrictions.
- If rich content needs (gender, CMS-driven copy) ever arrive, revisit — Paraglide's variants
  cover plurals/selects, but a CMS would be the trigger to reconsider.
