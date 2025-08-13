document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return; // Ne rien faire si l'élément #calendar n'existe pas sur la page

    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDate = document.getElementById('modalDate');
    const modalTime = document.getElementById('modalTime');
    const modalLocation = document.getElementById('modalLocation');
    const modalDescription = document.getElementById('modalDescription');
    const closeModal = document.querySelector('.modal-close');

    const events = [
        { title: 'Assemblée Générale Constitutive', start: '2025-02-27', description: "Moment fondateur de l'association. Adoption des statuts et élection du premier bureau.", time: '16:00', location: 'Domaine de l\'Hermitage, Nogent l\'Artaud', classNames: ['event-past'] },
        { title: 'Voyage de Jumelage (Phase 1)', start: '2025-03-15', end: '2025-03-22', description: "Premier voyage de découverte et de préparation du jumelage entre Nogent l'Artaud et Savè.", location: 'Savè, Bénin', classNames: ['event-past'] },
        { title: 'Déclaration en préfecture', start: '2025-05-31', description: "Dépôt officiel des statuts à la sous-préfecture de Château-Thierry.", location: 'Sous-préfecture', classNames: ['event-past'] },
        { title: 'Publication au Journal Officiel', start: '2025-06-10', description: "Naissance officielle de l'association avec sa publication au JOAFE.", location: 'Journal Officiel', classNames: ['event-past'] },
        { title: 'Réunion du C.A.', start: '2025-07-07', description: "Réunion du Conseil d'Administration pour la correction du nom de l'association.", time: '16:30', location: 'Nogent-L\'Artaud', classNames: ['event-past'] },
        { title: 'Soirée Béninoise', start: '2025-08-09', description: "Soirée de présentation de la culture béninoise, avec dégustation, musique et danse.", time: '19:00', location: 'Salle des fêtes, Nogent l\'Artaud' },
        { title: 'Réunion du bureau', start: '2025-09-02', description: "Réunion mensuelle du bureau, ouverte aux membres.", time: '18:30', location: 'Siège de l\'association' },
        { title: 'Vente pour le jumelage', start: '2025-09-28', description: "Stand au marché local pour vendre gâteaux et artisanat afin de financer nos projets.", time: '10:00 - 17:00', location: 'Place du marché, Nogent l\'Artaud' },
        { title: 'Atelier Cuisine', start: '2025-10-18', description: "Atelier de cuisine Franco-Béninoise. Inscription obligatoire.", time: '14:00', location: 'À définir' }
    ];

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'fr',
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' },
        buttonText: { today: 'Aujourd\'hui', month: 'Mois', week: 'Semaine', list: 'Liste' },
        events: events,
        eventClick: function(info) {
            info.jsEvent.preventDefault();
            modalTitle.textContent = info.event.title;
            modalDate.textContent = info.event.start.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            modalTime.textContent = info.event.extendedProps.time || 'Toute la journée';
            modalLocation.textContent = info.event.extendedProps.location || 'Non spécifié';
            modalDescription.textContent = info.event.extendedProps.description || 'Aucune description disponible.';
            modal.style.display = "block";
        }
    });

    calendar.render();

    closeModal.onclick = () => { modal.style.display = "none"; }
    window.onclick = (event) => { if (event.target == modal) { modal.style.display = "none"; } }
});