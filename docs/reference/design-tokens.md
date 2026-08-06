# Design tokens

Source of truth for typography and text colors.

Implementation: `src/styles/globals.css` (`@theme inline` block).

The guiding rule is **stay on Tailwind's defaults**. Every override is a step someone has to
memorise, so the scale below only departs from stock Tailwind where the product genuinely
needs it — two steps, both below `sm`. Reach for a stock utility before proposing a new
token.

## Fonts

| Token            | Stack                                     | Usage      |
| ---------------- | ----------------------------------------- | ---------- |
| `--font-sans`    | `'Geist Variable', system-ui, sans-serif` | everything |
| `--font-heading` | alias of `--font-sans`                    | everything |

The app is **single-typeface**: Geist covers body copy and headings alike. `--font-heading`
stays as an alias so a display face can be swapped in later without touching call sites.
Headings separate from body copy through weight and tracking (`font-semibold` +
`tracking-title` / `tracking-page-title`), not through a second family.

Numeric columns (KPI figures, day rates, dates) use `tabular-nums` so digits stay aligned
across rows.

## Type scale

Stock Tailwind, with two additions below `sm`. `text-sm` and everything above it are
untouched Tailwind values, so the ramp is strictly increasing and `base` is still 16px.

| Token       | Size     | Line height | Usage                                     |
| ----------- | -------- | ----------- | ----------------------------------------- |
| `text-2xs`  | 11px †   | 15px        | uppercase labels, meta                    |
| `text-xs`   | 12.5px † | 17px        | pagination, badges, secondary links       |
| `text-sm`   | 14px     | 20px        | nav, buttons, table cells, most body copy |
| `text-base` | 16px     | 24px        | card and section titles, brand name       |
| `text-lg`   | 18px     | 28px        | Tailwind default — page title             |
| `text-xl`   | 20px     | 28px        | Tailwind default                          |
| `text-2xl`  | 24px     | 32px        | Tailwind default — marketing quote        |
| `text-3xl`  | 30px     | 36px        | Tailwind default — KPI figures, auth h1   |

† The two overrides, both for text too small to have a stock equivalent that fits: `2xs` does
not exist in Tailwind at all, and `xs` is nudged from 12px to keep a readable gap under
`sm`. Everything from `sm` up is stock.

`text-sm` (14px) is the workhorse: sidebar nav, buttons, table cells, body copy. Keep at
least one step between adjacent tokens in use — 12.5 and 13 were indistinguishable, which is
why the 13px step was dropped.

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
