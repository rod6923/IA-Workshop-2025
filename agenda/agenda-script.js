document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO CALENDÁRIO ---
    const currentMonthYear = document.getElementById('current-month-year');
    const calendarDates = document.getElementById('calendar-dates');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const eventDateTitle = document.getElementById('event-date-title');
    const eventList = document.getElementById('event-list');
    const addEventBtn = document.getElementById('add-event-btn');

    // --- ELEMENTOS DO MODAL ---
    const modal = document.getElementById('add-event-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalDateDisplay = document.getElementById('modal-date-display');
    const eventForm = document.getElementById('event-form');
    const eventNameInput = document.getElementById('event-name');
    const eventTimeInput = document.getElementById('event-time');

    let date = new Date();
    let selectedDateString = null; // Armazena a data selecionada atualmente

    let events = {
        '2025-10-15': [{ time: '10:00', name: 'Workshop: IA Generativa' }, { time: '14:00', name: 'Palestra: Estética Digital' }],
        '2025-10-17': [{ time: '09:00', name: 'Apresentação de Projetos' }, { time: '18:00', name: 'Festa de Encerramento' }],
        '2025-10-22': [{ time: '19:00', name: 'Live: Análise de Portfólios' }]
    };

    const renderCalendar = () => {
        const month = date.getMonth();
        const year = date.getFullYear();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
        const lastDateOfLastMonth = new Date(year, month, 0).getDate();
        const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        currentMonthYear.innerText = `${months[month]} ${year}`;
        calendarDates.innerHTML = '';
        let totalCells = 42;
        let renderedDays = 0;

        for (let i = firstDayOfMonth; i > 0; i--) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('date-cell', 'inactive');
            dayCell.innerText = lastDateOfLastMonth - i + 1;
            calendarDates.appendChild(dayCell);
            renderedDays++;
        }

        for (let i = 1; i <= lastDateOfMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('date-cell');
            const daySpan = document.createElement('span');
            daySpan.innerText = i;
            dayCell.appendChild(daySpan);
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            dayCell.addEventListener('click', () => showEvents(dateString, i, months[month]));
            
            if (i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
                dayCell.classList.add('today');
            }
            if (events[dateString]) {
                dayCell.classList.add('has-event');
                const eventIndicator = document.createElement('span');
                eventIndicator.classList.add('event-indicator');
                eventIndicator.innerText = '🎉';
                dayCell.appendChild(eventIndicator);
            }
            calendarDates.appendChild(dayCell);
            renderedDays++;
        }

        for (let i = 1; i <= (totalCells - renderedDays); i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('date-cell', 'inactive');
            dayCell.innerText = i;
            calendarDates.appendChild(dayCell);
        }
    };
    
    const showEvents = (dateString, day, month) => {
        selectedDateString = dateString; // Guarda a data selecionada
        document.querySelectorAll('.date-cell.active').forEach(cell => cell.classList.remove('active'));
        document.querySelectorAll('.date-cell').forEach(cell => {
            if (!cell.classList.contains('inactive') && parseInt(cell.textContent) === day) {
                cell.classList.add('active');
            }
        });

        const dayEvents = events[dateString];
        eventDateTitle.innerText = `Eventos de ${day} de ${month}`;
        eventList.innerHTML = '';
        if (dayEvents && dayEvents.length > 0) {
            dayEvents.forEach(event => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="event-time">${event.time}</span> ${event.name}`;
                eventList.appendChild(li);
            });
        } else {
            eventList.innerHTML = '<li>Nenhum evento agendado.</li>';
        }
        addEventBtn.classList.remove('hidden'); // Mostra o botão para adicionar evento
    };
    
    // --- LÓGICA DO MODAL ---
    const showModal = () => {
        const [year, month, day] = selectedDateString.split('-');
        modalDateDisplay.innerText = `Adicionando evento para: ${day}/${month}/${year}`;
        modal.classList.remove('hidden');
    }

    const hideModal = () => {
        modal.classList.add('hidden');
        eventForm.reset();
    }

    addEventBtn.addEventListener('click', showModal);
    modalCloseBtn.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideModal();
    });

    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newEvent = {
            time: eventTimeInput.value,
            name: eventNameInput.value
        };
        if (!events[selectedDateString]) {
            events[selectedDateString] = [];
        }
        events[selectedDateString].push(newEvent);
        hideModal();
        renderCalendar();
        // Atualiza a lista de eventos para mostrar o que acabou de ser adicionado
        const [year, month, day] = selectedDateString.split('-').map(Number);
        const monthName = new Date(year, month-1, day).toLocaleString('pt-br', { month: 'long' });
        showEvents(selectedDateString, day, monthName.charAt(0).toUpperCase() + monthName.slice(1));
    });

    // --- NAVEGAÇÃO DO CALENDÁRIO ---
    prevMonthBtn.addEventListener('click', () => { date.setMonth(date.getMonth() - 1); renderCalendar(); });
    nextMonthBtn.addEventListener('click', () => { date.setMonth(date.getMonth() + 1); renderCalendar(); });

    renderCalendar();
});