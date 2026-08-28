# KPIs — dashboard band

The four cards above the opportunities table. They are **derived**, never stored:
[`getOpportunitiesSummary`](../../src/modules/opportunities/opportunities-server.ts)
computes them in a single SQL pass of `count(*) filter (where …)` aggregates.

They deliberately span **every** row, not the table's current page, so they keep their
own query key and survive paging, sorting and filtering untouched.

The "à relancer" rule they build on lives in
[`data-model.md`](data-model.md).

## The four cards

| Card                   | Counts                                                                 |
| ---------------------- | ---------------------------------------------------------------------- |
| À relancer aujourd'hui | Opportunities whose follow-up due date has been reached (see below)    |
| Sans réponse +7j       | Active, still awaiting a reply, last contacted more than 7 days ago    |
| Entretiens à venir     | Active opportunities sitting in the interview stage                    |
| Taux de réponse        | Share of contacted opportunities that got any reply, refusals included |

## What the response rate actually measures

```
taux de réponse = replied / contacted
```

- **`contacted`** (`isContacted`) — every **system** stage except Sauvegardé. Nobody was
  contacted in the entry stage, so it would drag the ratio down for free.
- **`replied`** (`hasReplied`) — Entretien, Proposition, **and Refusé**.

**A rejection is a reply.** "Votre profil ne correspond pas" is an answer, and it is the most
common one. The card used to count only Entretien and Proposition, which measured how far an
opportunity _progressed_ — a conversion rate wearing a response rate's name. A freelancer
reading 5% could not tell whether they were being ignored or turned down, which are two
different problems with two different fixes.

**Ghosté is not a reply**, it is the absence of one — so it sits in the denominator and stays
out of the numerator. That asymmetry is the point of the card.

**Free stages are neutral on both sides.** They used to count as contacted while never being
able to count as replied, which silently pushed the rate down for anyone who added a stage of
their own. An opportunity parked in "Entretien technique" has necessarily passed through the
seeded stages already, so leaving it out of both sides changes nothing it can answer — and
keeps the aggregate answerable, which is the same reason the KPIs key off `system_key` at all.

The archived flag appears **nowhere** in this. It used to: the rule read "or an archived
stage", which worked only for as long as Refusé happened to ship archived, and silently
scored rows as replies for any stage the user archived themselves. Archiving is a display
choice; `system_key` carries the meaning.

### The known approximation

A recruiter who replies without the opportunity moving stage is not counted. The rate
therefore **under-reports**, and there is no way around it from the current schema: nothing
records that a reply happened, so it can only be inferred from the stage. Making it exact
needs an explicit `first_reply_at` on `opportunities` — a model change, deliberately out of
scope here. The card now under-states the thing it names, where before it named one thing and
measured another.

## A terminal stage raises no follow-up

`isDueExpression` and `isDoneTodayExpression` both open with `not isTerminal`
([`opportunities-sql.ts`](../../src/modules/opportunities/opportunities-sql.ts)), so an
opportunity sitting in Refusé or Ghosté never enters the follow-up queue and never counts
towards the day's workload. Chasing a lead the user already marked as rejected is the one
reminder the product must never send.

This was free while both stages shipped archived — `not isArchivedRow` covered it. It is a
rule of its own now that Refusé is an active stage, and it holds for a **user-archived**
stage too, since the two conditions are independent.

A reminder date already stored on such a row is left untouched rather than cleared: the
suppression is a read-time rule, so moving the opportunity back out of Refusé restores its
follow-up instead of having silently destroyed it.

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

When no opportunity has been contacted, the response rate is `null` and the card renders
`—` rather than a misleading `0%`.

## Why `system_key`, not names or positions

Stages are user-renamable (see
[0001-user-configurable-pipeline.md](../decisions/0001-user-configurable-pipeline.md)),
so matching on the string `'Entretien'` breaks the moment someone renames it — and
never works for an English-speaking user. Matching on `position` survives a rename but
breaks on a reorder, silently: the "interviews" card would count CVs sent, with no
error anywhere.

The KPIs therefore key off `stages.system_key`, a stable identity written once at seed
and immutable afterwards (a trigger rejects any rewrite). It survives both a rename and
a reorder.

Two kinds of stage follow from this:

- **System stages** — the seven seeded ones (`saved`, `contacted`, `cv_sent`,
  `interview`, `offer`, `rejected`, `ghosted`). Renameable, recolourable,
  delay-configurable, hideable — but **not deletable**, because a KPI depends on each.
  Two of them, `rejected` and `ghosted`, are also **terminal**: the opportunity is over.
- **Free stages** — anything the user adds on top, with `system_key = null`. Fully
  editable and **neutral**: they stay out of the response rate on both sides, and out of
  every other aggregate.

That neutrality is what keeps the aggregates answerable. If "Entretien technique" and
"Entretien RH" were both free stages, "how many interviews this month" would have no
single answer — so reaching an interview is recorded by the system stage, and the free
stages a user invents around it stay out of the count.

**In SQL, a null `system_key` needs `is not true`, not `not (...)`.** A free stage makes
`system_key = 'saved'` evaluate to `null`, and `not null` is `null`, which fails a
`filter (where ...)` clause — the row would drop out of the count instead of being
counted as neutral. See `getOpportunitiesSummary` in
[`opportunities-server.ts`](../../src/modules/opportunities/opportunities-server.ts).

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

- **Due and done never overlap**, by construction: `isDoneTodayExpression` ends with
  `not isDueExpression(today)` rather than re-deriving the due date, so the two cannot drift
  apart. A row contacted today whose forced reminder is still in the past stays _due_, not
  _done_: counting it on both sides inflated the day's total past the number of real
  opportunities.
- **Moving a row to a terminal stage counts as done, not as vanished.** Following up and then
  marking the opportunity Refusé takes it out of the due side; without this it left the total
  too, so the day's workload silently shrank from `0/1` to nothing and the bar lost the work
  the user had just done. Negating the due expression is what keeps that row on the done side.
  An older terminal row that was not contacted today still counts on neither side.
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
