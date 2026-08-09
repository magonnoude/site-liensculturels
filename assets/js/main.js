document.addEventListener('DOMContentLoaded', () => {
    // URL de base de votre API Gateway
    const API_BASE_URL = 'https://8igk1o6vw4.execute-api.eu-west-3.amazonaws.com'

    // --- Gestion du formulaire Newsletter (AWS SES, double opt-in) ---
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        const feedbackEl = newsletterForm.querySelector('.form-feedback');
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('newsletterEmail').value;

            fetch(`${API_BASE_URL}/newsletter/subscribe`, {
                method: 'POST',
                body: JSON.stringify({ email }),
                headers: { 'Content-Type': 'application/json' },
            })
            .then(response => {
                if (response.ok) return response.json();
                throw new Error('Network response was not ok.');
            })
            .then(() => {
                window.location.href = 'merci-newsletter.html';
            })
            .catch(() => {
                if (feedbackEl) {
                    feedbackEl.textContent = 'Une erreur est survenue. Veuillez réessayer.';
                    feedbackEl.className = 'form-feedback newsletter-feedback error';
                    feedbackEl.style.display = 'block';
                }
            });
        });
    }

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
        const emailEl = document.getElementById('email');
        const emailErrorEl = document.getElementById('email-error');

        // Civilité en double (FR/EN, jamais de <option> masquée — convention du
        // site). #civilite reste la seule source de vérité pour la soumission.
        const civiliteFr = document.getElementById('civilite');
        const civiliteEn = document.getElementById('civiliteEn');
        if (civiliteFr && civiliteEn) {
            civiliteEn.addEventListener('change', () => { civiliteFr.value = civiliteEn.value; });
            civiliteFr.addEventListener('change', () => { civiliteEn.value = civiliteFr.value; });
        }

        // Indicatif pays du téléphone, peuplé depuis assets/js/country-codes.js.
        const countryCodeEl = document.getElementById('phoneCountryCode');
        if (countryCodeEl && window.LC_COUNTRY_CODES) {
            window.LC_COUNTRY_CODES.forEach((c) => {
                const opt = document.createElement('option');
                opt.value = c.dial;
                opt.textContent = `${c.name} (${c.dial})`;
                countryCodeEl.appendChild(opt);
            });
        }

        function isValidEmail(value) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }

        // --- Membres de la famille (visible uniquement pour le pack "famille") ---
        const membershipTypeElForFamily = document.getElementById('membershipType');
        const familySection = document.getElementById('familyMembersSection');
        const familyList = document.getElementById('familyMembersList');
        const addFamilyMemberBtn = document.getElementById('addFamilyMemberBtn');

        function addFamilyMemberRow() {
            const row = document.createElement('div');
            row.className = 'family-member-row';
            row.innerHTML = `
                <input type="text" class="fm-prenom" placeholder="Prénom">
                <input type="text" class="fm-nom" placeholder="Nom">
                <select class="fm-lien">
                    <option value="conjoint">Conjoint(e)</option>
                    <option value="enfant">Enfant</option>
                    <option value="parent">Parent</option>
                    <option value="autre">Autre</option>
                </select>
                <button type="button" class="fm-remove">&times;</button>
            `;
            row.querySelector('.fm-remove').addEventListener('click', () => row.remove());
            familyList.appendChild(row);
        }

        function toggleFamilySection() {
            if (!membershipTypeElForFamily || !familySection) return;
            const isFamille = membershipTypeElForFamily.value === 'famille';
            familySection.style.display = isFamille ? 'block' : 'none';
            if (isFamille && familyList.children.length === 0) {
                addFamilyMemberRow();
            }
        }

        const membershipTypeEnForFamily = document.getElementById('membershipTypeEn');
        if (membershipTypeElForFamily) {
            membershipTypeElForFamily.addEventListener('change', toggleFamilySection);
            // #membershipTypeEn only updates #membershipType's *value* via the sync
            // listener in payment.js (a scripted .value assignment, which does not
            // itself dispatch a "change" event) — listen here too or switching via
            // the English dropdown would leave this section stuck in the wrong state.
            if (membershipTypeEnForFamily) {
                membershipTypeEnForFamily.addEventListener('change', toggleFamilySection);
            }
            toggleFamilySection();
        }
        if (addFamilyMemberBtn) {
            addFamilyMemberBtn.addEventListener('click', addFamilyMemberRow);
        }

        function collectFamilyMembers() {
            if (!familySection || familySection.style.display === 'none') return [];
            return Array.from(familyList.querySelectorAll('.family-member-row'))
                .map((row) => ({
                    prenom: row.querySelector('.fm-prenom').value.trim(),
                    nom: row.querySelector('.fm-nom').value.trim(),
                    lien: row.querySelector('.fm-lien').value,
                }))
                .filter((m) => m.prenom || m.nom);
        }

        adhesionForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (!isValidEmail(emailEl.value.trim())) {
                emailErrorEl.textContent = "Merci de saisir une adresse e-mail valide.";
                emailErrorEl.style.display = 'inline';
                emailEl.focus();
                return;
            }
            emailErrorEl.style.display = 'none';

            const membershipTypeEl = document.getElementById('membershipType');
            const prenom = document.getElementById('prenom').value.trim();
            const nom = document.getElementById('nom').value.trim();
            const civilite = civiliteFr ? civiliteFr.value : '';
            const countryCode = countryCodeEl ? countryCodeEl.value : '';
            const localPhone = document.getElementById('phone').value.trim();
            const newsletterOptinEl = document.getElementById('newsletterOptin');
            const email = emailEl.value.trim();

            const formData = {
                civilite,
                prenom,
                nom,
                fullName: `${civilite} ${prenom} ${nom}`.trim(),
                address: document.getElementById('address').value,
                email,
                phone: `${countryCode} ${localPhone}`.trim(),
                membershipType: membershipTypeEl ? membershipTypeEl.value : undefined,
                familyMembers: collectFamilyMembers(),
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

                if (newsletterOptinEl && newsletterOptinEl.checked) {
                    fetch(`${API_BASE_URL}/newsletter/subscribe`, {
                        method: 'POST',
                        body: JSON.stringify({ email }),
                        headers: { 'Content-Type': 'application/json' },
                    }).catch(() => {}); // best-effort — ne bloque pas la confirmation d'adhésion
                }

                adhesionForm.reset();
                if (familyList) familyList.innerHTML = '';
                toggleFamilySection();
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