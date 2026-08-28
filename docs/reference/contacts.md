# Contacts

A contact is a person, reusable across opportunities. The value is not the isolated mission,
it is the relationship history: the same ESN account manager pitches three missions over two
years, changes company, calls again a year later.

The scenario the feature exists for: **an unknown number calls, and the number is typed into
the search box while the person talks**. Everything below is shaped by that.

## The model

Three tables, [`src/db/schema.ts`](../../src/db/schema.ts) as always the source of truth:

- `contacts` — identity, reachability, relationship type, notes.
- `opportunity_contacts` — the many-to-many link, **ordered**.
- `opportunities` — no longer carries a `recruiter` text column.

### Reachability is stored as arrays, not a child table

`emails text[]` and `phones text[]`. A child table would be more normalised and would leave
room for per-entry labels ("mobile", "work"), and it was rejected anyway: reachability is
**read whole and written whole**, never queried one entry at a time. A join on every list query
and a nested editor in the form buy nothing at this size.

The caps (`MAX_EMAILS`, `MAX_PHONES`) live in the schema, not the database — five of each is a
form ergonomics decision, not an invariant worth a constraint.

### The link is ordered, and position 0 means something

`opportunity_contacts.position` is the array index of the contact in the opportunity's own
list. **Position 0 is the contact who pitched**, and it is what the tracker's Contact column
shows and sorts on. An opportunity typically carries the account manager who brought it plus
the engineer who ran the interview; without an order, "who pitched this" is unrecoverable and
the column would need an arbitrary alphabetical tiebreak.

Writing the list is one operation: `setOpportunityContacts` deletes every link and reinserts
the array. Linking, unlinking and reordering are therefore the same code path, and there is no
partial state where two contacts claim position 0.

### Two check constraints, both mirrored in Zod

- `contacts_identified` — at least one of first name, last name, company. A contact with none
  of the three cannot be addressed or found, and the row would be dead weight.
- `contacts_relationship_token` — the relationship is a closed set, not free text. That is the
  whole point of the field: it separates a lead source from a decision maker, and the list
  filters on it.

Both are enforced again in `contacts-schema.ts` so the user gets a field error rather than a 500. The Zod side is the mirror, never the authority — Drizzle bypasses RLS, so the database
has to hold the line on its own.

`updateContactSchema` cannot simply be `.partial()`: Zod refuses `.partial()` on a schema
carrying a refinement. The identity rule is therefore a standalone predicate, applied to the
create schema whole, and to the patch only when it actually touches one of the three names —
a patch setting `city` must not be rejected for saying nothing about the name.

`.partial()` is also not enough on its own: a key carrying `.default()` still materialises that
default when omitted, so `{ id }` alone parsed to `{ emails: [], phones: [], relationship:
'other' }` and `updateContact` handed that straight to the `UPDATE` — a patch touching only the
city wiped every stored email and phone. The patch schema therefore re-declares those three keys
as plain optionals, while create keeps its defaults, where they are correct because the row is
new.

## Searching by phone number — the incoming call

A phone number is typed and stored in whatever shape each person prefers: `+33 6 12 34 56 78`,
`06 12 34 56 78`, `0612345678`. Matching them means reducing both sides to one canonical form.

**Stripping non-digits is not enough**, and getting this wrong is silent. `+33 6 12 34 56 78`
reduces to `33612345678`, the same number typed `06 12 34 56 78` reduces to `0612345678`, and
neither is a substring of the other — so the number you are staring at on the caller ID finds
nothing. `digits_only()` therefore also folds a leading `33` back to `0`, the national form
users actually type. Verified across all six shapes plus prefix and suffix fragments.

`contact_phone_digits()` normalises **each array entry separately** before joining. Joining
first and normalising after would let one number's tail run into the next one's head and match
a number nobody ever stored.

The client mirror is `digitsOf` in
[`contacts-sql.ts`](../../src/modules/contacts/contacts-sql.ts). **The two must agree exactly**
— they are one rule expressed twice, and a divergence shows up as a lookup that quietly misses.

A term only reaches the phone branch if it looks like a number (`DIGIT_TERM`). A term reducing
to no digits is skipped entirely: an empty digit string would `LIKE '%%'` and match every
contact holding any phone number at all.

## Search and sort still work by recruiter name

The ticket's constraint: nothing is lost for the user. Both were preserved by moving them
through the join rather than dropping them.

- **Search** — `matchesSomeContact` is an `EXISTS` over the linked contacts, OR-ed into the
  same per-term group as the opportunity's own columns. It matches **any** linked contact, not
  only the primary one, so finding a mission by the engineer who interviewed you still works.
- **Sort** — `SORT_COLUMNS` renamed `recruiter` to `contact`, and the expression is a
  correlated subquery returning the position-0 contact's name. It is correlated rather than
  joined so an opportunity with **no** contact still returns its row; a join would drop it.

The `opportunities_user_pinned_recruiter_idx` index went with the column. Sorting now reads the
contacts table through the link, which is what `opportunity_contacts_opportunity_position_idx`
exists for.

## The migration is one-way, and that is deliberate

[`drizzle/0008`](../../drizzle/0008_melted_sphinx.sql) creates the tables, **backfills contacts
from the recruiter names, and only then drops the column**. Order matters: the backfill reads
the column it is about to destroy.

Distinctness is case- and accent-insensitive per user, so `Thomas Vasseur` and
`thomas vasseur` collapse into one relationship rather than two. The surviving spelling is the
one on the earliest opportunity, and the ESN carried by that same opportunity becomes the
contact's company — the best guess available from the data at hand.

Names split on the **last** space, so `Jean-Pierre Le Goff` keeps `Le Goff` together. A
single-word entry becomes a **last name alone**. Splitting on the first space with
`substr(name, strpos(name, ' ') + 1)` was tried and is wrong: `strpos` returns 0 when there is
no space, `substr(name, 1)` hands back the whole string, and `Vanessa` lands in both columns.

Internal whitespace is collapsed **before** grouping, and the split runs once in its own CTE
that both the insert and the join read. Skipping either lets `John  Doe` and `John Doe` form two
groups that split to the same `('John', 'Doe')`: the join then matches each opportunity to both
contacts and writes two position-0 links. Replayed on a copy of production carrying that exact
pair, the earlier shape produced 80 links for 78 opportunities; the current one produces 78,
with no opportunity holding more than one link.

Verified on a copy of production before running for real: 76 named opportunities → 52 contacts
and 76 links, zero names lost, every per-contact opportunity count preserved, no duplicated or
unidentified names.

There is deliberately **no cohabitation** — after the migration the recruiter text does not
exist anywhere, so the two representations cannot drift.

## RLS

`contacts` follows the `0001` shape exactly: owner column, `authenticated` only, one policy per
operation. `opportunity_contacts` carries no owner column of its own, so its policies check
ownership through the contact, and the INSERT **and UPDATE** policies check the **opportunity
side too**, on both `USING` and `WITH CHECK` — a crafted payload must not link one account's
opportunity to another's contact, and an UPDATE that only validated the contact would let a user
repoint their own contact at somebody else's opportunity by editing `opportunity_id`. The server
functions repeat that check because Drizzle bypasses RLS entirely; see
[`data-access-security.md`](data-access-security.md).

## See also

- [`data-model.md`](data-model.md) — the surrounding tables
- [`server-side-table.md`](server-side-table.md) — the search/sort/paging rules the contacts
  list follows too
- [`opportunity-form.md`](opportunity-form.md) — the form conventions the contact sheet mirrors
