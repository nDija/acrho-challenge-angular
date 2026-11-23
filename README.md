# ACRHO Challenge Angular

Interface web Angular autonome pour consulter les saisons ACRHO, leur calendrier, les parcours et les résultats publiés, ainsi que rechercher des coureurs.

## Démarrage local

1. Vérifier que l'API ACRHO est accessible sur le réseau, par défaut `http://192.168.0.100:8080`.
2. Depuis ce dossier, lancer `npm install` si nécessaire.
3. Lancer `npm start`, puis ouvrir `http://localhost:4200`.

Le serveur de développement redirige `/api` vers `http://192.168.0.100:8080` via `proxy.conf.json`. Pour utiliser une API locale, modifier cette cible en `http://localhost:8080`.

## Publication sur GitHub Pages (obsolète)

> **Obsolète.** Depuis la suppression de la configuration CORS de l'API, ce front ne peut plus fonctionner sur
> GitHub Pages (autre origine que l'API, cookie de session et jeton XSRF inutilisables). Le front est désormais servi
> par Caddy, avec l'API, sur `https://acrho-challenge.ddns.net` (voir `Caddyfile.new`). Cette section n'est gardée
> que pour mémoire ; `deploy:pages` peut être retiré de `package.json`.

Le dépôt `nDija/acrho-challenge-angular` publie le frontend à l'adresse
<https://ndija.github.io/acrho-challenge-angular/>. La commande `ng deploy` construit l'application puis pousse
les fichiers statiques dans la branche `gh-pages`.

### Préparer SSH sous Windows

GitHub doit connaître la clé publique correspondant à la clé privée locale. Dans les paramètres GitHub, ajoute
le contenu du fichier public (`id_ed25519.pub`, par exemple) à **Settings → SSH and GPG keys**.

Si `ssh-add -l` répond `Error connecting to agent`, démarrer le service OpenSSH depuis PowerShell lancé en
administrateur :

```powershell
Set-Service ssh-agent -StartupType Manual
Start-Service ssh-agent
```

Puis dans le terminal de travail, charger la clé privée et vérifier la connexion :

```powershell
ssh-add "$env:USERPROFILE\.ssh\id_ed25519"
ssh -T git@github.com
```

Le message `Hi nDija!` confirme l'authentification. Si la clé porte un autre nom, remplacer `id_ed25519`.
Le fichier sans extension est la clé privée : ne le partage jamais. Seul le fichier `.pub` est ajouté à GitHub.

### Construire et publier

Dans PowerShell, depuis le dossier du projet :

```powershell
$env:GIT_SSH_COMMAND = 'C:/Windows/System32/OpenSSH/ssh.exe'
npm run deploy:pages
```

Le chemin OpenSSH utilise des `/` afin que Git le transmette correctement à son shell. La commande `ng deploy`
construit avec la configuration Angular `production` puis publie les fichiers dans `gh-pages`.

### Configurer la source GitHub Pages

Dans le dépôt GitHub, ouvrir **Settings → Pages** et choisir :

- **Source** : `Deploy from a branch`
- **Branch** : `gh-pages`
- **Folder** : `/(root)`

Si GitHub affiche le README au lieu de l'application, vérifier que Pages publie bien `gh-pages` et non `main`.
Après le premier réglage, attendre la fin du workflow Pages avant d'ouvrir le lien.

Les avertissements de budgets Angular (taille du bundle ou de `app.scss`) ne bloquent pas le déploiement tant
qu'ils restent sous les seuils d'erreur.

### API en production

GitHub Pages héberge uniquement les fichiers statiques : il ne relaie pas les requêtes `/api` vers Spring.
La configuration locale utilise des chemins `/api/...` et le proxy défini dans `proxy.conf.json`. La configuration
`production` remplace l'URL de base par `https://acrho-challenge.ddns.net`. Depuis la mise en place de Caddy (même origine pour le front et l'API), il n'y a plus de CORS : l'ancienne
autorisation de l'origine
`https://ndija.github.io` a été supprimée côté API. Caddy ajoute aussi les en-têtes de sécurité (HSTS,
`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).

## Angular Material

Angular Material et Angular CDK sont installés. Le thème Material `azure-blue` est chargé dans `src/styles.scss`.

## API consommée

- `GET /api/v1/seasons`
- `GET /api/v1/seasons/year/{year}/races`
- `GET /api/v1/races/{id}`
- `GET /api/v1/routes/{id}/results`
- `GET /api/v1/categories`
- `GET /api/v1/runners?q=...`
- `PUT /api/v1/me/picture-visibility` (connecté) : afficher ou cacher sa photo de profil publique, avec le jeton XSRF

Les résultats dépendent des courses publiées par l'API.


