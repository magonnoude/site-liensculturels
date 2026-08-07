document.addEventListener("DOMContentLoaded", async () => {
    const API_BASE = "https://8igk1o6vw4.execute-api.eu-west-3.amazonaws.com";

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
                    div.innerHTML = `
                        <a href="${item.imageUrl}" data-lightbox="gallery" data-title="${item.title}">
                            <img src="${item.imageUrl}" alt="${item.title}" loading="lazy">
                        </a>`;
                    photoContainer.appendChild(div);
                });
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
                        iframe.setAttribute("src", item.videoUrl + "?autoplay=1");
                        modal.style.display = "block";
                    });
                }
            });
        } catch (e) {
            console.error("Impossible de charger la vidéothèque :", e);
        }
    }
});
