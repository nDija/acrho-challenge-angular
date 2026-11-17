# ACRHO Challenge Angular

Interface web Angular autonome pour consulter les saisons ACRHO, leur calendrier, les parcours et les résultats publiés, ainsi que rechercher des coureurs.

## Démarrage local

1. Démarrer l'API Spring ACRHO sur `http://localhost:8080`.
2. Depuis ce dossier, lancer `npm install` si nécessaire.
3. Lancer `npm start`, puis ouvrir `http://localhost:4200`.

Le serveur de développement redirige `/api` vers `http://localhost:8080` via `proxy.conf.json`. L'application et l'API doivent être accessibles ensemble pendant le développement.

## Publication sur GitHub Pages

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
ng deploy --base-href=/acrho-challenge-angular/
```

Le chemin OpenSSH utilise des `/` afin que Git le transmette correctement à son shell. La commande `ng deploy`
reconstruit le site et publie les fichiers dans `gh-pages`.

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
`proxy.conf.json` ne sert qu'avec `npm start` en local. L'API Angular actuelle utilise des chemins `/api/...` ;
pour charger les données sur le site publié, il faudra configurer une URL publique de l'API dans le frontend et
autoriser son origine dans la configuration CORS de l'API.

## Angular Material

Angular Material et Angular CDK sont installés. Le thème Material `azure-blue` est chargé dans `src/styles.scss`.

## API consommée

- `GET /api/v1/seasons`
- `GET /api/v1/seasons/year/{year}/races`
- `GET /api/v1/races/{id}`
- `GET /api/v1/routes/{id}/results`
- `GET /api/v1/categories`
- `GET /api/v1/runners?q=...`

Les résultats dépendent des courses publiées par l'API.


