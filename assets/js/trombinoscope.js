document.addEventListener("DOMContentLoaded", async () => {
    try {
        await window.LCAuth.handleRedirect();
    } catch (e) {
        console.error(e);
    }

    const loadingEl = document.getElementById("trombi-loading");
    const deniedEl = document.getElementById("trombi-denied");
    const contentEl = document.getElementById("trombi-content");
    loadingEl.style.display = "none";

    if (!window.LCAuth.isLoggedIn()) {
        deniedEl.style.display = "block";
        return;
    }
    contentEl.style.display = "block";
});
