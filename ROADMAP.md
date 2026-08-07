# ROADMAP — www.liensculturels.org

Backlog établi après audit du site, du dépôt Git et de l'infrastructure AWS (2026-08-07),
complété le même jour. Priorisé par impact / effort. `[x]` = corrigé.

**Statut : les 6 priorités mécaniques (P1–P6) sont closes**, y compris la restriction CORS.
Ce qui reste ouvert : le câblage des photos de bureau (décision de contenu, volontairement
non faite à la place de l'association) et le site bilingue (optionnel). Les 4 nouveaux
espaces (membre, admin, secrétaire, trésorier) demandés séparément ne sont pas encore
construits — voir le fil de discussion pour la proposition d'architecture.

## Priorité 1 — Bugs actifs en production

- [x] **Domaine nu cassé.** `https://liensculturels.org` (sans `www`) échouait en TLS et
  renvoyait une 403 CloudFront. Corrigé : nouveau certificat ACM avec SAN sur le domaine nu,
  validé via Gandi, alias + certificat mis à jour sur CloudFront `E27Z3FWSMEYT5U`. Redirige
  désormais en 301 vers `www.liensculturels.org`.
- [x] **CSS/JS cassés sur les pages de confirmation newsletter.** `merci-newsletter.html`
  et `validation-newsletter.html` pointaient vers `css/style.css`/`js/main.js` au lieu de
  `assets/css/…`/`assets/js/…`.
- [x] **Header/footer vides sur ces deux mêmes pages.** Remplacés par le header/footer
  standard du site (navigation, coordonnées, réseaux sociaux). Balisage `<p>`/`<strong>`
  invalide corrigé au passage.
- [x] **CORS API Gateway trop permissif.** `AllowOrigins` restreint de `"*"` à
  `https://www.liensculturels.org` + `https://liensculturels.org` sur `liensCulturels-API`.
  Vérifié : une origine tierce ne reçoit plus les en-têtes CORS en preflight.

## Priorité 2 — SEO & découvrabilité

- [x] **Open Graph / Twitter Card** ajoutées sur les 18 pages (title, description, image,
  url, type, locale).
- [x] **Balises canonical** ajoutées sur les 18 pages.
- [x] **Sitemap incomplet.** `phototheque.html`, `videotheque.html`,
  `mentions-legales.html` ajoutées.
- [x] **Pages de confirmation indexables.** `noindex` ajouté.
- [x] **Données structurées schema.org.** Bloc JSON-LD `NGO` (logo, adresse, réseaux
  sociaux) ajouté sur `index.html`.
- [x] **Favicon/manifest câblé** sur les 18 pages + `404.html` (favicon.ico, 16×16, 32×32,
  apple-touch-icon, manifest).

## Priorité 3 — Performance

- [x] **Images `projets.html` optimisées.** `carte-nogent-l-artaud.png` (7,5 Mo) et
  `carte-save.png` (3,7 Mo) → WebP redimensionnées à 1100×1100 (273 Ko + 116 Ko — réduction
  de 97 %). PNG originales retirées du dépôt.
- [x] **`loading="lazy"`** ajouté sur les images hors zone visible (accueil, mot des
  dirigeants, bureau, jumelage, photothèque, vidéothèque, cartes projets).
- [x] **Font Awesome allégé.** `all.min.css` remplacé par `fontawesome.min.css` +
  `solid.min.css` + `brands.min.css` (seules familles réellement utilisées : `fas`, `fab`).

## Priorité 4 — Robustesse infra

- [x] **Page d'erreur personnalisée.** `404.html` créé (identité du site), et la
  distribution CloudFront mappe les erreurs 403/404 vers cette page (statut HTTP 404).
- [x] **Logging CloudFront activé.** Bucket dédié `www-liensculturels-org-logs` (chiffré,
  accès public bloqué, expiration 30 jours), délivrance via CloudWatch Logs "vended logs"
  (`liensculturels-cf-access-logs` → `liensculturels-logs-s3-dest`).
- [x] **Politique d'en-têtes de sécurité.** Response Headers Policy CloudFront
  (`liensculturels-security-headers`) : CSP, `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Strict-Transport-Security` (1 an). Vérifié en direct.

## Priorité 5 — Hygiène de dépôt / code

- [x] **Fichier dupliqué `index - Copie.html`** retiré du suivi Git.
- [x] **`File Structure.docx`** exclu du déploiement S3.
- [x] **Images FBTT supprimées** (`Logo FBTT*.png/.gif/.jpeg/.pdf`, `Logo_FBTT.png`) —
  sans rapport avec l'association, aucune référence trouvée.
- [x] **`assets/js/loader.js` (code mort) supprimé** — n'était référencé par aucune page.
- [x] **Balisage HTML invalide** sur les pages de confirmation newsletter — corrigé avec
  le point header/footer de P1.
- [ ] **Images encore non câblées dans `assets/img/`** (photos de membres du bureau,
  nouveaux fonds de header/hero) — décision de contenu qui nécessite de savoir quelle
  photo va sur quelle fiche ; laissé de côté pour éviter une mauvaise attribution de photo
  à une personne nommée. À traiter avec l'association.

## Priorité 6 — Au-delà

- [x] **CI légère.** `.github/workflows/lint.yml` : validation HTML (Nu Html Checker) +
  vérification des liens internes cassés, sur chaque pull request.
- [ ] **Site bilingue FR/EN.** Toujours optionnel, effort significatif — à lancer
  uniquement si l'association le demande explicitement.

## Note — bug de déploiement trouvé et corrigé pendant cette session

`.github/workflows/deploy.yml` et `deploy.sh` prétendaient exclure les scripts shell du
déploiement mais le pattern `--exclude "*.sh"` manquait réellement de la liste : `deploy.sh`
s'est retrouvé publié sur le bucket public. Corrigé (pattern ajouté aux deux), et les objets
S3 orphelins (fichiers FBTT, anciennes cartes PNG, `loader.js`, `deploy.sh`) ont été
supprimés manuellement puisque le workflow de sync n'utilise volontairement pas `--delete`.
CloudFront invalidé et 404 vérifiée sur chacun de ces chemins.
