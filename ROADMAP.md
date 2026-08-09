# ROADMAP — www.liensculturels.org

Backlog établi après audit du site, du dépôt Git et de l'infrastructure AWS (2026-08-07),
complété le même jour. Priorisé par impact / effort. `[x]` = corrigé.

**Statut : les 6 priorités mécaniques (P1–P6) sont closes**, y compris la restriction CORS.
**Les 4 espaces authentifiés (membre / admin / secrétariat / trésorerie) demandés
séparément sont également construits, déployés et vérifiés en production** (2026-08-08) —
voir la section dédiée ci-dessous. Ce qui reste ouvert : le câblage des photos de bureau
(bloqué en attente d'une info de l'association, voir P5). **La traduction FR/EN des 25
pages du site est désormais complète** (2026-08-08) — voir tableau, item 9. **Round 2
(2026-08-09)** : espace membre enrichi (agenda, paiement cotisation/don, historique,
badge), gestion réelle de la newsletter côté admin, footer aligné sur le gabarit RMS,
nouvelle page publique "Vie associative", et fiche d'adhésion refondue — voir tableau,
items 11 à 15. **Round 3** : corrections suite aux premiers tests utilisateur (footer,
carte de paiement masquée à tort, détails des membres de la famille, bouton "S'inscrire",
adresse structurée) — items 16 à 20. **Round 4 (2026-08-09)** : nav simplifiée, favicon
régénéré, bandeaux photo sur les pages pauvres en design et les espaces internes, photo de
profil membre, et surtout le vrai bug derrière "mon adhésion n'apparaît nulle part" —
items 21 à 26. **Round 5** : bug CORS S3 empêchant tout upload direct depuis un navigateur
(photos membres, mais aussi comptes-rendus et justificatifs — probablement jamais
fonctionnels), design de agenda/contact/adhésion, statut SES/DKIM clarifié et corrigé
(statut périmé, pas un vrai problème DNS) — items 27 à 30. **Round 6** : audit des droits
admin, création du compte `contact@liensculturels.org`, gestion des rôles depuis l'admin,
notifications e-mail de paiement — items 31 à 34. **Round 7** : vrai bug 403 sur les
comptes multi-groupes Cognito (espace vs virgule), texte de la fiche d'adhésion refondu
— items 35 à 36. **Round 8** : nouvelle identité visuelle (logo, favicons, og-image) —
items 37 à 38. **Round 9** : verrouillage téléphone/adresse en espace membre, dons
séparés en admin, deux numéros de téléphone, provisionnement Cognito du bureau — items
39 à 42. **Round 10** : rôle Gouvernance séparé d'Admin avec tableau de bord dédié,
champ Type sur les dépenses, documentation technique + documentation d'utilisation/FAQ
— items 43 à 44.

## Tableau de suivi — demandes du 7–8 août 2026

Toutes les demandes reçues par message, dans l'ordre, avec leur statut réel au 8 août.
`✅` fait et vérifié en production · `🟡` fait partiellement · `⛔` bloqué (dépend d'une
action externe, pas de moi) · `💬` répondu comme conseil, pas une action à faire.

| # | Demande | Statut | Détail |
|---|---|---|---|
| 1 | Infos d'immatriculation (RNA, SIREN, dates JOAFE) dans le site + footer | ✅ | Déjà correctes dans `mentions-legales.html` et `post-creation.html` avant même cette session ; seul le téléphone manquait, ajouté partout. |
| 2 | Newsletter avec les outils AWS, abandonner Brevo | ✅ | DynamoDB + Lambda + SES, double opt-in, `admin.html` affiche les vrais abonnés. |
| 3a | Header façon kesho.grouperms.com | ✅ | Reconstruit une 2ᵉ fois le 8 août après un premier essai incomplet : bandeau utilitaire + barre principale en un seul bloc épinglé, CTA en pilule distincte, nav en tuiles, menu mobile. |
| 3b | Cognito vs Keycloak — logique d'utiliser le Keycloak RMS avec un realm séparé pour un client comme GARA ? | 💬 | Conseil donné : garder Cognito dédié (déjà construit, testé) plutôt que coupler la disponibilité d'un client à l'infra partagée de RMS. Reconsidérer seulement si RMS industrialise ce pattern sur plusieurs clients. |
| 4 | Invitations via SES + vérifier le domaine `liensculturels.org` dans AWS | 🟡 | Domaine bien déclaré dans AWS mais vérification DNS expirée (DKIM manquant chez Gandi) — enregistrements transmis, **en attente que vous les ajoutiez**. L'envoi fonctionne déjà via l'identité e-mail `contact@liensculturels.org`, vérifiée séparément. |
| 5 | Stripe + FedaPay pour les cotisations, fiche d'adhésion avec paiement direct détaillé, sur le modèle d'academy | 🟡 | Codé, déployé. **Stripe activé en mode TEST le 2026-08-09** (clés `sk_test_`/`pk_test_`/`whsec_` configurées sur la Lambda `liensCulturels-payment`) et **testé en conditions réelles avec un navigateur automatisé** (Playwright) : formulaire d'adhésion → paiement carte test (4242…) → redirection succès. **Vrai bug de production trouvé et corrigé au passage** : `stripe.Webhook.construct_event()` (SDK `stripe-python` 15.4.0) renvoie des objets `StripeObject` qui n'ont pas de méthode `.get()` (seulement `__getitem__`/attributs) — le webhook plantait en silence sur `session.get("metadata")` et ne recopiait jamais un paiement carte dans `liensculturels-cotisations`. Corrigé (`.to_dict()` sur l'objet avant de le lire), redéployé, re-testé de bout en bout : le paiement de test apparaît bien dans `liensculturels-cotisations` (donnée de test supprimée après vérification). Ce bug aurait touché **tout** paiement Stripe réel, pas seulement les tests. FedaPay toujours inactif. **Mode LIVE (vraies clés `sk_live_`) volontairement pas encore activé** — comptes marchands réels à ouvrir au nom de l'association avant de passer en production, voir `PAYMENTS-SETUP.md`. |
| 6 | Footer avec Mentions Légales / CGU / Confidentialité façon academy | ✅ | `cgu.html` et `confidentialite.html` créées (contenu propre à l'association, pas copié), footer refait sur les 25 pages. |
| 7 | Email officiel `contact@liensculturels.com` + téléphone `+33674437609` | ✅ | `.com` confirmé être une coquille pour `.org` (déjà l'email utilisé partout) ; téléphone ajouté. |
| 8 | Boutons séparés « Devenir Membre / Nous Rejoindre » (1ʳᵉ inscription + paiement) et « Accès Membre » | ✅ | Les deux existaient déjà dans des zones différentes mais avec des libellés trop proches ; nommage clarifié, puis le header entier reconstruit le 8 août pour vraiment séparer les deux visuellement (pilule CTA vs lien discret). |
| 9 | Site multilingue EN/FR | ✅ | Infrastructure en ligne sur les 25 pages (bascule FR/EN dans le header, persistée) + navigation, pied de page et **contenu des 25 pages** entièrement bilingues, déployé et vérifié en production le 8 août : accueil, qui sommes-nous, contact, adhésion, bourse scolaire (lot précédent), puis projets, agenda (contenu statique — les événements viennent de l'API et restent en français, ainsi que le calendrier FullCalendar lui-même), bureau, mot des dirigeants, photothèque, vidéothèque, blog + les 3 articles, mentions légales, CGU, confidentialité (ce lot). |
| 10 | Tableau de suivi + mise à jour de la roadmap .md et web | ✅ | Ce tableau, et l'artefact web republié (voir lien dans le fil de discussion). |

## Tableau de suivi — demandes du 8–9 août 2026 (round 2)

| # | Demande | Statut | Détail |
|---|---|---|---|
| 11 | Espace membre : agenda, boutons « payer ma cotisation » / « faire un don », dashboard des paiements passés, badge « à jour de cotisation » | ✅ | `espace-membre.html` : widget des 5 prochains événements (réutilise `GET /agenda` public), section paiement (cotisation + don, montant libre), historique via nouvelle route `GET /me/cotisations` (`liensCulturels-member-profile`), badge visuel dégradé vert/orange selon `statutCotisation`. |
| 12 | Admin : gérer la newsletter | ✅ | Au-delà de la liste/suppression déjà existante : composition + envoi réel via SES aux abonnés confirmés (`POST /admin/newsletter/send`, nouvelle route sur `liensCulturels-admin-api`). |
| 13 | Footer : copyright à gauche, liens légaux à droite sur la même ligne, crédit RMS en dessous sur sa propre ligne, comme les autres sites RMS | ✅ | Repris du gabarit `kesho.grouperms.com` (`pied-de-page.tsx`) : `.footer-bottom-row` en flex `justify-content:space-between`, `.footer-credit` séparé par une bordure, centré, sur les 25 pages. |
| 14 | Les actions du secrétariat (réunions, ordre du jour, CR, décisions) doivent apparaître sur le site | ✅ | Nouvelle page publique `vie-associative.html` (liée dans la nav « L'Association », `sitemap.xml`), alimentée par une nouvelle route publique `GET /public/vie-associative` sur `liensCulturels-secretariat-api`. **Choix confirmé avec vous** : texte (titre, date, ordre du jour, contenu, décisions) public ; le PDF scanné d'un compte-rendu reste réservé au secrétariat connecté. |
| 15 | Fiche d'adhésion : civilité séparée, prénom/nom séparés, indicatifs pays pour le téléphone, contrôle du champ e-mail, case newsletter, bouton payer qui redirige vers Stripe/FedaPay | ✅ | `adhesion.html` refondue (civilité + prénom + nom, sélecteur d'indicatif parmi ~195 pays, validation e-mail par regex avant envoi, case à cocher qui déclenche `POST /newsletter/subscribe` si cochée). Paiement généralisé : Stripe bascule sur **Checkout Session hébergé** (fini l'embarqué) — les deux boutons (Stripe, FedaPay) redirigent désormais réellement vers le prestataire, sur `adhesion.html` et `espace-membre.html`. |

**Non vérifié en conditions réelles de bout en bout** : le client Cognito n'autorise que le flux Hosted UI (PKCE/SRP), sans mot de passe direct côté API — impossible de forger un jeton JWT valide depuis cet environnement sans navigateur pour cliquer le parcours de connexion. Chaque route a été vérifiée séparément : les nouvelles Lambdas passent des tests d'invocation directe avec des claims simulées, les nouvelles routes API Gateway ont été testées (401 sans jeton sur les routes protégées, 200 sur les routes publiques), et une lacune de permission IAM (`lambda:InvokeFunction` scopé trop étroitement par chemin) a été trouvée et corrigée sur deux routes pendant cette vérification. **Recommandé : vous connecter une fois vous-même à `espace-membre.html` pour confirmer visuellement le rendu du dashboard, du badge et des boutons de paiement.**

## Tableau de suivi — demandes du 9 août 2026 (round 3)

| # | Demande | Statut | Détail |
|---|---|---|---|
| 16 | Footer : le crédit RMS n'était pas centré | ✅ | Bug de spécificité CSS réel (`.footer-bottom p` battait `.footer-credit` malgré l'ordre des règles) — sélecteur requalifié + `!important` en filet de sécurité. |
| 17 | Espace membre : rien ne s'affichait pour le paiement de la cotisation une fois connecté | ✅ | La carte entière était masquée tant que Stripe/FedaPay ne sont pas activés. Reprend désormais le pattern déjà utilisé sur `adhesion.html` : la carte reste visible, avec un message d'attente à la place des formulaires tant que le paiement n'est pas actif. |
| 18 | Pack Famille : identifier chaque membre de la famille (nom, prénom, lien de parenté), puis (précision reçue en cours de route) email, téléphone et adresse si différente — tous deviennent membres à part entière | ✅ | `adhesion.html` : lignes dynamiques ajout/suppression par membre de la famille, transmises à la Lambda d'adhésion. |
| 19 | Bouton « S'inscrire » sur l'écran de connexion de l'espace membre, vers la fiche d'adhésion | ✅ | Ajouté sous le bouton de connexion. |
| 20 | Fiche d'adhésion : séparer adresse / ville / code postal / pays (liste) | ✅ | 4 champs distincts, pays en liste déroulante (~195 pays, réutilise `country-codes.js`). |

**Bug incident trouvé pendant la vérification** (pas une demande, corrigé au passage) : une option du sélecteur de cotisation dans l'espace membre avait du balisage `<span class="lang-fr">` à l'intérieur d'une balise `<option>` — les navigateurs n'affichent que le texte brut d'une `<option>`, donc la bascule FR/EN n'y fonctionnait pas. Retiré, comme pour l'option "famille" voisine qui n'avait jamais eu ce problème.

## Tableau de suivi — demandes du 9 août 2026 (round 4)

| # | Demande | Statut | Détail |
|---|---|---|---|
| 21 | Nav : deux libellés différents pour le même lien ("Devenir Membre / Nous Rejoindre" en haut, "Devenir Membre" dans le menu) — n'en garder qu'un | ✅ | Réviser l'item 8 du premier tableau : le doublon volontaire de l'époque s'est avéré redondant à l'usage. `cta-pill` simplifié en "Devenir Membre" sur les 26 pages. |
| 22 | Favicon « pas adapté » | ✅ | Régénéré depuis `logo.png` (recadré sur l'emblème seul, sans le texte, pour rester lisible en 16×16/32×32) : `favicon.ico`, toutes les tailles PNG, `apple-touch-icon`. `site.webmanifest` avait aussi un vrai bug (chemins d'icônes à la racine au lieu de `assets/img/`, 404 en prod) — corrigé au passage. |
| 23 | Design trop pauvre sur bureau, mot des dirigeants, contact, adhésion | ✅ | Bandeau photo (`.page-header.with-photo`) ajouté aux 4 pages — pattern déjà défini dans `style.css` mais jusque-là inutilisé par ces pages. |
| 24 | Espace membre : photo de profil | ✅ | Avatar circulaire (photo ou initiales), upload direct vers S3 via URL présignée (nouvelle route `POST /me/photo-upload-url`). Clé S3 unique par envoi (le cache CloudFront du site ignore les query strings, un simple `?v=` n'aurait pas suffi à invalider une photo remplacée). |
| 25 | Adhésion + newsletter : rien ne s'affiche dans admin/trésorerie après inscription | ✅ | Cause racine : la Lambda d'adhésion n'a jamais persisté nulle part (2 emails, et c'est tout) — confirmé en récupérant son code déployé. Elle crée désormais directement le compte Cognito (groupe "membre") + la fiche `liensculturels-members`, comme le fait déjà "Inviter un membre" côté admin — donc visible immédiatement dans `admin.html` et `tresorerie.html`. Chaque membre de la famille (pack "famille") avec un email obtient aussi son propre compte. Testé de bout en bout avec des comptes jetables (créés puis supprimés) : compte principal, membre de famille avec email, membre de famille sans email, et soumission en double. |
| 25b | Agrémenter admin / secrétariat / trésorerie d'images modernes adaptées | ✅ | Même bandeau photo qu'au point 23, onglets et boutons retouchés (coins arrondis, survol, légère élévation). |
| 26 | Agrémenter toutes les pages de fond d'images des deux villes (Bénin et France) | ✅ | Aucune vraie photo des deux villes n'existait dans le dépôt (les fichiers déjà présents et non utilisés se sont révélés être des visuels de tennis de table déposés par erreur depuis `tennis2table.grouperms.com` — supprimés). 2 photos réelles sourcées sur Wikimedia Commons (licence CC BY-SA, crédit affiché) : l'église de Nogent-l'Artaud et la formation rocheuse de Savè. Bandeau photo discret ajouté juste avant le footer sur les 26 pages. |

## Tableau de suivi — demandes du 9 août 2026 (round 5)

| # | Demande | Statut | Détail |
|---|---|---|---|
| 27 | Impossible de charger la photo de profil (nouvelle fonctionnalité du round 4) | ✅ | Cause racine : aucun des 3 buckets S3 recevant des envois directs depuis le navigateur (photos membres, comptes-rendus secrétariat, justificatifs trésorerie) n'avait de configuration CORS — un `PUT` avec en-tête `Content-Type` déclenche un préflight que S3 rejetait silencieusement côté navigateur (invisible en test `curl`, qui n'applique pas CORS). Configuration CORS ajoutée sur les 3 buckets, scopée aux deux domaines du site. **Découverte importante au passage : les uploads de comptes-rendus et de justificatifs de dépenses, marqués ✅ lors de leur construction, avaient très probablement le même bug** — jamais testés depuis un vrai navigateur, seulement en ligne de commande. |
| 28 | Améliorer le design de contact, adhésion, agenda (avec retour en arrière possible) | ✅ | `agenda.html` : bandeau photo + légende de couleur À venir/Passé. `contact.html` : formulaire + carte "Nous trouver" en 2 colonnes. `adhesion.html` : long formulaire regroupé en 4 sections visuelles (Identité, Adresse, Contact & cotisation, Famille). Chaque page dans un commit séparé — un `git revert` suffit à annuler sans toucher au reste du site. |
| 29 | Le domaine liensculturels.org est-il vérifié en SES ? | ✅ | Il ne l'était plus (statut `FAILED`, dernier contrôle réussi le 2026-07-08). Vérification DNS en direct : les enregistrements DKIM et MAIL FROM transmis précédemment étaient en fait déjà bien ajoutés côté Gandi — le statut AWS était simplement périmé (dernier contrôle du 2026-07-19, jamais rafraîchi depuis). Recheck déclenché manuellement : DKIM, MAIL FROM et le domaine sont passés à `SUCCESS` en moins d'une minute. **Le domaine est maintenant vérifié.** |
| 30 | Quel est le problème avec DKIM ? | ✅ | Voir point 29 — plus de problème, c'était un statut périmé côté AWS, pas un enregistrement DNS manquant ou incorrect. |

## Tableau de suivi — demandes du 9 août 2026 (round 6)

| # | Demande | Statut | Détail |
|---|---|---|---|
| 31 | Quels sont mes droits (modeste.agonnoude@gmail.com) ? Je n'arrive pas à faire de modifications dans l'admin | ✅ | Compte dans les 3 groupes (admin, secrétaire, trésorier) — droits complets, ce n'était pas un problème de permissions. Cause réelle trouvée : l'admin ne permettait de modifier, pour un membre **existant**, que son statut de cotisation — aucune fonctionnalité pour changer son rôle. Voir point 33. |
| 32 | Créer un compte admin avec contact@liensculturels.org, tous les droits | ✅ | Compte créé (groupes admin + secrétaire + trésorier), mot de passe temporaire transmis directement (email d'invitation Cognito par défaut désactivé — peu fiable, cf. point 4 du 1er tableau). |
| 33 | Si j'affecte un rôle à quelqu'un, le compte se crée automatiquement ou doit-il déjà exister ? | ✅ | Avant ce round : une seule voie ("Inviter un membre"), qui **crée toujours** un compte tout neuf et échoue si l'e-mail existe déjà — aucun moyen de changer le rôle d'un compte existant. **Corrigé** : nouvelle colonne "Rôles" dans le tableau des membres de l'admin (sélecteur multiple, sauvegarde immédiate), nouvelle route `PUT /admin/members/{id}/groups` côté `liensCulturels-admin-api` (calcule le diff des groupes Cognito actuels/souhaités). Aucun changement IAM nécessaire — les permissions Cognito étaient déjà accordées au rôle de la Lambda. |
| 34 | Aucune notification reçue lors du test de paiement Stripe (ni au payeur ni à contact@liensculturels.org) | ✅ | Confirmé dans le code : la Lambda de paiement n'envoyait strictement aucun e-mail, contrairement à la Lambda d'adhésion. Ajouté : e-mail de confirmation au payeur + notification à la trésorerie après chaque paiement réussi (Stripe et FedaPay), point d'entrée commun `_record_cotisation()`. IAM : permission `ses:SendEmail` ajoutée au rôle de la Lambda (absente jusqu'ici). Re-testé de bout en bout avec le même scénario Playwright que la veille — aucune erreur d'envoi dans les logs. |

## Tableau de suivi — demandes du 9 août 2026 (round 7)

| # | Demande | Statut | Détail |
|---|---|---|---|
| 35 | Impossible de faire une seule modification dans admin, secrétariat et trésorerie | ✅ | **Ma réponse au point 31 (round 6) était incomplète** — j'avais trouvé un vrai manque (pas de gestion des rôles) mais pas la cause réelle de "aucune modification ne marche". Trouvée cette fois en se connectant pour de vrai avec un navigateur piloté (Playwright) plutôt qu'en testant seulement la Lambda directement : **un compte dans plusieurs groupes Cognito (admin + secrétaire + trésorier, exactement ton cas) échouait sur toute action d'écriture avec une erreur 403**, alors qu'un compte à un seul groupe fonctionnait. Cause exacte : l'API Gateway transmet la liste des groupes aux 3 Lambdas admin/secrétariat/trésorerie sous la forme `"[tresorier secretaire admin]"` (séparée par des **espaces**), mais leur code supposait une séparation par **virgules** — hypothèse jamais vérifiée en conditions réelles (tous les tests précédents utilisaient des comptes à un seul groupe simulé à la main). Résultat : pour un compte à 2+ groupes, "admin" n'était jamais retrouvé dans la liste, donc accès refusé partout, silencieusement, sans jamais remonter d'erreur serveur. Corrigé sur les 3 Lambdas, retesté de bout en bout avec un vrai compte multi-groupes connecté par navigateur : modification de cotisation (admin), création de réunion (secrétariat), enregistrement de paiement (trésorerie) — tout fonctionne. |
| 36 | Fiche d'adhésion : texte plus adapté, fin du RIB, annoncer clairement le paiement CB via Stripe et FedaPay/Mobile Money à venir pour le Bénin ; garder les 2 boutons (envoi du dossier + paiement) ? | ✅ | Paragraphe RIB supprimé (obsolète, contradictoire avec les vrais boutons Stripe). Nouveau texte : paiement CB via Stripe annoncé clairement, mention explicite que Mobile Money/FedaPay arrivera bientôt pour le Bénin, et clarification que l'inscription et le paiement sont deux étapes séparées (on peut payer tout de suite ou plus tard depuis l'espace membre) — **les deux boutons sont conservés**, exactement la logique proposée : s'inscrire maintenant, payer quand on veut. |

## Tableau de suivi — demandes du 9 août 2026 (round 8 — nouvelle identité visuelle)

| # | Demande | Statut | Détail |
|---|---|---|---|
| 37 | Intégrer la nouvelle identité visuelle (dossier `logo-liens-culturels/`) : logo horizontal dans le header, favicons régénérés, og-image, logo monochrome à l'impression | ✅ | Logo horizontal dans le header des 26 pages (56px desktop / 44px mobile), favicons régénérés depuis `logo-icone.svg` (Inkscape + Pillow) dont `favicon.ico` multi-résolution à la racine du site, `og-image.png` (1200×630, fond crème) depuis `logo-principal.svg` pour les partages sociaux, règle `@media print` substituant `logo-monochrome.svg` au logo du header à l'impression. `logo.png` et le dossier source `logo-liens-culturels/` conservés/non committés comme demandé. |
| 38 | Ajouter le logo au footer, supprimer les fichiers de favicon non référencés | ✅ | Icône (`logo-icone.svg`, 40px) ajoutée en tête de la colonne "Liens Culturels" du footer, sur les 23 pages avec footer complet. 5 anciens fichiers de favicon devenus orphelins supprimés du dépôt **et** du bucket S3 (le déploiement ne supprime pas les objets orphelins automatiquement — confirmé en 404 après invalidation CloudFront manuelle). |

## Tableau de suivi — demandes du 9 août 2026 (round 9)

| # | Demande | Statut | Détail |
|---|---|---|---|
| 39 | Espace membre : empêcher la modification du téléphone/adresse, afficher le total des dons | ✅ | Champs téléphone/adresse désactivés (gérés par le secrétariat désormais, lien vers Contact), bouton "Enregistrer" retiré. Total des dons affiché au-dessus de l'historique, calculé côté client depuis les données déjà chargées. |
| 40 | Admin : montant des dons affiché séparément de la cotisation | ✅ | Nouvelle colonne "Dons" dans le tableau des membres. `list_members()` agrège désormais `liensculturels-cotisations` par e-mail (la table lie par e-mail, pas par `memberId` Cognito) — permission IAM `dynamodb:Scan` ajoutée sur cette table. |
| 41 | Deux numéros de téléphone (France + Bénin, avec mention WhatsApp et "temporaire") | ✅ | Remplacement mécanique sur les 24 occurrences (23 pages + 2× sur `contact.html`) : "France — Tél/WhatsApp : +33 6 74 43 76 09 (temporaire)" et "Bénin — Tél/WhatsApp : +229 01 61 95 04 15 (temporaire)". |
| 42 | Provisionner les comptes Cognito du bureau (liste fournie), sans notification, rôles selon la fonction, ne garder que Trésorier pour l'utilisateur | ✅ | 6 comptes créés (les seuls avec un e-mail sur les 20 personnes listées) : Judicaël Senan Boni et Elie Smith → `admin` ; Franck-Olivier Gbeboutin et Gaëlle Sylviane Massenon → `secretaire` ; Stéphane Anakpo → `tresorier` ; François Dremont → `membre`. Aucun e-mail envoyé (`MessageAction=SUPPRESS` + mot de passe temporaire généré, transmis directement). Compte de l'utilisateur modifié : ne conserve plus que le groupe `tresorier` (retrait de `admin`/`secretaire`). **13 personnes laissées de côté faute d'e-mail dans la liste fournie** : Ronel Jethem Atindéhou, Christelle Le Tallec, Teddy Farot, Elyes Smith, Jordan Smith, Dominique Duclos, Denis Oba Chabi, Aures Oba Chabi, Deen Radji, Vanessa Cina, Christian Fournage, Dimitri Fournage, Nadège Levasseur. **Incident IAM trouvé et corrigé pendant ce lot** : l'ajout de la permission de lecture sur `liensculturels-cotisations` (point 40) a été fait à partir d'une lecture *filtrée* de la policy existante de `liensCulturels-admin-api`, écrasant par erreur 3 autres blocs de permissions (upload documents/galerie, invitation de membres, envoi newsletter) — repéré immédiatement (`list_members()` ne retrouvait plus aucun groupe), corrigé en restaurant la policy complète, revérifié. |

## Tableau de suivi — demandes du 9 août 2026 (round 10 — rôle Gouvernance & documentation)

| # | Demande | Statut | Détail |
|---|---|---|---|
| 43 | Séparer un rôle "Gouvernance" du rôle "Admin" (plutôt technique), avec un tableau de bord dédié (adhérents, point financier, bilan, charges fixes/exceptionnelles, dépenses) réservé au CA et aux 2 maires ; Judicaël et Elie sortent d'Admin pour rejoindre Gouvernance avec Franck-Olivier, Gaëlle, Stéphane et l'utilisateur | ✅ | Nouveau groupe Cognito `gouvernance`, **volontairement sans bypass "admin"** (rôle distinct confirmé) — même `contact@liensculturels.org` (admin+secrétaire+trésorier) n'y a pas accès sans ajout explicite. 6 comptes réaffectés : Judicaël Boni et Elie Smith quittent `admin` pour ne garder que `gouvernance` ; Franck-Olivier Gbeboutin et Gaëlle Massenon gardent `secretaire` + `gouvernance` ; Stéphane Anakpo et l'utilisateur gardent `tresorier` + `gouvernance`. Nouvelle page `gouvernance.html` + nouvelle Lambda dédiée **lecture seule** `liensCulturels-gouvernance-api` (`GET /gouvernance/summary` : nombre d'adhérents et répartition du statut de cotisation, cotisations/dons/dépenses/solde, dépenses par type et par catégorie). Nouveau champ "Type" (Fixe/Exceptionnelle) ajouté au formulaire de dépense en trésorerie pour alimenter ce découpage — pas de notion de "dépenses budgétées" (aucune donnée de budget prévisionnel saisie nulle part actuellement, volontairement absent du tableau de bord plutôt que fabriqué). **Les 2 maires (Dominique Duclos, Denis Oba Chabi) laissés de côté pour l'instant, faute d'e-mail dans les données fournies** — à ajouter dès qu'ils seront transmis. Vérifié en navigateur réel (Playwright) : dashboard visible et correct pour un compte du groupe `gouvernance`, accès refusé pour un compte qui ne l'a pas. |
| 44 | Documentation technique et documentation d'utilisation, avec une FAQ | ✅ | **Documentation technique** : nouveau fichier [`DOCUMENTATION-TECHNIQUE.md`](DOCUMENTATION-TECHNIQUE.md) à la racine du dépôt — architecture, les 8 Lambdas et leurs routes, schéma DynamoDB (avec le piège `cotisations.memberId` = e-mail, pas l'identifiant Cognito), Cognito (pool, 5 groupes désormais), une section "Pièges connus" qui documente les vrais bugs rencontrés cette session (groupes Cognito espace-vs-virgule, permissions Lambda scopées par route, écrasement de policy IAM par une lecture filtrée, CORS manquant sur les buckets d'upload, `deploy.yml` sans suppression automatique, `StripeObject.get()`, confinement snap d'Inkscape). **Documentation d'utilisation + FAQ** : d'abord publiée en artefact web externe, puis (voir item 45) rapatriée sur le site lui-même. |
| 45 | Rendre la doc technique disponible depuis Admin, et le guide d'utilisation + FAQ disponible sur le site (pas seulement en lien externe) | ✅ | **Admin** : nouvelle carte en haut de `admin.html` avec un lien direct vers `DOCUMENTATION-TECHNIQUE.md` sur GitHub (dépôt déjà public, une seule source de vérité — pas de copie HTML à maintenir en double). **Guide + FAQ** : nouvelle page `guide-utilisation.html` sur le site (réservée aux membres connectés, décision confirmée avec vous — même traitement que admin/secrétariat/trésorerie/gouvernance, exclue du pied de page public et de `sitemap.xml`, contenu en français uniquement), avec un sommaire ancré, une section par espace, et une FAQ de 7 questions en accordéon. Lien ajouté depuis l'espace membre (« Besoin d'aide ? »). Testé de bout en bout en navigateur réel (Playwright) : état "accès refusé" hors connexion, contenu visible une fois connecté, FAQ et sommaire fonctionnels, lien GitHub actif depuis l'admin. |

**Note en passant** : `README.md` n'a pas été mis à jour et est désormais partiellement en retard sur `DOCUMENTATION-TECHNIQUE.md` (qui reflète l'état réel du système au 9 août) — à harmoniser lors d'un prochain lot si besoin.

## Espaces authentifiés (membre / admin / secrétariat / trésorerie)

Construits et vérifiés de bout en bout le 2026-08-08, chacun avec compte jetable de test
avant d'être considéré fini. Architecture : Cognito (pool dédié, isolé du Keycloak
d'academy.grouperms.com) + DynamoDB + une Lambda par espace (rôle IAM scopé) + pages HTML
statiques classiques, aucune donnée sensible commitée dans ce dépôt public.

- [x] **[espace-membre.html](https://www.liensculturels.org/espace-membre.html)** —
  connexion Cognito (PKCE), profil, statut de cotisation. Hub qui affiche les liens vers
  les 3 espaces suivants selon les groupes Cognito du compte connecté.
- [x] **[admin.html](https://www.liensculturels.org/admin.html)** — membres (liste,
  cotisation, invitation), documents publics (`documents/`), agenda (alimente désormais
  `agenda.html` dynamiquement, les 9 événements historiques ont été migrés), photothèque/
  vidéothèque (section dynamique ajoutée sous la grille existante, laissée intacte),
  newsletter (liste des vrais abonnés depuis le 8 août, Brevo abandonné).
- [x] **[secretariat.html](https://www.liensculturels.org/secretariat.html)** — réunions,
  comptes-rendus (PDF stockés dans un bucket S3 **privé** dédié, jamais le bucket public du
  site), décisions.
- [x] **[tresorerie.html](https://www.liensculturels.org/tresorerie.html)** — cotisations
  (l'enregistrement d'un paiement met à jour le statut du membre, visible aussi côté admin),
  dépenses avec justificatifs (bucket privé dédié), export CSV, tuiles de synthèse (solde).
- [x] **Bug de nav corrigé** : `espace-membre.html` n'affichait un lien d'espace que si le
  compte était dans le groupe exact correspondant, alors que le backend autorise déjà
  secrétariat/trésorerie à un compte `admin`. Un admin ne voyait donc pas de lien vers des
  espaces auxquels il avait pourtant accès par URL directe. Corrigé.
- [ ] **Fiabilité des e-mails d'invitation Cognito.** Le service d'envoi par défaut de
  Cognito (adresse générique, filtré en spam, ~50 e-mails/jour) n'est pas fiable pour de
  vraies invitations. À faire avant d'inviter de vrais membres : brancher Amazon SES avec un
  domaine d'envoi vérifié (ex. `noreply@liensculturels.org`).

Détails techniques complets (IDs de ressources AWS, bugs trouvés en cours de route, schéma
des tables DynamoDB) dans la mémoire de session — demander un résumé si besoin pour une
prochaine session.

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
- [ ] **Photos de bureau encore non câblées dans `assets/img/`** — 4 fiches utilisent
  encore une image placeholder sur `bureau.html` (Stéphane ANAKPO, Ronel Jethem ATINDEHOU,
  François DREMONT, Teddy FAROT). Les photos disponibles
  (`Abdel_Kader_SALIFOU2.jpg`, `Francis DOSSOU2.jpg`, `dossou.jpg`, `Lionel_WILSON.jpg`,
  `sg.jpeg`, `sga.jpeg`, `tg.jpeg`, `tga.jpeg`, `vp.jpeg`, `pct.jpeg`, `adjointe1-orga.jpeg`)
  ne correspondent par leur nom à aucune de ces 4 personnes, et les abréviations de rôle
  (SG/SGA/TG/TGA/VP) ne correspondent à aucun rôle vacant actuel — bloqué en attente de la
  correspondance exacte photo → personne/rôle de la part de l'association (demandé le
  2026-08-08, pas encore reçu).
- [x] **Fonds de header/hero non câblés** — en creusant pour le point 26 (round 4), ces 4
  fichiers se sont révélés être des visuels de tennis de table (fédération béninoise, Centre
  Culturel Chinois) déposés par erreur depuis `tennis2table.grouperms.com` : supprimés. 2
  vraies photos sourcées sur Wikimedia Commons (licence CC BY-SA) les remplacent.

## Priorité 6 — Au-delà

- [x] **CI légère.** `.github/workflows/lint.yml` : validation HTML (Nu Html Checker) +
  vérification des liens internes cassés, sur chaque pull request.
- [🟡] **Site bilingue FR/EN.** Demandé explicitement le 8 août — n'est plus optionnel.
  Infrastructure + chrome (nav, footer) en ligne sur les 25 pages ; contenu traduit sur 5
  pages, 13 restantes. Voir point 9 du tableau de suivi ci-dessus pour le détail exact.

## Note — bug de déploiement trouvé et corrigé pendant cette session

`.github/workflows/deploy.yml` et `deploy.sh` prétendaient exclure les scripts shell du
déploiement mais le pattern `--exclude "*.sh"` manquait réellement de la liste : `deploy.sh`
s'est retrouvé publié sur le bucket public. Corrigé (pattern ajouté aux deux), et les objets
S3 orphelins (fichiers FBTT, anciennes cartes PNG, `loader.js`, `deploy.sh`) ont été
supprimés manuellement puisque le workflow de sync n'utilise volontairement pas `--delete`.
CloudFront invalidé et 404 vérifiée sur chacun de ces chemins.
