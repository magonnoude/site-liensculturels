/*
 * Service worker minimal (B8 — installabilité PWA). Sans lui, aucun navigateur ne propose
 * l'installation, même avec un manifest valide.
 *
 * Stratégie volontairement simple : réseau d'abord, cache uniquement en secours hors ligne.
 * Le déploiement du site fixe explicitement `no-cache` sur tout le HTML pour que les mises
 * à jour soient visibles immédiatement (voir deploy.yml) — un service worker qui mettrait le
 * HTML en cache agressivement irait à l'encontre de ce choix. Pas de précache d'une liste
 * figée de fichiers non plus : le cache se remplit au fil de la navigation réelle.
 */
const CACHE_NAME = "lc-runtime-v1";

self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    // Ne jamais intercepter le cross-origin (Font Awesome sur cdnjs, API Gateway, Cognito
    // Hosted UI...) : re-fetch depuis le service worker cassait leur chargement
    // (net::ERR_FAILED constaté en conditions réelles) — laisser le navigateur les gérer
    // exactement comme sans service worker.
    if (new URL(event.request.url).origin !== self.location.origin) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
