document.addEventListener("DOMContentLoaded", function() {
    const loadComponent = (selector, url) => {
        const element = document.querySelector(selector);
        if (element) {
            fetch(url)
                .then(response => {
                    if (response.ok) return response.text();
                    throw new Error(`Fichier non trouvé: ${url}`);
                })
                .then(data => { element.innerHTML = data; })
                .catch(error => console.error(`Erreur de chargement pour ${selector}:`, error));
        }
    };
    loadComponent("#header-placeholder", "header.html");
    loadComponent("#footer-placeholder", "footer.html");
});