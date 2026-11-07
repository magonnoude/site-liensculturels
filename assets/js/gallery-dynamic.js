document.addEventListener("DOMContentLoaded", async () => {
    const API_BASE = "https://api.liensculturels.org";

    const photoContainer = document.getElementById("dynamic-gallery");
    if (photoContainer) {
        try {
            const items = await fetch(`${API_BASE}/gallery?type=photo`).then((r) => r.json());
            if (items.length) {
                const titleEl = document.getElementById("dynamic-gallery-title");
                if (titleEl) titleEl.style.display = "block";
                items.forEach((item) => {
                    const div = document.createElement("div");
                    div.className = "photo-item";
                    div.dataset.category = item.title;
                    div.innerHTML = `
                        <a href="${item.imageUrl}" data-lightbox="gallery" data-title="${item.title}">
                            <img src="${item.imageUrl}" alt="${item.title}" loading="lazy">
                        </a>`;
                    photoContainer.appendChild(div);
                });

                // Filtres par catégorie (= le titre donné au lot de photos, ex. un album/événement).
                const categories = [...new Set(items.map((item) => item.title))];
                const filtersEl = document.getElementById("gallery-filters");
                if (filtersEl && categories.length > 1) {
                    filtersEl.style.display = "flex";
                    const allBtn = document.createElement("button");
                    allBtn.type = "button";
                    allBtn.className = "gallery-filter-btn active";
                    allBtn.textContent = "Tous";
                    filtersEl.appendChild(allBtn);
                    categories.forEach((cat) => {
                        const btn = document.createElement("button");
                        btn.type = "button";
                        btn.className = "gallery-filter-btn";
                        btn.textContent = cat;
                        filtersEl.appendChild(btn);
                    });
                    filtersEl.addEventListener("click", (e) => {
                        const btn = e.target.closest(".gallery-filter-btn");
                        if (!btn) return;
                        filtersEl.querySelectorAll(".gallery-filter-btn").forEach((b) => b.classList.remove("active"));
                        btn.classList.add("active");
                        const cat = btn === allBtn ? null : btn.textContent;
                        photoContainer.querySelectorAll(".photo-item").forEach((div) => {
                            div.style.display = !cat || div.dataset.category === cat ? "" : "none";
                        });
                    });
                }
            }
        } catch (e) {
            console.error("Impossible de charger la galerie :", e);
        }
    }

    const videoContainer = document.getElementById("dynamic-video-gallery");
    if (videoContainer) {
        try {
            const items = await fetch(`${API_BASE}/gallery?type=video`).then((r) => r.json());
            const modal = document.querySelector(".modal");
            const iframe = modal ? modal.querySelector("iframe") : null;
            if (items.length) {
                const titleEl = document.getElementById("dynamic-video-gallery-title");
                if (titleEl) titleEl.style.display = "block";
            }
            items.forEach((item) => {
                const div = document.createElement("div");
                div.className = "gallery-item";
                div.innerHTML = `
                    <a href="#" class="video-thumbnail" data-video-src="${item.videoUrl}">
                        <img src="${item.thumbnailUrl || "assets/img/logo.png"}" alt="${item.title}" loading="lazy">
                    </a>
                    <p>${item.title}</p>`;
                videoContainer.appendChild(div);
                if (modal && iframe) {
                    div.querySelector(".video-thumbnail").addEventListener("click", (e) => {
                        e.preventDefault();
                        // Fichier hébergé directement (MP4) : le navigateur affiche son propre lecteur dans l'iframe,
                        // "?autoplay=1" n'a de sens que pour un lien YouTube.
                        iframe.setAttribute("src", item.direct ? item.videoUrl : item.videoUrl + "?autoplay=1");
                        modal.style.display = "block";
                    });
                }
            });
        } catch (e) {
            console.error("Impossible de charger la vidéothèque :", e);
        }
    }
});
