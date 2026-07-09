<div align="center">

# 🇸🇳 Senegram

### *Une messagerie temps-réel made in Sénégal*

Chat, appels audio/vidéo, groupes, partage de fichiers, **notifications push**, **stockage persistant B2** — le tout deployable sur **Render + Vercel + Backblaze B2**.

[![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io&logoColor=white)](https://socket.io)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Deploy](https://img.shields.io/badge/Deploy-Render%20%2B%20Vercel-46E3B7?logo=render&logoColor=white)](https://render.com)
[![License](https://img.shields.io/badge/license-MIT-green)](#-licence)

</div>

---

## 📖 Table des matières

- [À propos](#-à-propos)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Stack technique](#-stack-technique)
- [Démarrage rapide (local)](#-démarrage-rapide)
- [Configuration](#-configuration)
- [🌐 Déploiement Production (Render + Vercel + B2)](#-déploiement-production-render--vercel--b2)
- [Utilisation sur mobile (LAN + HTTPS)](#-utilisation-sur-mobile-lan--https)
- [API REST](#-api-rest)
- [Événements Socket.IO](#-événements-socketio)
- [Schéma de la base](#-schéma-de-la-base-de-données)
- [Scripts utilitaires](#-scripts-utilitaires-windows)
- [Roadmap](#-roadmap)
- [Contribuer](#-contribuer)
- [Auteur](#-auteur)

---

## ✨ À propos

**Senegram** est une application de messagerie instantanée inspirée de Telegram/WhatsatsApp, pensée et codée au Sénégal 🇸🇳. L'objectif : prouver qu'on peut bâtir une messagerie complète — chat texte, partage multimédia, appels audio/vidéo en WebRTC, **notifications push**, **stockage objet persistant** — **100 % en local** ou **deployable en production** sans dépendre d'un service cloud fermé.

C'est un projet **full-stack pédagogique et fonctionnel** : tout le code est lisible, commenté en français, et tourne sur n'importe quelle machine équipée de Node.js et MySQL.

> 🎯 **Cas d'usage** : intranet d'entreprise, projet de fin d'études, base pour un produit local, ou tout simplement apprendre comment marche une vraie messagerie.

---

## 🚀 Fonctionnalités

### 🔐 Authentification & Profils
- Inscription / connexion par **JWT** (jsonwebtoken + bcryptjs)
- Profil personnalisable : avatar uploadable, bio, téléphone
- Changement de mot de passe sécurisé

### 💬 Messagerie
- Chat **1-à-1** et **groupes** (création, ajout/suppression de membres, rôles owner/admin/member)
- Messages texte avec **édition** et **suppression**
- **Réponse** à un message (citation) + **swipe-to-reply** (mobile)
- **Épinglage** de messages par les admins (messages épinglés visibles en haut)
- **Recherche** dans les messages (texte, photos, médias)
- **Indicateurs de lecture** en temps réel
- **Indicateur "est en train d'écrire"** (typing)
- **Présence** en ligne / hors ligne / `last_seen`
- **Séparateurs de date** (Aujourd'hui, Hier, date complète) dans le chat
- **Pull-to-refresh** pour charger les messages plus anciens

### 📎 Partage de fichiers
- 📷 Images (JPG, PNG, WEBP, GIF…) avec compression automatique
- 🎬 Vidéos (MP4, WEBM…)
- 📄 Documents (PDF, DOCX, XLSX, PPTX, TXT…)
- 🎙️ Notes vocales (WebM Opus, max 5 min)
- Limite par défaut : **50 Mo** (configurable)
- **Stockage persistant Backblaze B2** (S3-compatible) — les fichiers survivent aux redéploiements

### 📞 Appels audio & vidéo (WebRTC)
- Appels **1-à-1** audio ou vidéo
- Signaling via **Socket.IO**, médias en pair-à-pair via **WebRTC**
- Serveurs **STUN** Google par défaut, **TURN** configurable pour passer les NAT restrictifs
- Contrôles : couper le micro, couper la caméra, raccrocher, changer de caméra
- Timer d'appel + interface plein écran
- Historique des appels persisté en base

### 🎙️ Messages vocaux
- Enregistrement avec **MediaRecorder** (WebM Opus)
- Interface de prévisualisation avant envoi (play/pause, suppression)
- Upload automatique vers le backend
- Durée max : 5 minutes par message
- Indicateur visuel du temps d'enregistrement

### 🔔 Notifications Push (Web Push / VAPID)
- Abonnement automatique à la connexion
- Service Worker pour notifications même app fermée
- Envoi aux utilisateurs **hors ligne** lors de nouveau message
- Test intégré dans le profil (bouton "Envoyer notification test")

### 🎨 Interface
- Design moderne, responsive (desktop + mobile)
- Palette aux couleurs du Sénégal 🇸🇳 (vert, jaune, rouge)
- **TailwindCSS** + composants React découpés
- Mode clair par défaut, interface accessible
- **PWA ready** : installable, service worker, manifest

---

## 🏗️ Architecture

```
┌───────────────────────────┐         ┌───────────────────────────┐
│       FRONTEND            │         │        BACKEND            │
│   React + Vite + Tailwind │◄───────►│  Express + Socket.IO      │
│                           │  HTTP   │                           │
│  • AuthContext            │  WS     │  • REST API (/api/*)      │
│  • SocketContext          │         │  • Sockets (chat + calls) │
│  • CallContext (WebRTC)   │         │  • Multer (uploads)       │
│  • PushContext (Web Push) │         │  • JWT middleware         │
│  • Pages: Login/Register  │         │  • Web Push (VAPID)       │
│           Home (chat)     │         │                           │
└───────────────────────────┘         └─────────────┬─────────────┘
                                                    │
                                            ┌───────▼────────┐
                                            │   MySQL 8      │
                                            │  base senegram │
                                            └────────────────┘
                                                    │
                                            ┌───────▼────────┐
                                            │  Backblaze B2  │
                                            │  (S3-compatible)│
                                            └────────────────┘
```

### Arborescence

```
senegram/
├── backend/
│   ├── config/              # db.js (pool MySQL), multer.js (uploads memory)
│   ├── controllers/         # auth, users, conversations, messages,
│   │                        # groups, uploads, calls, push
│   ├── middlewares/         # auth.js (JWT)
│   ├── routes/              # routes Express
│   ├── sockets/             # chatSocket + callSocket (signaling WebRTC)
│   ├── database/
│   │   └── schema.sql       # schéma MySQL complet + utilisateurs de démo
│   ├── services/            # s3.js (B2/S3 upload)
│   ├── uploads/             # fallback local (gitignoré)
│   ├── scripts/             # gen-cert.js (HTTPS auto-signé)
│   ├── server.js            # point d'entrée Express + Socket.IO
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   ├── sw.js            # Service Worker (push notifications)
│   │   ├── manifest.json    # PWA manifest
│   │   └── icons/           # icônes PWA
│   ├── src/
│   │   ├── components/      # ChatList, ChatWindow, MessageBubble,
│   │   │                    # CallOverlay, ProfileModal, PushTest…
│   │   ├── context/         # AuthContext, SocketContext, CallContext, PushContext
│   │   ├── pages/           # Login, Register, Home
│   │   ├── services/        # api.js (axios), socket.js (socket.io-client)
│   │   ├── utils/           # webrtc.js, conversation.js
│   │   └── main.jsx
│   ├── tailwind.config.js
│   └── package.json
│
├── render.yaml              # Blueprint Render (backend + MySQL)
├── scripts/                 # scripts .bat (Windows) : setup, run, firewall…
└── .github/                 # (optionnel) CI/CD
```

---

## 🧰 Stack technique

| Couche       | Technologies                                                    |
|--------------|-----------------------------------------------------------------|
| **Frontend** | React 18, Vite 5, TailwindCSS 3, React Router 6, Axios, Lucide  |
|              | socket.io-client 4, react-hot-toast, date-fns, Workbox (PWA)   |
| **Backend**  | Node.js 18+, Express 4, Socket.IO 4, MySQL2 (pool de connexions)|
|              | JWT, bcryptjs, Multer (memory storage), Helmet, CORS, Morgan    |
|              | express-rate-limit, selfsigned (HTTPS dev), web-push            |
| **DB**       | MySQL 8 (XAMPP / WAMP / standalone / Render Managed)            |
| **Temps-réel** | Socket.IO (chat, présence, typing, signaling WebRTC)          |
| **Médias**   | WebRTC natif navigateur, STUN Google (TURN optionnel)           |
| **Stockage** | **Backblaze B2** (S3-compatible) + fallback local               |
| **Push**     | Web Push Protocol (VAPID), Service Worker                       |
| **PWA**      | Service Worker, manifest.json, icônes                           |
| **Déploiement** | **Render** (backend + MySQL), **Vercel** (frontend), **Backblaze B2** |

---

## ⚡ Démarrage rapide (Local)

### Prérequis

- **Node.js 18+** & **npm**
- **MySQL 8+** (recommandé via [XAMPP](https://www.apachefriends.org/) ou [WAMP](https://www.wampserver.com/))
- Un navigateur moderne (Chrome, Edge, Firefox) pour WebRTC
- **Git** (optionnel)

### 1️⃣ Cloner le projet

```bash
git clone https://github.com/CheikhAhmedTidianeSy/Senegram.git
cd Senegram
```

### 2️⃣ Importer la base de données

**Avec phpMyAdmin (XAMPP) :**
1. Démarre **Apache + MySQL** dans XAMPP
2. Va sur `http://localhost/phpmyadmin`
3. Onglet **Importer** → choisis `backend/database/schema.sql` → **Exécuter**

**En ligne de commande :**
```bash
mysql -u root -p < backend/database/schema.sql
```

✅ La base `senegram` est créée avec **toutes les tables** + **3 utilisateurs de démo** :

| Username  | Mot de passe |
|-----------|--------------|
| `aminata` | `password`   |
| `moussa`  | `password`   |
| `fatou`   | `password`   |

### 3️⃣ Lancer le backend

```bash
cd backend
cp .env.example .env        # copie + édite si besoin (DB_PASSWORD, JWT_SECRET…)
npm install
npm run dev                 # mode dev (nodemon, hot-reload)
# ou : npm start            # mode production
```

➡️ API disponible sur **http://localhost:5000**

### 4️⃣ Lancer le frontend

Dans un **second terminal** :

```bash
cd frontend
npm install
npm run dev
```

➡️ App disponible sur **http://localhost:5173** 🎉

---

## ⚙️ Configuration

### `backend/.env`

```env
# Serveur
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173      # plusieurs URLs : sépare par virgules

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=senegram

# JWT
JWT_SECRET=remplace-moi-par-une-longue-chaine-aleatoire
JWT_EXPIRES_IN=7d

# Uploads
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE=52428800              # 50 Mo

# WebRTC TURN (optionnel — utile derrière un NAT strict)
TURN_URL=
TURN_USERNAME=
TURN_PASSWORD=

# VAPID Keys pour Web Push (génère avec: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=ta_cle_publique_vapid
VAPID_PRIVATE_KEY=o1t1Do_QPDH4yOvaJa_mlNZcLO8vjj6v11KEsbpnhp4
VAPID_SUBJECT=mailto:sarrfallou267@gmail.com

# WebRTC TURN (optionnel)
TURN_URL=
TURN_USERNAME=
TURN_PASSWORD=

# Stockage S3-compatible (Backblaze B2, R2, AWS S3, Supabase, etc.)
# S3_ENDPOINT=https://s3.eu-central-003.backblazeb2.com
# S3_REGION=eu-central-003
# S3_ACCESS_KEY_ID=89c73a446b02
# S3_SECRET_ACCESS_KEY=0038a56e43a744aae22316b9d9cb22b5f9cd8df7f9
# S3_BUCKET=senegram
# S3_PUBLIC_URL=https://f004.backblazeb2.com/file/Senegram
# S3_REGION=eu-central-003
```

### `frontend/.env` (optionnel)

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000

# VAPID Public Key (doit correspondre au backend)
VITE_VAPID_PUBLIC_KEY=ta_cle_publique_vapid
```

> En LAN, remplace `localhost` par l'IP de la machine qui héberge le backend (ex : `http://192.168.1.42:5000`).

---

## 🌐 Déploiement Production (Render + Vercel + Backblaze B2)

### Architecture cible

| Composant | Plateforme | Coût |
|-----------|------------|------|
| Backend API + WebSockets + MySQL | **Render** | Free tier (750h/mois) ou $7/mo (Starter) |
| Frontend React/Vite | **Vercel** | Free |
| Base de données MySQL | **Render Managed MySQL** | Free tier (1GB) ou inclus Starter |
| Stockage fichiers (images, vidéos, docs, audio) | **Backblaze B2** | ~$0.005/GB/mois (10 GB gratuits) |
| DNS / HTTPS | Vercel + Render (auto) | Gratuit |

---

### 1️⃣ Préparer Backblaze B2

1. Crée un compte sur [backblaze.com/b2](https://www.backblaze.com/b2/cloud-storage.html)
2. **Create Bucket** : `senegram` (ou ton nom)
3. **Type** : Public (pour URLs directes) ou Private (avec URLs signées)
4. **Application Keys** → **Add New Application Key**
   - Name: `senegram-render`
   - Bucket: ton bucket
   - Capabilities: `listBuckets`, `listFiles`, `readFiles`, `writeFiles`, `deleteFiles`
5. Note : `keyID` (Access Key), `applicationKey` (Secret Key)
6. **CORS Rules** (Bucket Settings → CORS Rules) :

```json
[
  {
    "allowedOrigins": ["https://your-app.vercel.app", "http://localhost:5173"],
    "allowedOperations": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
]
```

6. **Public URL** (si bucket public) : `https://f004.backblazeb2.com/file/your-bucket-name`

---

### 2️⃣ Déployer sur Render (Backend + MySQL)

**Option A : Blueprint (recommandé)**

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
2. Connect GitHub → Select repo `CheikhAhmedTidianeSy/Senegram`
3. Branch: `main` → **Apply**
4. Render crée automatiquement :
   - Web Service `senegram-backend` (Node, `rootDir: backend`)
   - Managed MySQL `senegram-db`
   - Variables d'env depuis `render.yaml`

**Option B : Manuel**

1. **New +** → **Web Service** → Connect GitHub repo
2. Settings :
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
3. **Add Database** → **MySQL** → Name: `senegram-db`
4. **Environment Variables** (copie depuis ci-dessous) :

```env
NODE_ENV=production
PORT=10000
CLIENT_URL=https://your-app.vercel.app
JWT_SECRET=generate-a-secure-random-string
MYSQL_URL=mysql://user:pass@host:port/dbname
# (ou les variables DB_* injectées par Render depuis la DB managée)

# VAPID
VAPID_PUBLIC_KEY=ta_cle_publique_vapid
VAPID_PRIVATE_KEY=o1t1Do_QPDH4yOvaJa_mlNZcLO8vjj6v11KEsbpnhp4
VAPID_SUBJECT=mailto:sarrfallou267@gmail.com

# Backblaze B2
S3_ENDPOINT=https://s3.eu-central-003.backblazeb2.com
S3_REGION=eu-central-003
S3_ACCESS_KEY_ID=89c73a446b02
S3_SECRET_ACCESS_KEY=0038a56e43a744aae22316b9d9cb22b5f9cd8df7f9
S3_BUCKET=senegram
S3_PUBLIC_URL=https://f004.backblazeb2.com/file/Senegram
```

5. **Deploy** → attends le build + `npm run db:init` (preDeployCommand)

---

### 3️⃣ Déployer sur Vercel (Frontend)

1. [Vercel Dashboard](https://vercel.com/new) → **Import Git Repository**
2. Select repo `CheikhAhmedTidianeSy/Senegram`
3. Settings :
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables** :

```env
VITE_API_URL=https://senegram-backend.onrender.com
VITE_SOCKET_URL=https://senegram-backend.onrender.com
VITE_VAPID_PUBLIC_KEY=ta_cle_publique_vapid
```

5. **Deploy** → Vercel te donne `https://your-app.vercel.app`

---

### 4️⃣ Relier les deux

1. Copie l'URL Vercel (ex: `https://senegram.vercel.app`)
2. **Render Dashboard** → `senegram-backend` → **Environment** → Update `CLIENT_URL` = ton URL Vercel
3. **Save Changes** → Render redéploie auto
4. **Vercel** → **Deployments** → **Redeploy** (pour prendre la nouvelle URL backend)

---

### 5️⃣ Initialiser la DB

**Render Shell** → `senegram-backend` :

```bash
npm run db:init
```

Vérifie :
```
✅ MySQL connecté (senegram)
✅ Schéma de base de données initialisé avec succès
📊 Tables créées:
  - users
  - contacts
  - conversations
  - conversation_members
  - messages
  - attachments
  - message_reads
  - message_reactions
  - calls
  - call_participants
  - push_subscriptions
```

---

### 6️⃣ Test complet

1. Ouvre `https://your-app.vercel.app`
2. Connecte-toi (`aminata` / `password`)
3. **Profil** → scroll bas → **"Test Notifications Push"**
   - "Autoriser notifications" → Allow
   - "Envoyer notification test" → doit apparaître
4. Envoie une image → vérifie qu'elle charge depuis `https://f004.backblazeb2.com/file/Senegram/...`
5. Teste un appel audio/vidéo entre deux navigateurs/appareils

---

## 📱 Utilisation sur mobile (LAN) — HTTPS

Pour **passer des appels depuis un téléphone sur le même Wi-Fi**, le navigateur exige un **contexte sécurisé (HTTPS)** pour accéder à la caméra/micro.

```bash
cd backend
npm run gen-cert            # génère certs/cert.pem + certs/key.pem auto-signés
npm run dev                 # le serveur passe automatiquement en HTTPS
```

Sur le mobile :
1. Ouvre `https://<IP-du-PC>:5000` une fois → accepte l'avertissement de sécurité.
2. Ouvre `https://<IP-du-PC>:5173` → idem.
3. Connecte-toi normalement, les appels fonctionnent. ✨

> 💡 Sur Windows, pense à **autoriser le pare-feu** (scripts `scripts/open-firewall.bat`).

---

## 🌐 API REST

Toutes les routes (sauf `/api/auth/register` et `/api/auth/login`) requièrent un header `Authorization: Bearer <jwt>`.

### Auth

| Méthode | URL                     | Rôle                  |
|---------|-------------------------|-----------------------|
| POST    | `/api/auth/register`    | Inscription           |
| POST    | `/api/auth/login`       | Connexion             |
| GET     | `/api/auth/me`          | Utilisateur courant   |

### Utilisateurs

| Méthode | URL                            | Rôle                       |
|---------|--------------------------------|----------------------------|
| GET     | `/api/users/search?q=`         | Recherche d'utilisateurs   |
| PATCH   | `/api/users/me`                | Mise à jour du profil      |
| POST    | `/api/users/me/password`       | Changement de mot de passe |
| GET     | `/api/users/contacts`          | Liste des contacts         |
| POST    | `/api/users/contacts/:id`      | Ajouter un contact         |

### Conversations & Messages

| Méthode | URL                                       | Rôle                          |
|---------|-------------------------------------------|-------------------------------|
| GET     | `/api/conversations`                      | Liste des discussions         |
| POST    | `/api/conversations/private`              | Ouvrir/Créer un 1-à-1         |
| GET     | `/api/conversations/:id`                  | Détail d'une conversation     |
| POST    | `/api/conversations/:id/read`             | Marquer comme lu              |
| GET     | `/api/messages/conversation/:id`          | Liste des messages            |
| POST    | `/api/messages/conversation/:id`          | Envoyer un message            |
| PATCH   | `/api/messages/:id`                       | Éditer un message             |
| DELETE  | `/api/messages/:id`                       | Supprimer un message           |
| PATCH   | `/api/messages/:id/pin`                   | Épingler / désépingler (admin) |
| POST    | `/api/messages/:id/reactions`             | Ajouter réaction              |
| DELETE  | `/api/messages/:id/reactions`             | Retirer réaction              |

### Groupes

| Méthode | URL                                       | Rôle                          |
|---------|-------------------------------------------|-------------------------------|
| POST    | `/api/groups`                             | Créer un groupe               |
| PATCH   | `/api/groups/:id`                         | Modifier (admin)              |
| POST    | `/api/groups/:id/members`                 | Ajouter membre(s)             |
| DELETE  | `/api/groups/:id/members/:userId`         | Retirer un membre             |
| POST    | `/api/groups/:id/leave`                   | Quitter le groupe             |

### Uploads & Appels

| Méthode | URL                              | Rôle                          |
|---------|----------------------------------|-------------------------------|
| POST    | `/api/upload/file`               | Upload d'un fichier (multipart) |
| POST    | `/api/upload/avatar`             | Upload d'un avatar              |
| POST    | `/api/upload/voice`              | Upload d'une note vocale        |
| GET     | `/api/calls/conversation/:id`    | Historique des appels           |

### Push (Notifications)

| Méthode | URL                              | Rôle                               |
|---------|----------------------------------|-------------------------------------|
| POST    | `/api/push/subscribe`            | Abonner le navigateur aux notifications |
| POST    | `/api/push/unsubscribe`          | Se désabonner                        |
| POST    | `/api/push/test`                 | Envoyer notification test (admin)    |

---

## 📡 Événements Socket.IO

Connexion : `io(<API_URL>, { auth: { token: <jwt> } })`

### Client → Serveur

| Événement            | Payload                                              |
|----------------------|------------------------------------------------------|
| `conversation:join`  | `{ conversation_id }`                                |
| `typing`             | `{ conversation_id, is_typing }`                     |
| `message:read`       | `{ conversation_id, message_id }`                    |
| `call:invite`        | `{ conversation_id, to_user_id, type, sdp_offer }`   |
| `call:accept`        | `{ call_id, to_user_id, sdp_answer }`                |
| `call:reject`        | `{ call_id, to_user_id }`                            |
| `call:ice`           | `{ to_user_id, candidate }`                          |
| `call:end`           | `{ call_id, to_user_id, duration }`                  |

### Serveur → Client

| Événement                                 | Utilité                                |
|-------------------------------------------|----------------------------------------|
| `message:new` / `edited` / `deleted`      | Diffusion des messages                 |
| `typing`                                  | Indicateur "est en train d'écrire"     |
| `presence:update`                         | Online / offline                       |
| `call:incoming` / `accepted` / `rejected` | Signaling WebRTC                       |
| `call:ice` / `ended` / `created`          | Échange ICE + cycle de vie de l'appel  |
| `message_delivered` / `message_read`      | Indicateurs de lecture                 |
| `reaction_added` / `reaction_removed`     | Réactions emoji                        |
| `message_pinned` / `message_unpinned`     | Messages épinglés                      |

---

## 🗄️ Schéma de la base de données

12 tables :

| Table                  | Rôle                                                    |
|------------------------|---------------------------------------------------------|
| `users`                | Comptes (status, last_seen, avatar, is_online)          |
| `contacts`             | Carnet d'adresses (avec blocage)                        |
| `conversations`        | 1-à-1 et groupes                                        |
| `conversation_members` | Membres + rôle (`owner` / `admin` / `member`)           |
| `messages`             | Messages texte / fichiers / vocaux / réponses / épinglés |
| `attachments`          | Métadonnées des pièces jointes (dont durée audio)       |
| `message_reads`        | Indicateurs de lecture par utilisateur                  |
| `message_reactions`    | Réactions emoji aux messages                            |
| `calls`                | Historique des appels (audio/vidéo, durée, statut)      |
| `call_participants`    | Participants à chaque appel                              |
| `push_subscriptions`   | Abonnements push (Web Push)                              |

Voir `backend/database/schema.sql` pour le détail (clés étrangères, index, contraintes).

---

## 🧪 Scripts utilitaires (Windows)

Dans `scripts/` :

| Script                   | Action                                              |
|--------------------------|-----------------------------------------------------|
| `01-diagnose.bat`        | Vérifie Node, MySQL, ports                          |
| `02-setup.bat`           | Installe les dépendances back + front               |
| `03-run.bat`             | Lance backend et frontend dans deux terminaux       |
| `04-enable-https.bat`    | Génère les certificats auto-signés (HTTPS LAN)      |
| `import-db.bat`          | Importe `schema.sql` via la CLI MySQL               |
| `open-firewall.bat`      | Ouvre les ports 5000 & 5173 dans le pare-feu Windows|
| `close-firewall.bat`     | Referme les règles                                  |
| `kill-mysql-ghost.bat`   | Tue un process MySQL fantôme qui squatte le port    |

---

## 🧭 Roadmap

- [ ] Appels en groupe (SFU type **mediasoup** ou **LiveKit**)
- [ ] Chiffrement E2E (protocole Signal / libsignal)
- [ ] Application mobile (React Native ou Capacitor)
- [ ] Modération & système de signalement
- [ ] Déploiement VPS clé-en-main : **nginx** reverse-proxy + **PM2** + **certbot** + **coturn**
- [ ] Mode sombre 🌙
- [ ] Messages éphémères / autodestruction
- [ ] Traduction temps-réel des messages

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Pour proposer une amélioration :

1. Fork le repo
2. Crée une branche : `git checkout -b feat/ma-feature`
3. Commit : `git commit -m "feat: ajout de ma feature"`
4. Push : `git push origin feat/ma-feature`
5. Ouvre une **Pull Request**

Merci de respecter le style de code existant (français pour les commentaires, conventionnel pour les commits).

---

## 📜 Licence

Ce projet est distribué sous licence **MIT**. Tu peux l'utiliser, le modifier et le redistribuer librement.

---

## 👥 Équipe

| Nom | Rôle | Email |
|-----|------|-------|
| **Cheikh Tidiane Sy** | Développeur Backend & UI/UX | cheikhahmedtidiane.sy2@unchk.edu.sn |
| **Mouhamadou Falilou Sarr** | Développeur Frontend | mouhamadoufalilou.sarr@unchk.edu.sn |
| **Saly Faye** | Cheffe de projet | saly.faye5@unchk.edu.sn |
| **Babacar Sow** | Tests & Assurance qualité | babacar.sow6@unchk.edu.sn |
| **Meissa Touré** | Base de données & DevOps | meissa.toure@unchk.edu.sn |
| **Fatou Diop** | Documentation & Support UI/UX | fatou.diop109@unchk.edu.sn |

🇸🇳 *Made with **teranga** in Sénégal — UNCHK.*

---

Si Senegram t'a été utile, n'hésite pas à laisser une ⭐ sur le repo !