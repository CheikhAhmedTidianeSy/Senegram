# Scripts Senegram (Windows)

Double-clique sur ces `.bat` dans l'ordre.

| Ordre | Script                    | Quand le lancer                                                            |
|-------|---------------------------|----------------------------------------------------------------------------|
| 1     | `01-diagnose.bat`         | Vérifie que Node et MySQL sont OK, détecte les blocages port 3306           |
| 2     | `02-setup.bat`            | **Une seule fois** — copie `.env`, `npm install`, importe la base           |
| 3     | `03-run.bat`              | **À chaque démarrage** — lance backend + frontend + ouvre le navigateur     |
| 4     | `04-enable-https.bat`     | **Une seule fois** — active HTTPS (obligatoire pour WebRTC mobile)          |
| -     | `kill-mysql-ghost.bat`    | Si XAMPP refuse de démarrer MySQL ("shutdown unexpectedly")                 |
| -     | `import-db.bat`           | Ré-initialiser la base à zéro (attention : perte des données)               |
| -     | `open-firewall.bat`       | **Admin.** Ouvre les ports 5000+5173 pour l'accès depuis une autre machine  |
| -     | `close-firewall.bat`      | **Admin.** Retire les règles pare-feu                                       |

## Accéder à Senegram depuis un autre PC du réseau local

1. Sur le **PC serveur** : clic droit → "Exécuter en tant qu'administrateur" sur `open-firewall.bat`.
   Le script affiche l'IPv4 de ton PC à la fin (ex : `192.168.1.42`).
2. Sur le **PC client** (même wifi/LAN), ouvre `http://192.168.1.42:5173` dans le navigateur.
3. Le frontend détecte automatiquement qu'il n'est pas sur `localhost` et envoie ses
   appels API à `http://192.168.1.42:5000`. Aucun rebuild nécessaire.

## Passer les appels vidéo/voix depuis un téléphone (Android, iOS)

Les navigateurs **bloquent** l'accès à la caméra/micro tant que la page
n'est pas servie en **HTTPS** (sauf sur `localhost`). C'est pourquoi sur ton
téléphone, "impossible d'activer camera/micro" s'affiche en HTTP.

### 1. Activer HTTPS (une seule fois sur le PC serveur)

Double-clic sur **`04-enable-https.bat`**. Il va :

- installer `selfsigned` (backend) et `@vitejs/plugin-basic-ssl` (frontend) ;
- générer `backend/certs/cert.pem` + `key.pem` auto-signés valables pour
  `localhost` et **toutes tes IPv4 locales** (auto-détectées).

### 2. Relancer le projet

Ferme les fenêtres en cours (Ctrl+C) et relance **`03-run.bat`**.
Le script détecte maintenant le certificat et bascule en HTTPS automatiquement
(il passe `HTTPS=1` à Vite et le backend charge les certs).

### 3. Accepter le certificat

Le certificat étant auto-signé, le navigateur affiche **"Connexion non privée"**
la première fois. Il faut accepter pour **backend ET frontend** (2 origines).

**Sur le PC :**

- `https://localhost:5000/`   → "Paramètres avancés" → "Continuer quand même"
- `https://localhost:5173/`   → idem

**Sur ton téléphone Android** (connecté au même wifi, avec l'IP du PC) :

- `https://192.168.1.42:5000/`   → accepter l'alerte
- `https://192.168.1.42:5173/`   → accepter l'alerte

> Il faut visiter les **deux** URL manuellement, sinon le téléphone refusera
> les appels XHR/WebSocket vers le backend.

### 4. Passer un appel

Reviens sur `https://192.168.1.42:5173/`, connecte-toi, démarre un appel :
Android te demandera l'autorisation **micro + caméra**. Accepte → ça marche.

> ⚠️ Les appels WebRTC fonctionnent sur LAN sans TURN (les deux machines se voient
> directement). Depuis Internet, il faudra un serveur TURN.

## Prérequis côté Windows (une seule fois)

1. **Node.js 18+** installé — vérifie avec `node -v` dans un terminal.
2. **XAMPP** installé dans `C:\xampp` (chemin par défaut).
   Si tu l'as ailleurs, édite les scripts : remplace toutes les occurrences
   de `C:\xampp\mysql\bin\mysql.exe` par le bon chemin.

## Procédure de premier lancement

1. Ouvre le **XAMPP Control Panel** (en *Administrateur*).
2. Clique **Start** sur la ligne `MySQL` → le voyant doit devenir **vert**.
3. Double-clique sur `01-diagnose.bat` → tout doit afficher `OK`.
4. Double-clique sur `02-setup.bat` → attends la fin.
5. Double-clique sur `03-run.bat` → ton navigateur s'ouvre tout seul.
6. *(Optionnel, pour appels mobile)* Double-clique sur `04-enable-https.bat`,
   puis relance `03-run.bat`.

## Procédure quotidienne ensuite

1. Start MySQL dans XAMPP.
2. Double-clic sur `03-run.bat`.

## Si MySQL refuse de démarrer

- Lance `kill-mysql-ghost.bat` → tue les `mysqld.exe` fantômes.
- Relance Start MySQL dans XAMPP.
- Si ça recommence : regarde `C:\xampp\mysql\data\mysql_error.log`.

## Revenir en HTTP

Supprime (ou renomme) le dossier `backend\certs\` puis relance `03-run.bat`.
Le script redétecte l'absence de certificat et repart en HTTP.
