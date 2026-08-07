# ROADMAP — www.liensculturels.org

Backlog établi après audit du site, du dépôt Git et de l'infrastructure AWS
(2026-08-07). Priorisé par impact / effort. Un `[x]` indique un point déjà corrigé
pendant la session de scaffolding qui a produit cette roadmap.

## Priorité 1 — Bugs actifs en production

- [x] **Domaine nu cassé — corrigé le 2026-08-07.** `https://liensculturels.org` (sans
  `www`) échouait en TLS (handshake refusé) et renvoyait une 403 CloudFront en HTTP. Cause :
  le domaine n'était ni dans les SAN du certificat ACM (`*.liensculturels.org` uniquement)
  ni dans les alias de la distribution CloudFront `E27Z3FWSMEYT5U`. **Correctif appliqué :**
  nouveau certificat ACM (us-east-1, `6586fe54-c9cb-468b-bcc3-a1e38b173315`) avec SAN
  `liensculturels.org` + `*.liensculturels.org`, validé par CNAME chez **Gandi**, puis
  alias `liensculturels.org` et certificat mis à jour sur la distribution CloudFront.
  L'ancien certificat a été supprimé. Vérifié : `liensculturels.org` et
  `http://liensculturels.org` redirigent en 301 vers `www.liensculturels.org` via la
  CloudFront Function `redirect-root-to-www`, désormais atteignable.
- [x] **CSS/JS cassés sur les pages de confirmation newsletter.** `merci-newsletter.html`
  et `validation-newsletter.html` chargeaient `css/style.css` et `js/main.js` (chemins
  relatifs faux — le vrai chemin est `assets/css/...` et `assets/js/...`). Corrigé dans
  cette session.
- [ ] **Header/footer vides sur ces deux mêmes pages.** `<header id="main-header">` et
  `<footer id="main-footer">` sont des coquilles vides — aucune navigation, aucun contact,
  aucun lien réseaux sociaux sur la page qu'un nouvel abonné voit juste après inscription.
  Il faut soit y coller le header/footer standard du site, soit les brancher sur un vrai
  composant partagé (voir point suivant sur `loader.js`).
- [ ] **CORS API Gateway trop permissif.** `liensCulturels-API` (`8igk1o6vw4`) autorise
  `AllowOrigins: "*"` sur les routes `POST /contact` et `POST /adhesion`. À restreindre à
  `https://www.liensculturels.org` (et `https://liensculturels.org` une fois le point
  précédent corrigé) pour empêcher un site tiers d'appeler ces endpoints depuis le
  navigateur d'un visiteur.

## Priorité 2 — SEO & découvrabilité

- [ ] **Aucune balise Open Graph / Twitter Card** sur aucune page — les partages sur
  Facebook/LinkedIn/X n'affichent ni image, ni titre, ni description personnalisés.
  L'association a une page Facebook, Instagram, LinkedIn, X, YouTube (liens en footer) :
  fort potentiel de partage social non exploité.
- [ ] **Aucune balise canonical.** À ajouter sur chaque page une fois le domaine nu
  corrigé, pour éviter tout risque de contenu dupliqué `liensculturels.org` vs
  `www.liensculturels.org`.
- [x] **Sitemap incomplet.** `phototheque.html`, `videotheque.html` et
  `mentions-legales.html` étaient absentes de `sitemap.xml`. Ajoutées.
- [x] **Pages de confirmation indexables.** `merci-newsletter.html` et
  `validation-newsletter.html` n'avaient pas de `noindex` — ajouté.
- [ ] **Pas de données structurées (schema.org).** Un bloc JSON-LD `Organization`/`NGO`
  avec logo, adresse, réseaux sociaux aiderait Google à construire un panneau de
  connaissance pour l'association.
- [ ] **Favicon/manifest incomplet.** Plusieurs fichiers sont déjà présents dans
  `assets/img/` (`favicon-16x16.png`, `favicon-32x32.png`, `favicon.ico`,
  `android-chrome-192x192.png`, `android-chrome-512x512.png`, `apple-touch-icon.png`,
  `site.webmanifest`) mais **aucune page ne les référence** — seul `logo.png` brut est
  utilisé comme favicon. Câbler le vrai jeu d'icônes (`<link rel="icon">`,
  `rel="apple-touch-icon"`, `rel="manifest"`) sur toutes les pages.

## Priorité 3 — Performance

- [ ] **Images non optimisées, en particulier `projets.html`.** Cette page charge à elle
  seule `carte-nogent-l-artaud.png` (**7,5 Mo**) et `carte-save.png` (**3,7 Mo**) — plus de
  11 Mo pour deux captures de carte. Compresser/convertir en WebP et redimensionner à la
  taille d'affichage réelle ferait chuter ça à quelques centaines de Ko. C'est de loin le
  plus gros levier de performance du site.
- [ ] **Pas de `loading="lazy"`** sur les images hors zone visible (photothèque, listes de
  projets).
- [ ] **CDN Font Awesome chargé en entier** (`all.min.css`, ~85 Ko) pour quelques icônes —
  un sous-ensemble ou des SVG inline suffiraient.

## Priorité 4 — Robustesse infra

- [ ] **Pas de page d'erreur personnalisée.** Une 404 S3/CloudFront affiche le XML brut
  d'erreur AWS plutôt qu'une page `404.html` à l'identité du site.
- [ ] **Logging CloudFront désactivé.** Aucune visibilité sur le trafic, les erreurs 4xx/5xx
  ou les tentatives d'abus. Activer les access logs vers un bucket S3 dédié (rétention
  courte, ex. 30 jours).
- [ ] **Aucune politique d'en-têtes de sécurité** (CSP, `X-Content-Type-Options`,
  `Referrer-Policy`) sur la distribution CloudFront. Ajouter une Response Headers Policy
  managée.

## Priorité 5 — Hygiène de dépôt / code

- [x] **Fichier dupliqué `index - Copie.html`** (copie Windows de l'ancienne version de
  `index.html`, aucun contenu unique) — retiré du suivi Git.
- [x] **`File Structure.docx`** exclu du déploiement S3 (reste dans le dépôt comme note de
  conception, mais n'est plus publié publiquement).
- [ ] **`assets/js/loader.js` est du code mort** — il attend des éléments
  `#header-placeholder` / `#footer-placeholder` qu'aucune page n'a. Soit on l'utilise
  vraiment pour factoriser header/footer sur les 20 pages (bénéfice : un seul endroit à
  éditer pour changer le menu), soit on le supprime pour éviter la confusion.
- [ ] **29 nouvelles images ajoutées dans `assets/img/` ne sont référencées par aucune
  page** (photos de membres du bureau, logos "FBTT", nouveau jeu de favicons, nouveaux
  fonds de header/hero). Elles semblent préparer une prochaine mise à jour de contenu —
  à confirmer avec l'association puis câbler dans les pages concernées, ou supprimer si
  abandonnées.
- [ ] **Balisage HTML invalide** sur les deux pages de confirmation newsletter (un `<p>`
  fermé avant un `<strong>`, une balise `</p>` surnuméraire) — à nettoyer en même temps
  que le point header/footer ci-dessus.

## Priorité 6 — Au-delà (optionnel, plus gros effort)

- [ ] **Suite de tests légère** : un `.github/workflows` de lint HTML (`html-validate`) et
  de vérification des liens morts sur chaque PR, dans l'esprit de ce que fait déjà
  `academy.grouperms.com` avec Jest/Playwright — mais proportionné à un site sans backend
  versionné.
- [ ] **Site bilingue FR/EN** : l'association a une portée internationale (France,
  Antilles, Bénin) ; une bascule de langue façon `rmsimpact.org`/`www.grouperms.com`
  (classes `.lang-fr`/`.lang-en` + `switchLanguage()`) élargirait l'audience. Effort
  significatif — à ne lancer que si l'association le demande.
