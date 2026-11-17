# ACRHO Angular

Interface web Angular autonome pour consulter les saisons ACRHO, leur calendrier, les parcours et les résultats publiés, ainsi que rechercher des coureurs.

## Démarrage local

1. Démarrer l'API Spring ACRHO sur `http://localhost:8080`.
2. Depuis ce dossier, lancer `npm install` si nécessaire.
3. Lancer `npm start`, puis ouvrir `http://localhost:4200`.

Le serveur de développement redirige `/api` vers `http://localhost:8080` via `proxy.conf.json`. L'application et l'API doivent être accessibles ensemble pendant le développement.

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


