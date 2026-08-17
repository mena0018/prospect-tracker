# Border beam

`src/components/ui/border-beam.tsx` — a light beam that travels along a container's border.
Used on the "à relancer aujourd'hui" KPI card (`kpi-band.tsx`) when the count is above zero, to
pull the eye to the only card that asks for an action.

## Why a local port instead of the registry component

[Magic UI's `border-beam`](https://magicui.design/docs/components/border-beam) ships as a
`motion/react` component. Its animation is a single `offsetDistance` tween, linear, infinite, with
no gesture, no spring and no layout animation — everything CSS keyframes already do. Adding
`motion` (~50 kB gzipped, plus a client boundary in an SSR app) for that would break the
"avoid unnecessary dependencies" rule in `CLAUDE.md`, so the geometry is ported verbatim and only
the driver changed.

`motion` has since been added for `docs/reference/number-ticker.md`, whose spring genuinely needs
it. That does not make this port obsolete: switching the beam back to `motion` would replace a
compositor-driven CSS animation with a JS one that ticks every frame, for an identical result.

Kept identical to the upstream component: the masking trick (a transparent border painted through
two intersecting masks clipped to `padding-box`/`border-box`, so only the border ring shows), the
`offset-path: rect(...)` track, and the `aspect-square` gradient sprite. Reintroduce `motion` only
if the beam ever needs to react to state — hover, scroll progress, an enter/exit transition.

## Moving parts

- **`--animate-border-beam` + the `border-beam` keyframes** live in `@theme inline`
  (`src/styles/globals.css`); Tailwind 4 turns the theme variable into the `animate-border-beam`
  utility. `duration` and `delay` are passed as inline styles rather than theme values because they
  vary per instance.
- **`prefers-reduced-motion: reduce`** kills the animation in `@layer base`. The beam then sits at
  its start offset — a static highlight, which is the intended degradation. The card keeps its
  `border-destructive/25` colour either way, so the alert never depends on motion alone.
- **The host element needs `relative` and `overflow-hidden`**, and its radius is inherited via
  `rounded-[inherit]`.
- Colours default to `--color-destructive` fading to transparent, so the beam follows the alert
  palette in both themes instead of Magic UI's fixed orange/violet.

## One slow beam

The KPI card renders a single beam on a 12s lap. The point is an ambient signal, not a spinner:
one light drifting around the card reads as "this one needs attention" without competing with the
table for the eye. A second beam, or a shorter lap, turns it into a loading indicator.

`delay` exists for staggering several beams and is negated inside the component
(`animation-delay: -delay`), so a delayed instance starts mid-lap instead of waiting.
