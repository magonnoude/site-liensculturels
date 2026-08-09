document.addEventListener("DOMContentLoaded", async () => {
    try {
        await window.LCAuth.handleRedirect();
    } catch (e) {
        console.error(e);
    }

    const loadingEl = document.getElementById("guide-loading");
    const deniedEl = document.getElementById("guide-denied");
    const contentEl = document.getElementById("guide-content");
    loadingEl.style.display = "none";

    if (!window.LCAuth.isLoggedIn()) {
        deniedEl.style.display = "block";
        return;
    }
    contentEl.style.display = "block";
});
