# 🇸🇳 Senegram

**Senegram** est une messagerie temps-réel inspirée de Telegram, 100% sénégalaise :
chat, appels audio / vidéo (WebRTC), groupes, partage de photos / vidéos /
documents, présence en ligne, indicateurs de lecture…

Stack : **Node.js + Express + Socket.IO + MySQL** côté serveur,
**React + Vite + TailwindCSS + socket.io-client + WebRTC** côté client.
Tout tourne en local, **sans conteneurisation**.

---

## 🗂️ Arborescence

senegram/
├── backend/
│   ├── config/               (db.js, multer.js)
│   ├── controllers/          (auth, users, conversations, messages, groups, uploads, calls)
│   ├── middlewares/          (auth JWT)
│   ├── routes/               (routes Express)
│   ├── sockets/              (chat + signaling WebRTC)
│   ├── uploads/              (images / videos / audio / documents / avatars)
│   ├── database/schema.sql   (schéma MySQL)
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/       (ChatList, ChatWindow, MessageBubble, CallOverlay, …)
    │   ├── context/          (Auth, Socket, Call)
    │   ├── pages/            (Login, Register, Home)
    │   ├── services/         (api.js, socket.js)
    │   └── utils/            (webrtc.js, conversation.js)
    ├── tailwind.config.js
    └── package.json

---

## 🔧 Prérequis

- **Node.js 18+** et **npm**
- **XAMPP / WAMP** (ou MySQL 8+) pour la base de données
- Un navigateur moderne (Chrome / Edge / Firefox) pour WebRTC
- **Git** (optionnel)

> ⚠️ Pour tester l'appel vidéo/audio en local sur Chrome, autorise la caméra/micro
> pour `http://localhost:5173`. WebRTC fonctionne sur `localhost` sans HTTPS.

---

## 🗄️ 1. Base de données

1. Lance **XAMPP** et démarre **Apache + MySQL**.
2. Ouvre **phpMyAdmin** → `http://localhost/phpmyadmin`.
3. Dans l'onglet **Importer**, sélectionne le fichier
   `backend/database/schema.sql` puis clique **Exécuter**.
   Cela crée la base `senegram` avec toutes les tables + 3 utilisateurs de démo.

> Alternative en ligne de commande (depuis `backend/`) :
>
> ```bash
> mysql -u root -p < database/schema.sql
> ```

Les utilisateurs de démo : `aminata`, `moussa`, `fatou` — mot de passe `password`
(ou crée ton propre compte via l'écran d'inscription).

---

## 🚀 2. Backend (API + sockets)

```bash
cd backend
cp .env.example .env          # puis édite .env si besoin (DB_PASSWORD, JWT_SECRET, …)
npm install
npm run dev                   # mode watch (nodemon)
# ou :
npm start                     # production
```

Le serveur écoute sur `http://localhost:5000`.

### Endpoints REST principaux

| Méthode | URL                                    | Rôle                           |
|---------|----------------------------------------|--------------------------------|
| POST    | `/api/auth/register`                   | Inscription                    |
| POST    | `/api/auth/login`                      | Connexion                      |
| GET     | `/api/auth/me`                         | Utilisateur courant            |
| GET     | `/api/users/search?q=`                 | Recherche d'utilisateurs       |
| PATCH   | `/api/users/me`                        | Mise à jour profil             |
| POST    | `/api/users/me/password`               | Changement de mot de passe     |
| GET     | `/api/users/contacts`                  | Liste des contacts             |
| POST    | `/api/users/contacts/:id`              | Ajouter un contact             |
| GET     | `/api/conversations`                   | Liste des discussions          |
| POST    | `/api/conversations/private`           | Ouvrir/Créer un 1-1            |
| GET     | `/api/conversations/:id`               | Détail conv                    |
| POST    | `/api/conversations/:id/read`          | Marquer comme lu               |
| GET     | `/api/messages/conversation/:id`       | Liste des messages             |
| POST    | `/api/messages/conversation/:id`       | Envoyer un message             |
| PATCH   | `/api/messages/:id`                    | Éditer                         |
| DELETE  | `/api/messages/:id`                    | Supprimer                      |
| POST    | `/api/groups`                          | Créer un groupe                |
| PATCH   | `/api/groups/:id`                      | Modifier (admin)               |
| POST    | `/api/groups/:id/members`              | Ajouter membre(s)              |
| DELETE  | `/api/groups/:id/members/:userId`      | Retirer membre                 |
| POST    | `/api/groups/:id/leave`                | Quitter                        |
| POST    | `/api/upload/file`                     | Upload fichier (multipart)     |
| POST    | `/api/upload/avatar`                   | Upload avatar                  |
| GET     | `/api/calls/conversation/:id`          | Historique d'appels            |

### Events socket (temps-réel)

| Event client → serveur       | Payload                                             |
|------------------------------|-----------------------------------------------------|
| `conversation:join`          | `{ conversation_id }`                               |
| `typing`                     | `{ conversation_id, is_typing }`                    |
| `message:read`               | `{ conversation_id, message_id }`                   |
| `call:invite`                | `{ conversation_id, to_user_id, type, sdp_offer }`  |
| `call:accept`                | `{ call_id, to_user_id, sdp_answer }`               |
| `call:reject`                | `{ call_id, to_user_id }`                           |
| `call:ice`                   | `{ to_user_id, candidate }`                         |
| `call:end`                   | `{ call_id, to_user_id, duration }`                 |

| Event serveur → client       | Utilité                                             |
|------------------------------|-----------------------------------------------------|
| `message:new/edited/deleted` | Diffusion des messages                              |
| `typing`                     | Indicateur "est en train d'écrire"                  |
| `presence:update`            | Online / offline                                    |
| `call:incoming / accepted / rejected / ice / ended / created` | Signaling WebRTC   |

---

## 💻 3. Frontend (React + Vite)

```bash
cd frontend
cp .env.example .env     # VITE_API_URL=http://localhost:5000
npm install
npm run dev
```

L'app ouvre `http://localhost:5173`.

---

## ✅ Features livrées

- 🔐 **Auth JWT** : inscription, connexion, déconnexion, "me"
- 💬 **Chat 1-1** et **groupes** (création, ajout membres, quitter)
- 📝 **Messages** : texte, édition, suppression, réponse, indicateurs de lecture
- 📎 **Partage** : photos, vidéos, audio, documents (PDF, DOCX, XLSX…)
- 🧑 **Profils** : avatar uploadable, bio, téléphone
- 🟢 **Présence** en temps réel (online / offline / last_seen)
- ✍️ **Typing** indicator
- 📞 **Appels 1-1 audio & vidéo** en **WebRTC** (STUN Google)
  avec mute, camera off, timer, interface plein écran
- 🎨 **UI/UX moderne** Tailwind avec palette Sénégal (vert / jaune / rouge)
- 📱 **Responsive** (desktop + mobile)

---

## 🧭 Pour aller plus loin

- [ ] Appels en groupe (SFU comme mediasoup/LiveKit ou maillage)
- [ ] Messages vocaux (enregistrement MediaRecorder, déjà câblé côté upload)
- [ ] Notifications push navigateur
- [ ] Chiffrement E2E (Signal protocol)
- [ ] Version mobile avec React Native / Capacitor
- [ ] Modération / signalements
- [ ] Déploiement VPS : nginx en reverse-proxy, pm2, certbot, TURN (coturn)

---

🇸🇳 *Made with teranga by realtidiane.*
