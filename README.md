# Sérénité 2026 — Campagne d'inscription & CRM

Plateforme complète pour **Sérénité 2026 — Le Salon de la Sécurité Globale**
(Abidjan, 12–14 novembre 2026, Immeuble Caistab, Plateau) :

- Un **formulaire public** (`/`) qui collecte les inscriptions (exposants,
  partenaires officiels, visiteurs), les enregistre dans Supabase, déclenche
  l'event `Lead` du Meta Pixel, puis redirige vers une **page de
  remerciement dynamique** (`/merci`).
- Un **CRM back-office** (`/admin`, protégé par Supabase Auth) pour que
  l'équipe commerciale suive chaque prospect jusqu'à la conversion : pipeline
  de statuts, historique d'interactions, relances du jour, export CSV.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres + Auth + Row Level Security)
- Déploiement Vercel
- Meta Pixel (Facebook) pour le tracking des conversions

## Structure du projet

```
src/
  app/
    page.tsx                 Formulaire public d'inscription
    merci/page.tsx            Page de remerciement dynamique (?type=...)
    api/leads/route.ts        Route serveur : valide + insère un lead (service_role)
    admin/
      login/page.tsx          Connexion Supabase Auth
      (app)/                  Zone authentifiée (layout avec nav + garde d'accès)
        page.tsx               Dashboard (KPIs)
        prospects/page.tsx      Liste, recherche, filtres, tri, export CSV
        prospects/[id]/page.tsx Fiche prospect : statut, interactions, actions rapides
        relances/page.tsx       Relances du jour / en retard
  components/
    form/                    Formulaire public (cartes de type, champs, validation)
    admin/                   Composants de l'espace admin
    MetaPixel.tsx            Script Meta Pixel + helper de tracking `Lead`
  lib/
    config.ts                Config éditable : contacts, liens, libellés, pipeline
    validation.ts             Règles de validation du formulaire public
    rateLimit.ts              Rate limiting basique par IP (en mémoire)
    supabase/
      client.ts               Client navigateur (clé anon)
      server.ts                Client Server Components (session cookie)
      admin.ts                 Client service_role, réservé à /api/leads
  middleware.ts / proxy.ts   Protège /admin (redirige vers /admin/login)
  types/database.ts          Types Supabase (Lead, Interaction, Database)
```

## Lancer le projet en local

1. **Dépendances**

   ```bash
   npm install
   ```

2. **Variables d'environnement** — copiez `.env.local.example` vers
   `.env.local` et complétez avec les valeurs de votre projet Supabase
   (Project Settings → API) :

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

   `SUPABASE_SERVICE_ROLE_KEY` est un secret : ne jamais le committer, ne
   jamais l'exposer côté client. Il n'est utilisé que dans
   `src/app/api/leads/route.ts` (server-only).

3. **Lancer le serveur de dev**

   ```bash
   npm run dev
   ```

   - Formulaire public : http://localhost:3000
   - Admin : http://localhost:3000/admin (redirige vers `/admin/login` si non connecté)

4. **Créer un compte admin** — les comptes ne s'inscrivent pas eux-mêmes.
   Créez-les manuellement dans Supabase Dashboard → Authentication → Users
   → Add user (email + mot de passe, email confirmé).

## Base de données

Le schéma (tables `leads` et `interactions`, contraintes, index, RLS) est
défini par la migration Supabase appliquée au projet — voir la section
"Choix effectués" ci-dessous pour le détail des policies RLS.

## Tracking Meta Pixel

Deux couches, toutes deux pilotées par le même `event_id` pour que Meta
dédoublonne au lieu de compter le lead deux fois :

1. **Pixel navigateur** (toujours actif) — `PageView` sur chaque page,
   `Lead` déclenché juste avant la redirection vers `/merci`, avec
   Advanced Matching (email/téléphone transmis au pixel, qui les hashe
   lui-même côté client avant tout envoi).
2. **Conversions API côté serveur** (optionnelle) — `/api/leads` envoie le
   même événement `Lead` directement à l'API Graph de Meta, avec email et
   téléphone hashés en SHA-256. Ça garde le tracking fiable même quand un
   bloqueur de pub ou l'iOS App Tracking Transparency empêche le pixel
   navigateur de partir.

Pour activer la couche serveur, renseigner dans les variables
d'environnement (local et Vercel) :

- `META_CONVERSIONS_API_ACCESS_TOKEN` — Meta Events Manager → sélectionner
  le pixel `2452145495266477` → Paramètres → Conversions API → Générer un
  token d'accès.
- `META_TEST_EVENT_CODE` (optionnel, pour valider dans l'outil "Tester les
  événements" de Meta avant de passer en prod — à retirer une fois validé).

Sans ces variables, seul le pixel navigateur tourne (comportement actuel) —
rien ne casse, la fonctionnalité s'active simplement dès qu'elles sont
renseignées.

## Build & lint

```bash
npm run lint
npm run build
```

## Déploiement Vercel

Voir la checklist des variables d'environnement à la fin de la description
de la pull request, ou dans le message de livraison associé à ce projet.
