document.addEventListener('DOMContentLoaded', () => {
    // URL de base de votre API Gateway
    const API_BASE_URL = 'https://8igk1o6vw4.execute-api.eu-west-3.amazonaws.com'

    // --- Gestion du formulaire de Contact ---
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        const feedbackEl = contactForm.querySelector('.form-feedback');
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                message: document.getElementById('message').value,
            };

            fetch(`${API_BASE_URL}/contact`, {
                method: 'POST',
                body: JSON.stringify(formData),
                headers: { 'Content-Type': 'application/json' },
            })
            .then(response => {
                if (response.ok) return response.json();
                throw new Error('Network response was not ok.');
            })
            .then(data => {
                feedbackEl.textContent = 'Merci ! Votre message a bien été envoyé.';
                feedbackEl.className = 'form-feedback success';
                feedbackEl.style.display = 'block';
                contactForm.reset();
            })
            .catch(error => {
                feedbackEl.textContent = 'Une erreur est survenue. Veuillez réessayer.';
                feedbackEl.className = 'form-feedback error';
                feedbackEl.style.display = 'block';
            });
        });
    }

    // --- Gestion du formulaire d'Adhésion ---
    const adhesionForm = document.getElementById('adhesionForm');
    if (adhesionForm) {
        const feedbackEl = adhesionForm.querySelector('.form-feedback');
        adhesionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = {
                fullName: document.getElementById('fullName').value,
                address: document.getElementById('address').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
            };

            fetch(`${API_BASE_URL}/adhesion`, { // Endpoint à créer
                method: 'POST',
                body: JSON.stringify(formData),
                headers: { 'Content-Type': 'application/json' },
            })
            .then(response => {
                if (response.ok) return response.json();
                throw new Error('Network response was not ok.');
            })
            .then(data => {
                feedbackEl.innerHTML = "Votre demande d'adhésion a été envoyée !<br>Vous recevrez un email de confirmation.";
                feedbackEl.className = 'form-feedback success';
                feedbackEl.style.display = 'block';
                adhesionForm.reset();
            })
            .catch(error => {
                feedbackEl.textContent = 'Une erreur est survenue. Veuillez réessayer.';
                feedbackEl.className = 'form-feedback error';
                feedbackEl.style.display = 'block';
            });
        });
    }
});
// --- Gestion de la Vidéothèque ---
    const videoThumbnails = document.querySelectorAll('.video-thumbnail');
    if (videoThumbnails.length > 0) {
        const videoModal = document.createElement('div');
        videoModal.className = 'modal';
        videoModal.innerHTML = `
            <div class="modal-content" style="max-width: 800px; padding: 0;">
                <span class="modal-close" style="color: white; top: -30px; right: 0; font-size: 40px;">&times;</span>
                <div class="video-responsive">
                    <iframe width="560" height="315" src="" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
            </div>`;
        document.body.appendChild(videoModal);

        const iframe = videoModal.querySelector('iframe');
        const closeModal = videoModal.querySelector('.modal-close');

        videoThumbnails.forEach(thumb => {
            thumb.addEventListener('click', function(e) {
                e.preventDefault();
                const videoSrc = this.getAttribute('data-video-src');
                iframe.setAttribute('src', videoSrc + "?autoplay=1"); // Ajoute autoplay pour démarrer la vidéo
                videoModal.style.display = 'block';
            });
        });

        closeModal.onclick = function() {
            videoModal.style.display = 'none';
            iframe.setAttribute('src', ''); // Arrête la vidéo
        }
        window.onclick = function(event) {
            if (event.target == videoModal) {
                videoModal.style.display = 'none';
                iframe.setAttribute('src', ''); // Arrête la vidéo
            }
        }
    }