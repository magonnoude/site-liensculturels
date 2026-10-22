# Bascule de secours (compte AWS suspendu) — branche `secours/api-keycloak`

Depuis la suspension du compte AWS (16/10/2026), l'API et l'authentification du site sont reconstruites sur le ThinkPad du bureau
(dépôt `liensculturels-api`), derrière un VPS OVH. Le site reste servi par Cloudflare Pages.

| | Avant (AWS) | Secours |
|---|---|---|
| Authentification | Cognito Hosted UI, client public `757mjbo05rlabup4kkai470d86`, domaine `liensculturels-membres.auth.eu-west-3.amazoncognito.com` | Keycloak, realm `liensculturels`, client public `lc-site`, `https://auth-secours.grouperms.com/realms/liensculturels/protocol/openid-connect` |
| Groupes | claim `cognito:groups` | claim `realm_access.roles` (mêmes 7 noms) |
| API | API Gateway `8igk1o6vw4` (14 Lambdas, DynamoDB) | `https://api.liensculturels.org` (FastAPI, PostgreSQL) |

Fichiers touchés : `assets/js/auth.js` (fournisseur d'identité, `getGroups()`), `assets/js/espace-membre.js` (lecture des groupes) et l'adresse
de l'API dans les modules JS qui l'appellent.

**Retour à AWS** : remettre dans `auth.js` l'ancien `domain`/`clientId`/`apiBase` ci-dessus, les chemins `/oauth2/authorize` et `/oauth2/token`,
`cognito:groups`, `logout_uri` ; remettre l'ancienne adresse d'API dans les autres modules. Les données saisies pendant la fenêtre de secours
n'existent que dans la base `liensculturels` du ThinkPad : les réinjecter avant de couper.

`tests/smoke.js` n'a pas été adapté (il vise encore la page de connexion Cognito).
