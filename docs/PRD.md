# PRD — ProspectTracker

## Context

Freelancers, work-study students and job seekers track their prospecting by hand (Notion,
Excel, gut feeling). No automatic follow-ups, no scoring, no reason to open the tool in the
morning.

The pain is felt directly by the founder (Rabie, freelance fullstack dev for 5 years) and
confirmed by a validation form currently being circulated.

## Problem

- 100% manual entry after each prospecting session
- No automatic follow-ups — contacts get forgotten
- No scoring to prioritize the best opportunities
- No stats to understand what works
- Existing tools (Teal, Folk, Notion) don't cover EU platforms (Malt, Freework, Collective)

## Target

- Freelance devs looking for a mission (LinkedIn, Malt, Freework, Collective)
- Work-study students looking for a contract
- Active job seekers (permanent / fixed-term)

Priority segment: **freelance devs** (recurring revenue, repeated mission cycle, pain felt by
the founder → a real product edge over Teal).

## Value proposition

The prospecting tracker built for the EU-platform freelance mission cycle, with smart
follow-ups and a view that drives action rather than contemplation.

> Positioning: a daily action-oriented work tool ("who do I follow up with today?"), not an
> analytics dashboard. Stats/charts are reserved for the Pro tier.

## Competitors

| Tool                | Positioning                     | Gap                                   |
| ------------------- | ------------------------------- | ------------------------------------- |
| Teal                | US job tracker, permanent roles | No EU platforms, no mission cycle     |
| Folk                | General relationship CRM        | Not built for a mission pipeline      |
| Notion / Excel      | DIY                             | No automation                         |
| HubSpot / Pipedrive | B2B enterprise CRM              | Too heavy, not suited to independents |

## Go-to-market approach

Inspired by "sell first, then build small": start with a lean MVP (~a few days of build), put
it in the hands of 3–5 real freelance devs from the founder's network in the first week, and
validate retention (do they reopen the tool the next day?) before adding the heavy pieces
(extension, AI scoring).

**Primary acquisition channel to confirm**: the founder's organic LinkedIn + EU freelance tech
communities. (The MRR target below is conditioned on this channel.)

## Features

### MVP — v1 (free) — buildable in a few days

**Tracker**

- Default table view (TanStack Table) + kanban "By stage" toggle
- Columns: last-contact date, recruiter, ESN, need, day-rate/salary, end client, stage, role,
  onsite (days/week on site, 0–5), location, required experience, phone, offer link
- Stages: **user-configurable per account** (seeded defaults: Saved / Contacted / CV Sent /
  Interview / Offer / Rejected / Ghosted). Each stage can be renamed, recolored, reordered and
  archived — see "Customize" below.
- Pin an opportunity to the top of the list
- Click-to-sort headers, global search, pagination
- Day-rate colored green/red against a **reference day-rate the user configures** (default €450)
- Quick manual entry (form) — this is the MVP's "import"
- 4 action-oriented KPIs banner: to follow up today, active opportunities, ongoing interviews,
  response rate

**Customize ("Personnaliser")**

- Edit the pipeline **stages** per account: rename, pick a color, reorder, archive, add new
  stages, and set a **per-stage follow-up delay** (days before an opportunity is "to follow up").
- Edit the **job types** and **experience levels** used in the opportunity form.
- Set the **reference day-rate (TJM)** used for green/red coloring.
- Changes apply live.

**Follow-ups**

- Automatic email follow-ups based on last-contact date (Vercel cron + Resend)
- "Upcoming follow-ups" section in the sidebar
- Delay configurable per stage

**Auth & no-account trial**

- Email sign-up / sign-in (Supabase Auth)
- Google OAuth
- No-account trial: the user can enter opportunities before signing up (stored locally). On
  account creation, their entries are migrated to the DB (one-shot), then the DB becomes the
  single source of truth. We push account creation early so they don't lose data.

**Landing page**

- Server-rendered (SSR) in the same TanStack Start app (good for SEO)

### Pro — v2 (€10/month)

- AI opportunity scoring (day-rate vs market, client reputation, role fit)
- Stats and charts: conversion rate per ESN, average day-rate, average delay between stages
- Advanced follow-ups and customizable sequences
- CSV export

### Post-MVP (after retention is validated)

- **Chrome extension**: 1-click import from LinkedIn, Malt, Freework, Collective. Deliberately
  deferred: the most fragile layer (platform DOM) and the most costly to maintain. Built once
  manual entry is actually used.

### Out of scope for v1

- Mobile app
- Google Calendar integration
- Generative AI for follow-up messages
- Multi-user / team mode
- Internationalization (i18n) — French only at launch

## Pricing model

| Plan | Price     | Contents                                           |
| ---- | --------- | -------------------------------------------------- |
| Free | €0        | Unlimited tracker, kanban, basic follow-ups        |
| Pro  | €10/month | AI scoring, stats, advanced follow-ups, CSV export |

_To explore: a limit on the free tier (number of opportunities or follow-ups/month) to create
conversion pressure, if the free tier turns out to be "enough" for too many people._

## MRR target

€10,000/month = 1,000 paying customers at €10/month. With a 3–5% freemium conversion rate:
20,000 to 33,000 active users needed. Ambitious for a solo founder → conditioned on an
acquisition channel that scales (see "Go-to-market approach").

## Success metrics

- Weekly active users
- D7 / D30 retention (signal #1 in the validation phase)
- Free → pro conversion rate
- NPS

_(Numeric targets to be defined before launch so these metrics are decision criteria, not
intentions.)_

## Stack

Summary: TanStack Start (SSR) + Supabase (Auth + Postgres) + Drizzle + TanStack Query/Table,
Resend, Stripe, PostHog, deployed on Vercel. Technical details: see `CLAUDE.md`. Data model:
see [`docs/DATA-MODEL.md`](DATA-MODEL.md) and the decision record in
[`docs/decisions/`](decisions/).
