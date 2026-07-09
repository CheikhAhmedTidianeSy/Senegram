# Déploiement Aiven MySQL + Render

## Variables Render

Dans le service backend Render :

```env
NODE_ENV=production
CLIENT_URL=https://ton-frontend.vercel.app
JWT_SECRET=une-valeur-longue-et-secrete
MYSQL_URL=mysql://avnadmin:mot_de_passe@mysql-project.a.aivencloud.com:12345/defaultdb
DB_SSL=true
DB_CA_CERT="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
```

Tu peux aussi utiliser `DATABASE_URL` à la place de `MYSQL_URL`, tant que l'URL commence par `mysql://`.

## Récupérer les infos Aiven

Dans Aiven :

1. Ouvre ton service MySQL.
2. Va dans `Overview`.
3. Copie `Service URI` pour `MYSQL_URL`.
4. Télécharge ou copie le certificat `CA Certificate`.
5. Mets le certificat dans Render comme `DB_CA_CERT`, en gardant les retours ligne sous forme `\n`.

## Initialiser la base

En local avec `backend/.env` configuré :

```bash
cd backend
npm run db:check
npm run db:init
```

Sur Render, `preDeployCommand: npm run db:init` initialise automatiquement le schéma au déploiement.

## Variables Vercel

Dans le frontend Vercel :

```env
VITE_API_URL=https://ton-backend.onrender.com
```

Redéploie ensuite le frontend.

## Notes

- Le schéma MySQL est dans `backend/database/schema.sql`.
- Les fichiers uploadés sont encore stockés sur le filesystem Render. Pour une vraie production, il faudra passer les uploads vers Aiven Object Storage, S3, Cloudinary ou équivalent.
- Les appels WebRTC peuvent nécessiter un serveur TURN en production selon les réseaux.
