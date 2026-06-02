# CréditPro — Plateforme de demande de crédit

Plateforme full-stack permettant à des particuliers de soumettre des demandes de crédit en ligne, de fournir leurs documents KYC, et de suivre l'avancement de leur dossier. Les agents et superviseurs de la banque disposent d'un espace d'administration complet.

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Base de données | Supabase (PostgreSQL + RLS) |
| Auth client | Supabase Auth |
| Auth banque | JWT personnalisé (jose) + cookie HttpOnly |
| Stockage fichiers | Supabase Storage |
| Styles | Tailwind CSS v4 |
| Validation | Zod |
| Génération PDF | @react-pdf/renderer |
| Génération Word | docx |
| Language | TypeScript 5 |

## Acteurs et accès

| Rôle | URL d'accès | Capacités |
|---|---|---|
| **Client** | `/login`, `/register` | Créer un compte, soumettre une demande, uploader les KYC, suivre le statut |
| **Agent** | `/bank/login` | Consulter les dossiers, valider KYC, passer en analyse, ajouter des commentaires |
| **Superviseur** | `/bank/login` | Toutes les actions agent + approuver/rejeter |
| **Administrateur** | `/bank/login` | Toutes les actions + gérer les utilisateurs internes |

## Installation

### 1. Cloner et installer les dépendances

```bash
git clone <repo>
cd credit-management
npm install
```

### 2. Configurer les variables d'environnement

Copiez `.env.local` et renseignez les valeurs depuis votre projet Supabase :

```bash
# Settings → API dans le dashboard Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Clé secrète JWT pour les sessions banque (32+ caractères)
BANK_SESSION_SECRET=votre-cle-secrete-aleatoire
```

Générez la clé secrète JWT :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Initialiser la base de données

Dans le **SQL Editor** de Supabase, exécutez le contenu de [`lib/db/schema.sql`](lib/db/schema.sql).

Puis créez le bucket de stockage :
```sql
insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false);

create policy "Authenticated clients can upload"
  on storage.objects for insert
  with check (bucket_id = 'kyc-documents' and auth.role() = 'authenticated');

create policy "Clients can view own files"
  on storage.objects for select
  using (bucket_id = 'kyc-documents' and auth.uid()::text = (storage.foldername(name))[1]);
```

### 4. Créer le premier administrateur

```bash
node --env-file=.env.local scripts/create-admin.mjs
```

Modifiez l'email et le mot de passe dans [`scripts/create-admin.mjs`](scripts/create-admin.mjs) avant d'exécuter.

### 5. Lancer le serveur de développement

```bash
npm run dev
```

Accédez à [http://localhost:3000](http://localhost:3000).

## Structure du projet

```
app/
├── (auth)/                    # Pages publiques : login, register
│   ├── login/                 # Connexion client
│   ├── register/              # Inscription client
│   └── bank/login/            # Connexion banque
├── client/(protected)/        # Espace client (authentification requise)
│   ├── dashboard/             # Tableau de bord + timeline de statut
│   └── application/new/       # Formulaire multi-étapes (6 étapes)
│       └── steps/             # Step1 à Step6 (identité → confirmation)
├── bank/(protected)/          # Espace banque (session JWT requise)
│   ├── dashboard/             # Statistiques globales
│   ├── applications/          # Liste avec filtres + recherche
│   │   └── [id]/              # Dossier complet + actions + commentaires
│   └── users/                 # Gestion des utilisateurs internes (admin)
├── api/
│   ├── upload/                # Upload KYC → Supabase Storage
│   └── download/[id]/
│       ├── pdf/               # Génération PDF du dossier
│       └── docx/              # Génération Word du dossier
components/
├── ui/                        # Button, Input, Card, Badge, FileUpload...
├── layout/                    # ClientSidebar, BankSidebar
└── bank/                      # DownloadButtons
lib/
├── supabase/                  # Clients server/client Supabase
├── auth/                      # DAL, bank-session (JWT)
├── documents/                 # Générateurs PDF et DOCX
└── types.ts                   # Types TypeScript + labels FR
middleware.ts                  # Protection des routes par rôle
```

## Parcours client (6 étapes)

1. **Identité** — Nom, date de naissance, nationalité, adresse
2. **Profession** — Employeur, type de contrat, ancienneté
3. **Finances** — Revenus, charges, crédits en cours
4. **Crédit** — Type, montant, durée, objet du prêt
5. **KYC** — Upload de 5 documents (pièce d'identité R/V, selfie, revenus, domicile)
6. **Confirmation** — Récapitulatif avant soumission

## Statuts d'une demande

```
Brouillon → Soumise → Vérification KYC → En analyse → Approuvée / Rejetée → Décaissée
                                       ↘ Documents complémentaires requis ↗
```

## Fonctionnalités banque

- **Dashboard** avec compteurs par statut
- **Liste des demandes** filtrables par statut, recherche par nom/téléphone/numéro
- **Dossier complet** : informations client, KYC, historique, commentaires internes
- **Actions selon le rôle** : valider KYC, demander des compléments, approuver, rejeter
- **Téléchargement** du dossier en PDF et en Word (.docx)
- **Notifications** automatiques au client à chaque changement de statut

## Scripts utiles

```bash
npm run dev      # Serveur de développement
npm run build    # Build de production
npm run lint     # Vérification ESLint
node --env-file=.env.local scripts/create-admin.mjs  # Créer un admin banque
```
