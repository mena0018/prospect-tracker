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

## The whole card is the drag source

Unlike the sortable rows, a card carries **no grip**. Atlassian's own design guidelines put it this
way: _"if an entity is draggable, make the whole entity draggable. If the entity has other
interactive parts like buttons or dropdowns, make only the drag handle icon the draggable part."_

The sortable rows take the second half of that sentence, because a stage row is built out of
`CommittedInput`, `StageColorPicker` and a menu — there is barely any row left to grab, and
`elementFromPoint` cannot hit-test around them reliably.

A card is the opposite: it is mostly text, with two small controls in one corner. So it takes the
first half. `canDrag` rejects a drag whose starting point lands on a control, which keeps pressing
the pin or opening the menu from lifting the card. One subtlety: the card is itself a
`role="button"`, so `closest()` finds _it_ from anywhere inside — the guard only counts a control
that is not the card.

The cost of dropping the grip is that nothing on the card announces it can be dragged, so the card
says it another way: a `grab` cursor, and a hover state that lifts it a pixel with a deeper shadow.

## Dragging is still an addition, never a replacement

The same rule as the sortable lists, for the same reason: every card carries a menu whose entries
move it to any other column. A mouse-only board would regress the keyboard path that Customize
already ships. The card is a focusable `role="button"` that opens the panel on Enter or Space, and
the menu beside it carries the moves.

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
