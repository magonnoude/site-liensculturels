document.addEventListener('DOMContentLoaded', async function() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return; // Ne rien faire si l'élément #calendar n'existe pas sur la page

    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDate = document.getElementById('modalDate');
    const modalTime = document.getElementById('modalTime');
    const modalLocation = document.getElementById('modalLocation');
    const modalDescription = document.getElementById('modalDescription');
    const closeModal = document.querySelector('.modal-close');

    const API_BASE = 'https://8igk1o6vw4.execute-api.eu-west-3.amazonaws.com';
    const today = new Date().toISOString().slice(0, 10);

    let events = [];
    try {
        const resp = await fetch(`${API_BASE}/agenda`);
        if (!resp.ok) throw new Error('Erreur réseau');
        const raw = await resp.json();
        events = raw.map((e) => ({
            title: e.title,
            start: e.start,
            end: e.end,
            description: e.description,
            time: e.time,
            location: e.location,
            classNames: e.start < today ? ['event-past'] : [],
        }));
    } catch (err) {
        console.error('Impossible de charger l\'agenda :', err);
        calendarEl.insertAdjacentHTML('beforebegin', '<p style="text-align:center;color:#c0392b;">Impossible de charger l\'agenda pour le moment.</p>');
    }

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