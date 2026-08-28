# The board mechanism

`src/shared/board/` holds everything about a **column board** that carries no domain knowledge:
the cross-column drag wiring, the column and card shells, the empty drop zone and the move
announcer. A domain module supplies its columns, its cards and its commit handler — nothing else.

It sits beside `sortable/` and `table/` for the same reason they do: nothing inside knows what a
stage or an opportunity is. The test from CLAUDE.md holds — if it needed a domain type to compile,
it would be a module.

## Why not reuse `sortable/`

`sortable/` reorders **one vertical list**, and every part of it encodes that: `reorderWithEdge`,
the `closestEdge` hitbox, the top/bottom drop indicator, an `index` per item, and an announcer that
says "moved to position 3 of 12".

A board move is a different gesture. It crosses **between** lists, has no index, and — because
order inside a column is not persisted (see below) — no edge and no indicator. Reusing the sortable
hook would have meant threading a second axis through every one of those, to end up with two
behaviours sharing a name and nothing else.

What the two genuinely share is reused rather than copied: `useAnnounce` and `LiveRegion` back the
move announcement, and `DragHandle` is the same grip component. Pragmatic drag and drop is the same
library, chosen originally with this view in mind — see
[the sortable doc](sortable-mechanism.md) for why it beat `@dnd-kit`.

## Order within a column is not meaningful

A card's position inside its column is not persisted, and the board is explicit about that:

- There is no drop indicator between cards, and no edge detection. A drop anywhere in a column
  means "this column", not "here".
- A drop back into a card's own column resolves to `null` — a write that would show nothing.
- Cards are ordered pinned-first then most recently updated, server-side. That is the same lead
  sort as the list, so a pinned card sits at the top of its column exactly as it sits at the top
  of the table.

Anything else would promise an ordering the next reload would not keep.

## Dragging is an addition, never a replacement

The same rule as the sortable lists, for the same reason: each card carries a grip **and** a menu
whose entries move it to any other column. A mouse-only board would regress the keyboard path that
Customize already ships.

The menu lists every active stage except the card's own, which is not a destination. A card in the
only active stage therefore renders no menu at all, rather than an empty one.

Every move — dragged or chosen from the menu — goes through one `commitMove`, so the screen-reader
announcement covers both paths and cannot drift between them.

## The drop resolution is a pure function

`resolveDrop` is exported and unit-tested rather than living inside the `onDrop` closure, because
it is the only judgement in the drag path and it is otherwise unreachable: Pragmatic drives its
drags through internal state that neither CDP's synthetic mouse events nor a hand-dispatched
`DragEvent` can enter. Driving a real drag from automation fires `dragstart` and nothing after it.

So the wiring is verified in the browser as far as it goes (the grip is a real focusable button and
`dragstart` fires), and the decision it feeds — which column a drop resolves to, and when a drop is
a no-op — is covered by tests.

`resolveDrop` reads the innermost drop target first, so a card dropped **onto another card** lands
in that card's column rather than missing the column behind it.

## Every drag is namespaced

Like the sortable lists, each drag carries a `boardId`, and both the source and the target are
checked against it. A payload from another board — or a malformed one — resolves to `null` instead
of moving the wrong card.
