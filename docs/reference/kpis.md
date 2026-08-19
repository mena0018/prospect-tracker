# KPIs — dashboard band

The four cards above the opportunities table. They are **derived**, never stored:
[`getOpportunitiesSummary`](../../src/modules/opportunities/opportunities-server.ts)
computes them in a single SQL pass of `count(*) filter (where …)` aggregates.

They deliberately span **every** row, not the table's current page, so they keep their
own query key and survive paging, sorting and filtering untouched.

The "à relancer" rule they build on lives in
[`data-model.md`](data-model.md).

## The four cards

| Card                   | Counts                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| À relancer aujourd'hui | Opportunities whose follow-up due date has been reached (see below) |
| Sans réponse +7j       | Active, still awaiting a reply, last contacted more than 7 days ago |
| Entretiens à venir     | Active opportunities sitting in the interview stage                 |
| Taux de réponse        | Share of contacted opportunities that got any reply                 |

"Awaiting a reply" excludes the interview and offer stages: reaching them _is_ the
reply. The response rate counts an opportunity as replied when it reached interview,
offer, or an archived stage (Refusé is a response; Ghosté, seeded archived, is
counted as one too — a known rough edge).

## "Today" comes from the browser

Every one of these rules is relative to a day, and the server never decides which day
that is: the date is resolved client-side by
[`useToday()`](../../src/hooks/use-today.ts) and travels as a parameter to each server
function.

A server in UTC and a user in UTC+2 disagree for two hours every night. Deriving the
date server-side would shift every follow-up for anyone checking their tracker after
midnight — they would see yesterday's reminders. The same value also drives the
table's `due` filter.

**It follows the clock across midnight**, so a tab left open overnight picks up the new
day on its own — the date feeds React Query keys, so a new day changes the keys and
everything refetches. How that is scheduled: [`today.md`](today.md).

Opportunities still in the first stage (Sauvegardé) are excluded from the response
rate entirely: nobody was contacted, so they would unfairly drag the ratio down.
When no opportunity has been contacted, the rate is `null` and the card renders
`—` rather than a misleading `0%`.

## Why stage positions, not names

Stages are user-renamable (see
[0001-user-configurable-pipeline.md](../decisions/0001-user-configurable-pipeline.md)),
so matching on the string `'Entretien'` would break the moment someone renames it —
and never work at all for an English-speaking user. The KPIs therefore key off the
seeded `position` values: 0 Sauvegardé, 3 Entretien, 4 Offre.

This trades one fragility for another, deliberately:

- **Renaming a stage** keeps the KPIs correct — the common case.
- **Reordering or deleting** a seeded stage silently changes what they count — the
  rarer case, and the one the user is more likely to connect to their own edit.

The real fix is an explicit semantic marker on the stage row (a `kind` column, or a
nullable `semantic` enum) so the meaning survives any rename _and_ any reorder. That
is a schema change, deferred to the Customize ticket (DEV-26) which owns stage
editing.

## Response-rate trend

The mockup shows a "+N pts vs mois dernier" delta under the response rate. It is
**not implemented**: computing it needs a history of stage transitions (when an
opportunity entered Entretien), and nothing in the schema records that — the
`opportunities` row only carries its current state.

Shipping it means choosing a model first: an append-only stage-transition event
table, or a periodic snapshot of the aggregate. Until then the card shows the rate
alone.

## Tab counts carry the active filters

`activeCount` / `archivedCount` answer "how many rows land on that tab if I click it", so they
apply the search **and** the due filter — not just the search. Leaving `due` out made the toolbar
contradict itself: the table showed 16 rows behind a "à relancer" chip while the tab still read
"Active 22".

Because [`isDueExpression`](../../src/modules/opportunities/opportunities-sql.ts) opens with
`not isArchivedRow`, the two conditions are mutually exclusive: **Archived reads 0 for as long as
the due chip is on**, and archiving a due row does not move it to that count — it drops out of
both. That is the intended reading of "archived": a row you have stopped following up. The chip
is removable in one click, which is what makes the dead-end acceptable.

The KPI band above the table is unaffected — those four figures stay global by design.

## The sidebar's daily follow-up progress

The follow-ups card in the sidebar shows the same "à relancer" figure as the lead KPI, plus a
progress bar. Both read [`isDueExpression`](../../src/modules/opportunities/opportunities-sql.ts) —
the rule is defined once and never recomputed client-side.

The bar's denominator is **not** a target the app invents. It is the day's workload:

```
done  = rows contacted today          (isDoneTodayExpression)
total = rows still due + done         (dueCount + doneToday)
```

Written that way, following up on a row moves it from one side of the fraction to the other, so
the total holds still for the day while the bar fills — `0/16`, `1/16`, `2/16`. Using the due
count alone as the denominator would shrink it on every follow-up, and the bar would appear to
advance twice as fast while the goalposts moved.

Two consequences worth knowing:

- **Due and done never overlap.** A row contacted today whose forced reminder is still in the
  past stays _due_, not _done_: counting it on both sides inflated the day's total past the
  number of real opportunities.
- **A row contacted twice in one day counts once.** `last_contact_at` is a date, not a log. An
  exact count needs a contact-history table, which belongs with the follow-up emails (DEV-23).
- **Opportunities created today are excluded.** The creation form defaults `last_contact_at` to
  today, so without `created_at < today` in the expression, merely adding an opportunity scored a
  follow-up the user never made — the counter read `1/2` after a create. The trade-off is the
  mirror image: creating a row and following it up the same day goes uncounted, which has no
  real-world meaning since the contact just happened.

  The `created_at` comparison is against UTC midnight of the browser's day, not local midnight —
  `today` is a local date string and `created_at` is a `timestamptz`. The inequality direction is
  what makes the imprecision safe: a row created today can never fall before that boundary, so the
  exclusion holds in every timezone.

- **A day with nothing due reads as complete, not as 0 %.** `total === 0` would otherwise divide
  by zero; the card simply does not render, since there is no work to celebrate.

### Two kinds of empty

"Nothing to follow up" means two different things, and the card says which:

| Pipeline | Due today | What renders                                              |
| -------- | --------- | --------------------------------------------------------- |
| empty    | 0         | "Aucune opportunité · Le suivi démarre ici" + primary CTA |
| has rows | 0         | a calm card: "Tout est à jour · Objectif du jour atteint" |
| has rows | > 0       | the counter, the ring and the action button               |

An empty pipeline is not a quiet day, it is a product with no data yet — so it gets the one
action that matters instead of a reassurance about work that does not exist. The ring still holds
a figure there, a plain `0`: an empty ring around a grey icon reads as a component that failed to
load, where a zero reads as a count. And the button says _Suivre un premier contact_ rather than
_Ajouter une opportunité_ — the first is the promise, the second is a database row.

The section itself never disappears. Hiding it left the sidebar with a skeleton that resolved
into nothing at all: the group rendered while the counts loaded, then vanished once they showed
an empty pipeline. Keeping a muted card in that slot fixes both the vanishing skeleton and the
hole it left above the footer.

### One skeleton, one height

Every state fills the same two blocks — a 46px heading and a 32px action — so the card holds a
single height (~117px) whatever it is showing. That is what makes the skeleton correct by
construction rather than by luck: it fills the same two blocks, so it cannot be the wrong shape
for the state that follows it.

Progress rides on a ring around the badge
([`ProgressRing`](../../src/components/ui/progress-ring.tsx)) instead of a bar on its own row. A
bar only has something to say while work is pending, so it forced either a conditional block —
and a height that jumps — or an empty reserved row. A ring is a property of a badge that exists
in all four states, which costs no vertical space at all.

The caught-up state keeps the same action as the working card (_Lancer les relances_), disabled.
One label in one slot reads as a single object switched off, where swapping the verb between
states made the eye re-read the button on every transition.

### The celebration is a DOM burst, not a canvas

The confetti are fourteen absolutely-positioned spans animated by a CSS transform
([`FollowUpBurst`](../../src/components/layout/follow-up-burst.tsx)), following the design
handoff. The first implementation used `canvas-confetti`, which fought the card on two fronts:
its origin is a coordinate normalised over the canvas, so anchoring the burst to the badge meant
measuring geometry at fire time — and the celebration badge mounts on the same tick the burst
fires, so a ref to it is still `null` when read. Both problems dissolve when the particles are
children of the badge: position is structural, and nothing has to be measured. The dependency
was dropped with it.

The full choreography, all from the handoff: the ring draws to 100% (550ms), the badge pops
`scale(.35 → 1.14 → 1)` (500ms) inside a halo expanding to a 15px transparent ring (800ms), the
card breathes once to `scale(1.016)` (620ms), the text rises 4px (340ms), and the state holds
3600ms before settling. Under `prefers-reduced-motion` the burst does not render at all and the
check simply fades in over 180ms — the information lands, the party does not.

### Success and idle differ by one line

The celebrating card reads _Objectif atteint_ over the same caption and the same disabled button
the idle card carries, so settling out of the celebration changes exactly one line of text. An
earlier version swapped all three at once — title, count and button — which turned a two-second
reward into a screen to re-read.

The caption avoids naming a deadline for a reason: _Rien avant demain_ is a promise the card
cannot keep, since back-dating an opportunity makes a follow-up due the same minute. _Aucune
relance en attente_ describes the queue instead, and stays true because the state that
contradicts it is the state that replaces it.

Every state's text block carries a 300ms crossfade keyed on the state name, so wording changes
fade rather than snap. The celebrating branch overrides it with the rise, which subsumes it.

### The celebration watches a transition, not a state

Clearing the last due row fires a one-shot confetti burst, then the card settles into its quiet
state. What triggers it is
[`justClearedQueue`](../../src/modules/stages/utils/celebration.ts) — the due count going from
`> 0` to `0` **within the session**, never the count merely _being_ zero.

The distinction is the whole point. Testing the state instead celebrated things the user never
did: creating an opportunity dated today took the count to zero and set off confetti, immediately
followed by "nothing is due" — congratulating someone for work they had not done, then telling
them there was none. A first render on an already-clear day did the same.

Because the trigger is a transition, the card needs no "already celebrated" flag and nothing to
reset at midnight: a new day that starts with due rows simply transitions again when it is
cleared.
