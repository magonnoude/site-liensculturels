/*
 * Cognito Hosted UI auth helper (authorization code + PKCE), shared by every
 * gated portal page (espace-membre, admin, secretariat, tresorerie).
 * No build step on this site, so this is a plain global: window.LCAuth.
 */
(function () {
    const CONFIG = {
        domain: "https://liensculturels-membres.auth.eu-west-3.amazoncognito.com",
        clientId: "757mjbo05rlabup4kkai470d86",
        region: "eu-west-3",
        apiBase: "https://8igk1o6vw4.execute-api.eu-west-3.amazonaws.com",
        scope: "openid email profile",
    };

    const STORAGE_KEY = "lc_auth_tokens";
    const VERIFIER_KEY = "lc_pkce_verifier";

    function redirectUri() {
        return window.location.origin + window.location.pathname;
    }

    function base64UrlEncode(bytes) {
        let str = btoa(String.fromCharCode(...new Uint8Array(bytes)));
        return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }

    function randomVerifier() {
        const bytes = new Uint8Array(64);
        crypto.getRandomValues(bytes);
        return base64UrlEncode(bytes);
    }

    async function challengeFromVerifier(verifier) {
        const data = new TextEncoder().encode(verifier);
        const digest = await crypto.subtle.digest("SHA-256", data);
        return base64UrlEncode(digest);
    }

    function decodeJwt(token) {
        try {
            const payload = token.split(".")[1];
            const json = decodeURIComponent(
                atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
                    .split("")
                    .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
                    .join("")
            );
            return JSON.parse(json);
        } catch (e) {
            return null;
        }
    }

    function saveTokens(tokens) {
        const claims = decodeJwt(tokens.id_token);
        sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...tokens, expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000, claims })
        );
    }

    function getTokens() {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    async function login() {
        const verifier = randomVerifier();
        sessionStorage.setItem(VERIFIER_KEY, verifier);
        const challenge = await challengeFromVerifier(verifier);
        const params = new URLSearchParams({
            response_type: "code",
            client_id: CONFIG.clientId,
            redirect_uri: redirectUri(),
            scope: CONFIG.scope,
            code_challenge: challenge,
            code_challenge_method: "S256",
        });
        window.location.href = `${CONFIG.domain}/oauth2/authorize?${params.toString()}`;
    }

    async function exchangeCodeForTokens(code) {
        const verifier = sessionStorage.getItem(VERIFIER_KEY);
        const body = new URLSearchParams({
            grant_type: "authorization_code",
            client_id: CONFIG.clientId,
            code,
            redirect_uri: redirectUri(),
            code_verifier: verifier || "",
        });
        const resp = await fetch(`${CONFIG.domain}/oauth2/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString(),
        });
        if (!resp.ok) throw new Error("Échec de l'échange du code d'autorisation.");
        const tokens = await resp.json();
        saveTokens(tokens);
        sessionStorage.removeItem(VERIFIER_KEY);
    }

    async function handleRedirect() {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (!code) return false;
        await exchangeCodeForTokens(code);
        url.searchParams.delete("code");
        url.searchParams.delete("state");
        window.history.replaceState({}, document.title, url.pathname);
        return true;
    }

    function isLoggedIn() {
        const t = getTokens();
        return !!(t && t.id_token && t.expiresAt > Date.now());
    }

    function getIdToken() {
        const t = getTokens();
        if (!t || t.expiresAt <= Date.now()) return null;
        return t.id_token;
    }

    function getClaims() {
        const t = getTokens();
        return t ? t.claims : null;
    }

    function hasGroup(name) {
        const claims = getClaims();
        const groups = (claims && claims["cognito:groups"]) || [];
        return groups.includes(name);
    }

    function getDisplayName() {
        const claims = getClaims();
        return (claims && claims.name) || "";
    }

    function logout() {
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(VERIFIER_KEY);
        const params = new URLSearchParams({
            client_id: CONFIG.clientId,
            logout_uri: redirectUri(),
        });
        window.location.href = `${CONFIG.domain}/logout?${params.toString()}`;
    }

    async function apiFetch(path, options = {}) {
        const token = getIdToken();
        if (!token) throw new Error("Non authentifié.");
        const resp = await fetch(CONFIG.apiBase + path, {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${token}`,
            },
        });
        return resp;
    }

    window.LCAuth = {
        login,
        logout,
        handleRedirect,
        isLoggedIn,
        getIdToken,
        getClaims,
        hasGroup,
        getDisplayName,
        apiFetch,
    };
})();
