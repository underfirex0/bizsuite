# BizSuite — SaaS de Gestion d'Entreprise

CRM · Facturation · Devis · Rapports & KPIs

---

## 🚀 Déploiement en 5 étapes

### Étape 1 — Créer le projet Supabase

1. Aller sur [supabase.com](https://supabase.com) → **New project**
2. Choisir un nom, un mot de passe fort, région **EU West**
3. Attendre ~2 min que le projet démarre
4. Aller dans **SQL Editor** → coller et exécuter le contenu de `supabase/migrations/001_initial_schema.sql`
5. Aller dans **Authentication → URL Configuration** → ajouter :
   - Site URL: `https://votre-app.vercel.app`
   - Redirect URLs: `https://votre-app.vercel.app/auth/callback`

### Étape 2 — Récupérer les clés Supabase

Dans **Project Settings → API** :
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key
- `SUPABASE_SERVICE_ROLE_KEY` = service_role key (⚠️ ne pas exposer côté client)

### Étape 3 — Pousser sur GitHub

```bash
cd saas-app
git init
git add .
git commit -m "feat: initial BizSuite setup"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/bizsuite.git
git push -u origin main
```

### Étape 4 — Déployer sur Vercel

1. Aller sur [vercel.com](https://vercel.com) → **New Project**
2. Importer votre repo GitHub `bizsuite`
3. Dans **Environment Variables**, ajouter :

```
NEXT_PUBLIC_SUPABASE_URL        = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY       = eyJhbGci...
NEXT_PUBLIC_APP_URL             = https://votre-app.vercel.app
NEXT_PUBLIC_APP_NAME            = BizSuite
```

4. Cliquer **Deploy** → attendre ~1 min

### Étape 5 — Configurer l'auth Supabase

Retourner dans Supabase **Authentication → URL Configuration** et mettre l'URL Vercel exacte.

---

## 🛠 Développement local

```bash
# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.local.example .env.local
# Remplir .env.local avec vos vraies clés Supabase

# Lancer le serveur de dev
npm run dev
# → http://localhost:3000
```

---

## 📁 Structure du projet

```
src/
├── app/
│   ├── auth/
│   │   ├── login/          # Page de connexion
│   │   ├── register/       # Page d'inscription + création d'org
│   │   └── callback/       # Callback OAuth Supabase
│   └── dashboard/
│       ├── page.tsx         # Tableau de bord principal
│       ├── layout.tsx       # Layout avec sidebar
│       ├── crm/             # Module CRM (clients)
│       ├── facturation/     # Module facturation (invoices)
│       ├── devis/           # Module devis (quotes)
│       ├── rapports/        # Module rapports & KPIs
│       └── settings/        # Paramètres organisation
├── components/
│   └── layout/
│       └── Sidebar.tsx      # Navigation principale
├── lib/
│   └── supabase/
│       ├── client.ts        # Client navigateur
│       ├── server.ts        # Client serveur (SSR)
│       └── middleware.ts    # Auth middleware
├── types/
│   └── database.ts          # Types TypeScript générés
└── middleware.ts             # Auth routing middleware

supabase/
└── migrations/
    └── 001_initial_schema.sql  # Schéma complet + RLS
```

---

## 🔐 Sécurité multi-tenant

- Chaque entreprise a son propre `organization_id`
- Row Level Security (RLS) Supabase garantit l'isolation totale des données
- Un utilisateur ne peut jamais voir les données d'une autre organisation
- Les rôles : `owner`, `admin`, `member`, `viewer`

---

## 📋 Modules inclus

| Module | Fonctionnalités |
|--------|----------------|
| **CRM** | Clients (entreprise/particulier), contacts, deals/pipeline |
| **Devis** | Création, lignes détaillées, TVA, expiration, conversion en facture |
| **Facturation** | Factures numérotées auto, suivi paiements, statuts |
| **Rapports** | Revenus mensuels, taux conversion, pipeline CRM, statuts factures |
| **Paramètres** | Logo, infos org, préfixes numérotation, devise |

---

## 🗺 Roadmap

- [ ] Génération PDF des factures/devis
- [ ] Envoi par email (Resend)
- [ ] Portail client (lien partageable)
- [ ] Multi-utilisateurs avec invitations
- [ ] Modules sectoriels (immobilier, agence, consulting...)
- [ ] Stripe / paiement en ligne
