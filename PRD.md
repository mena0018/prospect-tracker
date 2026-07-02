# PRD — ProspectTracker

## Contexte

Les freelances, alternants et chercheurs d'emploi suivent leur prospection à la main
(Notion, Excel, au feeling). Pas de relances automatiques, pas de scoring, pas d'envie
d'ouvrir l'outil le matin.

La douleur est vécue directement par le fondateur (Rabie, dev fullstack freelance depuis
5 ans) et confirmée par un form de validation en cours de diffusion.

## Problème

- Saisie 100% manuelle après chaque session de prospection
- Aucune relance automatique — on oublie de rappeler des contacts
- Pas de scoring pour prioriser les meilleures opportunités
- Pas de stats pour comprendre ce qui fonctionne
- Les outils existants (Teal, Folk, Notion) ne couvrent pas les plateformes EU
  (Malt, Freework, Collective)

## Cible

- Freelances dev en recherche de mission (LinkedIn, Malt, Freework, Collective)
- Alternants en recherche de contrat
- Chercheurs d'emploi actifs (CDI / CDD)

Segment prioritaire retenu : **freelances dev** (revenu récurrent, cycle mission répété,
douleur vécue par le fondateur → avantage produit réel sur Teal).

## Proposition de valeur

Le tracker de prospection pensé pour le cycle mission freelance des plateformes EU, avec
relances intelligentes et une vue qui pousse à l'action plutôt qu'à la contemplation.

> Positionnement : outil de travail quotidien orienté action (« qui je relance
> aujourd'hui ? »), pas dashboard analytique. Les stats/graphes sont réservés au tier Pro.

## Concurrents

| Outil               | Positionnement                | Gap                                          |
| ------------------- | ----------------------------- | -------------------------------------------- |
| Teal                | Job tracker US, chercheurs CDI| Pas de plateformes EU, pas de cycle mission  |
| Folk                | CRM relationnel généraliste   | Pas pensé pour le pipeline de missions       |
| Notion / Excel      | DIY                           | Aucune automatisation                        |
| HubSpot / Pipedrive | CRM B2B entreprise            | Trop lourd, pas adapté aux indépendants      |

## Approche de mise sur le marché

Inspirée du principe « vendre puis builder petit » : commencer par un MVP réduit
(~quelques jours de build), le mettre entre les mains de 3–5 freelances dev réels du réseau
du fondateur dès la première semaine, et valider la rétention (rouvrent-ils l'outil le
lendemain ?) avant d'ajouter les briques lourdes (extension, scoring IA).

**Canal d'acquisition principal à confirmer** : LinkedIn organique du fondateur +
communautés freelance tech EU. (Objectif MRR ci-dessous conditionné à ce canal.)

## Features

### MVP — v1 (gratuit) — buildable en quelques jours

**Tracker**

- Vue tableur par défaut (TanStack Table) + toggle kanban « Par étape »
- Colonnes : date dernier contact, recruteur, ESN, besoin, TJM/salaire, client final,
  étape, poste, présentiel (jours/semaine sur site, 0–5), localisation, expérience requise,
  téléphone, lien vers l'offre
- Étapes : Sauvegardé / Contacté / CV Envoyé / Entretien / Offre / Refusé / Ghosté
- Épingler une opportunité en haut de la liste
- Tri au clic sur les en-têtes, recherche globale, pagination
- TJM coloré vert/rouge selon un seuil marché (constante configurable, défaut 450 €)
- Saisie manuelle rapide (formulaire) — c'est « l'import » du MVP
- Bandeau de 4 KPI orientés action : à relancer aujourd'hui, opportunités actives,
  entretiens en cours, taux de réponse

**Relances**

- Relances email automatiques basées sur la date de dernier contact (cron Vercel + Resend)
- Section « Prochaines relances » dans la sidebar
- Délai configurable par étape

**Auth & essai sans compte**

- Inscription / connexion email (Supabase Auth)
- OAuth Google
- Essai sans compte : l'utilisateur peut saisir des opportunités avant de s'inscrire
  (stockées en local). À la création de compte, ses entrées sont migrées en base
  (one-shot), puis on bascule sur la BDD comme source de vérité unique. On l'incite vite
  à créer un compte pour ne pas perdre ses données.

**Landing page**

- Rendue côté serveur (SSR) dans la même app TanStack Start (bon pour le SEO)

### Pro — v2 (10€/mois)

- Scoring IA de l'opportunité (TJM vs marché, réputation client, adéquation poste)
- Stats et graphes : taux de conversion par ESN, TJM moyen, délai moyen entre étapes
- Relances avancées et séquences personnalisables
- Export CSV

### Post-MVP (après validation de la rétention)

- **Extension Chrome** : import 1 clic depuis LinkedIn, Malt, Freework, Collective.
  Repoussée volontairement : couche la plus fragile (DOM des plateformes) et la plus
  coûteuse à maintenir. On la construit une fois la saisie manuelle réellement utilisée.

### Hors scope v1

- Application mobile
- Intégration Google Calendar
- IA générative de messages de relance
- Multi-utilisateurs / mode équipe
- Internationalisation (i18n) — français uniquement au démarrage

## Modèle de pricing

| Plan    | Prix     | Contenu                                            |
| ------- | -------- | -------------------------------------------------- |
| Gratuit | 0€       | Tracker illimité, kanban, relances basiques        |
| Pro     | 10€/mois | Scoring IA, stats, relances avancées, export CSV   |

_À explorer : une limite sur le tier gratuit (nb d'opportunités ou de relances/mois) pour
créer une pression de conversion, si le gratuit se révèle « suffisant » pour trop de monde._

## Objectif MRR

10 000€/mois = 1 000 clients payants à 10€/mois.
Avec un taux de conversion freemium de 3-5% : 20 000 à 33 000 utilisateurs actifs
nécessaires. Objectif ambitieux pour un solo founder → conditionné à un canal d'acquisition
qui scale (voir « Approche de mise sur le marché »).

## Métriques de succès

- Utilisateurs actifs hebdomadaires
- Rétention J7 / J30 (signal n°1 en phase de validation)
- Taux de conversion gratuit → pro
- NPS

_(Cibles chiffrées à définir avant le lancement pour que ces métriques soient des critères
de décision, pas des intentions.)_

## Stack

Résumé : TanStack Start (SSR) + Supabase (Auth + Postgres) + Drizzle + TanStack Query/Table,
Resend, Stripe, PostHog, déploiement Vercel. Détails techniques et modèle de données : voir
`AGENTS.md`.

---

_Dernière mise à jour : juillet 2026_
