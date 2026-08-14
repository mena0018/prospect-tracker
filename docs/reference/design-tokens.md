# Design tokens

Source of truth for typography and text colors.

Implementation: `src/styles/globals.css` (`@theme inline` block).

The guiding rule is **the scale is recentred on a 14px body**. Tailwind's stock scale assumes
a 16px body; this app's body copy is 14px, so every stock token sits one step too large.
Rather than correcting that at each call site, the scale below shifts the tokens themselves.
Overrides still cost something to memorise — reach for an existing token before proposing a
new one.

## Fonts

| Token            | Stack                                             | Usage                              |
| ---------------- | ------------------------------------------------- | ---------------------------------- |
| `--font-sans`    | `'Geist Variable', system-ui, sans-serif`         | body, UI, numerics                 |
| `--font-heading` | `'Bricolage Grotesque Variable'`, falls to `sans` | titles, brand — via `font-heading` |

**Two typefaces.** Geist carries body copy, controls and every numeric column; Bricolage
Grotesque is the display face, applied through the `font-heading` utility on page titles
(`h1`/`h2`), UI component titles (card, sheet, dialog) and the brand wordmark. Headings still
carry weight and tracking (`font-semibold` + `tracking-title` / `tracking-page-title`) — the
second family adds to that contrast, it does not replace it.

**Numerics stay on Geist.** KPI figures, day rates and paginated counts use `tabular-nums`
and sit in aligned columns; Bricolage's digits are far more characterful and read as noise
when stacked. Do not put `font-heading` on a number.

Bricolage is imported as the **`wght`-only variable build** (`@fontsource-variable/bricolage-grotesque/wght.css`,
41 KB latin) rather than `standard.css` (131 KB), which also ships the `wdth` and `opsz` axes.
Nothing varies width or optical size today. Switch the import if that changes.

## Type scale

| Token       | Size     | Line height | Usage                                    |
| ----------- | -------- | ----------- | ---------------------------------------- |
| `text-2xs`  | 11px †   | 15px        | uppercase labels, meta                   |
| `text-xs`   | 12.5px † | 17px        | pagination, badges, secondary links      |
| `text-sm`   | 14px     | 20px        | **the one to write** — body copy         |
| `text-base` | 14px †   | 20px        | **shadcn landing zone** — never write it |
| `text-md`   | 16px †   | 24px        | card/sheet/dialog titles, `lg` button    |
| `text-lg`   | 18px     | 28px        | Tailwind default — page title            |
| `text-xl`   | 20px     | 28px        | Tailwind default                         |
| `text-2xl`  | 24px     | 32px        | Tailwind default — marketing quote       |
| `text-3xl`  | 30px     | 36px        | Tailwind default — KPI figures, auth h1  |

† Four overrides. `2xs` does not exist in Tailwind at all; `xs` is nudged from 12px to keep a
readable gap under `sm`. The other two are the recentring: `base` drops from 16px to 14px,
and `md` is added at 16px to carry what `base` used to.

**`text-sm` and `text-base` are both 14px, and the split is deliberate.** Write `text-sm`.
`text-base` is reserved for imported code: every shadcn component writes it (`md` does not
exist upstream), so pinning it to the body size means a freshly added component lands
on-scale with no edit. Keeping it out of our own code is what preserves the split — retune
`--text-base` later and only imported markup moves.

`body` carries `text-sm` in `@layer base`, so unclassed text inherits 14px rather than the
browser's 16px. That is a safety net, not a substitute — a component still inherits from its
_parent_, so anything nested under a `text-md` title must declare its own size.

14px is the workhorse size: sidebar nav, buttons, table cells, body copy. Keep at least one
step between adjacent tokens in use — 12.5 and 13 were indistinguishable, which is why the
13px step was dropped.

### Importing a shadcn component

Nothing to do. The registry assumes a 16px body and writes `text-base` for body copy, which
resolves to 14px here — the component is on-scale as installed. The only manual step is
_promoting_ a title: if a new component's title should outrank its body, give it `text-md`.
That is a design decision no token can make, and it comes up rarely — every component with a
title (card, sheet, dialog, alert-dialog) is already installed.

The trade-off this buys: inaction no longer produces an inconsistency. Before the recentring,
skipping the review left a 16px island in a 14px UI; now skipping it leaves a title that is
merely unpromoted.

**The iOS zoom is real but untreated.** Form controls sit at 14px, and the viewport is
`width=device-width, initial-scale=1` with no `maximum-scale`, so Safari zooms when a native
`<input>`/`<textarea>` takes focus. Adding `maximum-scale=1` would stop it, at the cost of
killing pinch-to-zoom for everyone — a WCAG 1.4.4 failure. Scale consistency won; revisit
only with a fix that does not disable user zoom.

Tracking tokens: `tracking-label` (`.3px`, uppercase labels only), `tracking-title`
(`-.2px`), `tracking-page-title` (`-.3px`). Anything else uses Tailwind's own utilities.

Weights: **600** for emphasis, **500** for navigation.

## Text colors

Three tints drive the whole interface. They do **not** map 1:1 across themes: `#A1A1AA` is
detail text on light but reaches primary-text contrast on dark, so dark mode uses the
mirrored ramp from the same Zinc family. Same identity, inverted positions.

### Hierarchy rule

| Role    | Token                  | Applies to                                           |
| ------- | ---------------------- | ---------------------------------------------------- |
| Strong  | `foreground`           | titles, recruiter names, key values, **hover state** |
| Default | `secondary-foreground` | body text and **icons**                              |
| Detail  | `muted-foreground`     | meta, uppercase labels, secondary counts             |

Icons default to `secondary-foreground`, not `foreground` — an icon rendered at
`currentColor` inside a neutral container otherwise inherits full black and reads heavier
than the text it sits next to.

Interactive controls follow the same ramp: a segmented control's selected option sits at
`foreground` while unselected options stay at `secondary-foreground`; secondary links that
are genuinely optional (help, feedback) may rest at `muted-foreground` provided they carry
`hover:text-foreground`. Anything below AA must brighten on hover.

### Light

| Token                  | Hex       | oklch                      | Contrast on `card` |
| ---------------------- | --------- | -------------------------- | ------------------ |
| `foreground`           | `#18181B` | `oklch(0.210 0.006 285.9)` | 17.7:1             |
| `secondary-foreground` | `#52525B` | `oklch(0.442 0.015 285.8)` | 7.7:1              |
| `muted-foreground`     | `#6B6B74` | `oklch(0.531 0.014 285.9)` | 5.3:1              |
| `border`               | `#ECECEF` | `oklch(0.944 0.004 286.3)` | —                  |
| `border-soft`          | `#F1F1F3` | `oklch(0.959 0.003 286.3)` | —                  |

**Deliberate deviation from the mockup:** its light `text-muted` is `#A1A1AA`, which measures
**2.56:1** — below AA and below even the 3:1 large-text floor. That token carries real copy
throughout the app (page subtitle, KPI units, emails, hints), so it is darkened to `#6B6B74`
(5.3:1 on `card`, 4.8:1 on the grey surfaces). It stays clearly lighter than
`secondary-foreground` at 7.7:1, so the three-step hierarchy still reads.

### Dark

| Token                  | Hex       | oklch                      | Contrast on `card` |
| ---------------------- | --------- | -------------------------- | ------------------ |
| `foreground`           | `#F4F4F5` | `oklch(0.967 0.001 286.4)` | 16.1:1             |
| `secondary-foreground` | `#A1A1AA` | `oklch(0.712 0.013 286.1)` | 6.9:1              |
| `muted-foreground`     | `#8B8B94` | `oklch(0.640 0.013 286.0)` | 5.25:1             |
| `border`               | `#2A2A2E` | `oklch(0.287 0.007 285.9)` | —                  |
| `border-soft`          | `#232327` | `oklch(0.258 0.007 285.9)` | —                  |

**Deliberate deviation from the mockup:** its dark `text-muted` is `#71717A`, which measures
**3.67:1** on `card` and 3.24:1 on `muted` — both fail WCAG AA (4.5:1). Since this token is
the most-used text color in the app, that single value was the main cause of the dark theme
being hard to read. It is raised to `#8B8B94` (5.25:1 / 4.64:1), which passes AA on every
surface while keeping a visible step below `secondary-foreground`.

### Accent

`accent-foreground` and `sidebar-accent-foreground` are `#4F46E5`
(`oklch(0.511 0.23 277)`) in light, not the `--primary` indigo `#6366F1` the mockup uses.
Primary on the soft accent background measures 3.99:1 — the active nav item and the filter
badge both sit on that pair, so the darker indigo brings them to 5.6:1.

## Surfaces

| Role                           | Light     | Dark      |
| ------------------------------ | --------- | --------- |
| `background`                   | `#F5F5F6` | `#0E0E10` |
| `card` / `popover` / `sidebar` | `#FFFFFF` | `#18181B` |
| `muted` / `secondary`          | `#F6F6F7` | `#232327` |

## Radius

`--radius: 0.56rem` (≈9px) matches the mockup's dominant value (36 uses, ahead of 8px at 18).

## Auditing a screen

Reading classes off the source misses what actually renders — inherited colors, computed
sizes, opacity blends. Check the DOM instead: walk every element holding a text node, compare
its computed `fontSize` against the scale above, and measure its computed `color` against the
nearest opaque background. Flag anything off-scale, and anything under 4.5:1 (3:1 for text
≥18.66px, or ≥14px at weight 700).

Two traps to avoid: computed colors come back as `oklch()`, which needs converting to sRGB
before any luminance maths, and semi-transparent foregrounds must be composited over their
backdrop first. Run the sweep in **both themes** — toggle `.dark` on `documentElement` — and
with overlays open (menus, selects, drawers), since those surfaces never appear in a
default-state pass.
