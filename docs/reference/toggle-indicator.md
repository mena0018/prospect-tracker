# Toggle indicator

`src/components/ui/toggle-indicator.tsx` — the selected-state pill of a segmented control, as a
single element that **travels** between items instead of one background per item.

Used by the Actives/Archivées tabs (`opportunities-toolbar.tsx`).

## Why it can't be the item's own background

`ToggleGroupItem`'s `selected` variant paints `data-pressed:bg-card` on the item itself. That is a
correct static style and gives an instant swap: the old item loses its background, the new one
gains it, with nothing in between. There is no element that exists in both states, so there is
nothing to animate.

The fix is one pill shared by every item. `motion`'s `layoutId` links the element across unmounts:
when it disappears from one item and appears in another, Motion measures both boxes and
interpolates. Measured on the real toolbar, sampling every 25 ms during a switch:

```
x = 372 → 329 → 249 → 175 → 119 → 83 → 61 → 50
```

Large steps first, small ones at the end — the spring settling, not a linear tween.

So an item using this must **turn its own pill off**, which is what the `data-pressed:bg-transparent`
resets in `TAB_ITEM` do. Leaving them on paints a static background under the travelling one and
the movement disappears behind it.

## `groupId` is not optional

`layoutId` is **global**. Two segmented controls on the same page using the same id would animate
into each other — click a tab and the locale switcher's pill flies across the toolbar. `groupId`
namespaces it, and the consumer wraps its items in a matching `<LayoutGroup id="…">`.

The two must agree. A `LayoutGroup` with no matching `groupId` silently falls back to global
behaviour rather than erroring.

## Stacking

The pill is `absolute inset-0 -z-10` inside the item, so it sits behind the label. The item needs
`relative isolate`: `relative` for the positioning context, `isolate` so the negative z-index stays
trapped inside the item rather than escaping behind the toolbar's own background.

## Reduced motion

`useReducedMotion()` swaps the spring for `duration: 0`. The pill still renders and still moves to
the right item — only the travel is removed, so the control keeps its selected state and degrades
to exactly the instant swap it had before. The element is never dropped, because that would take
the selected background with it.

Not verified end to end: the OS-level setting cannot be toggled from the page, so this path rests
on the hook rather than an observed run.

## Reusing it elsewhere

`locale-switcher.tsx` is the other segmented control in the app and is deliberately **left alone**
for now — it is a two-item switch in the header where the travel would read as noise rather than
continuity. If it ever adopts this, it needs its own `groupId` and the same `data-pressed` resets.
