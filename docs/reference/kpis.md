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
that is: `TODAY` is resolved client-side in
[`opportunities-utils.ts`](../../src/modules/opportunities/opportunities-utils.ts) and
travels as a parameter to each server function.

A server in UTC and a user in UTC+2 disagree for two hours every night. Deriving the
date server-side would shift every follow-up for anyone checking their tracker after
midnight — they would see yesterday's reminders. The same value also drives the
table's `due` filter.

It is resolved **once per page load**, not per render: it feeds React Query keys, and
a value that changed identity between renders would refetch on every one. A session
left open across midnight therefore keeps the stale date until the next navigation —
accepted, given the alternative is a refetch loop.

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
