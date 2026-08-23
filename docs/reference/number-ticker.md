# Number ticker

`src/components/number-ticker.tsx` — a KPI figure that counts up to its value instead of
appearing at it.

**Only the lead card uses it** (`kpi-band.tsx` passes `animated` to "à relancer aujourd'hui"); the
other three render their value as plain text. That card is already the one the border beam marks —
the motion is there to point at the number that asks for an action, and spreading it across all
four would flatten that back into decoration.

## Why `motion` is a dependency here

[Magic UI's `number-ticker`](https://magicui.design/docs/components/number-ticker) is built on
`useSpring`: a damped spring drives a `MotionValue`, and every frame writes the rounded number into
the DOM. That is real physics, not a keyframe — unlike [[border-beam]], which is a linear loop and
was ported to CSS precisely to avoid this dependency. Approximating a spring by hand means owning a
`requestAnimationFrame` tween and its easing, so `motion` earns its place here.

Now that it is installed, prefer it for any future animation that needs interruptible physics or
gesture/scroll input. The border beam deliberately stays on CSS: rewriting it would trade a free
compositor animation for a JS one and gain nothing.

## Divergences from upstream

Four, all forced by how KPIs behave in this app:

- **Formatting goes through `formatValue`.** Upstream hardcodes `Intl.NumberFormat("en-US")`, which
  would introduce a thousands separator that the surrounding UI does not use, appearing mid-count.
  The ticker produces the exact string the card rendered before it existed, suffix included.
- **`null` is not animated.** `responseRate` is `number | null` and renders as `—`. Counting up to
  zero would claim a 0% response rate that was never measured.
- **It re-animates on change.** Upstream freezes after the first pass (`useInView` with
  `once: true`). Here the KPI recomputes whenever the table is filtered, so the spring retargets on
  every new value and counts from wherever it currently sits.
- **`prefers-reduced-motion` renders the final value directly**, with no count.

Upstream's `delay` prop is dropped: it existed to stagger several tickers, and a single animated
card has nothing to stagger against.

## The DOM write is manual

The spring sets `textContent` on a ref, bypassing React — that is upstream's design and it is what
keeps per-frame updates off the render path. The consequence is that React will not reconcile that
text back: when a value becomes `null`, or when reduced motion is on, the component has to write
the text itself. That is the second `useEffect`'s non-obvious job, and why `value` is in its
dependency list.

If a future band ever animates several figures at once, reintroduce a per-instance delay rather
than a shared one: a staggered cascade only reads as a single wave under roughly 150 ms per step.
