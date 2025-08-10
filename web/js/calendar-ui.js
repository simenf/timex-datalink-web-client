// Calendar UI Component for Local Calendar
// Provides Windows 98 style calendar interface

import { LocalCalendar } from './local-calendar.js';

export class CalendarUI {
    constructor(windowManager) {
        this.calendar = new LocalCalendar();
        this.windowManager = windowManager;
        this.calendarWindow = null;
        this.currentView = 'month'; // month, week, day
        this.selectedDate = new Date();
        this.currentDate = new Date();
        
        // Event handlers
        this.onEventSelect = null;
        this.onEventsChange = null;
    }
    
    // Open the calendar window
    openCalendar() {
        console.log('CalendarUI: openCalendar() called');
        
        if (this.calendarWindow) {
            console.log('CalendarUI: Window already exists, bringing to front');
            // Bring existing window to front
            this.windowManager.bringToFront(this.calendarWindow);
            return this.calendarWindow;
        }
        
        console.log('CalendarUI: Creating new calendar window');
        
        if (!this.windowManager) {
            console.error('CalendarUI: windowManager is not available');
            throw new Error('Window manager is not available');
        }
        
        const calendarContent = this.createCalendarContent();
        console.log('CalendarUI: Calendar content created');
        
        this.calendarWindow = this.windowManager.createWindow({
            title: 'Local Calendar',
            content: calendarContent,
            width: '600px',
            height: '500px',
            left: '50px',
            top: '50px'
        });
        
        console.log('CalendarUI: Window created:', this.calendarWindow);
        
        if (!this.calendarWindow) {
            console.error('CalendarUI: Failed to create window');
            throw new Error('Failed to create calendar window');
        }
        
        // Add calendar-specific styling
        this.calendarWindow.classList.add('calendar-window');
        
        // Initialize calendar UI
        console.log('CalendarUI: Initializing calendar UI');
        this.initializeCalendarUI();
        
        // Handle window close
        const closeBtn = this.calendarWindow.querySelector('.title-bar-controls button:last-child');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                console.log('CalendarUI: Close button clicked');
                e.stopPropagation(); // Prevent event bubbling
                this.calendarWindow = null;
            });
        } else {
            console.warn('CalendarUI: Close button not found');
        }
        
        // Center the window if it's positioned too low
        this.ensureWindowVisible();
        
        console.log('CalendarUI: Calendar window setup complete');
        return this.calendarWindow;
    }
    
    // Create the calendar content HTML
    createCalendarContent() {
        return `
            <div class="calendar-container">
                <div class="calendar-toolbar">
                    <div class="calendar-nav">
                        <button class="btn small" id="cal-prev-btn">&lt;</button>
                        <span class="calendar-title" id="cal-title">Loading...</span>
                        <button class="btn small" id="cal-next-btn">&gt;</button>
                    </div>
                    <div class="calendar-controls">
                        <button class="btn small" id="cal-today-btn">Today</button>
                        <div class="view-buttons">
                            <button class="btn small active" id="cal-month-btn">Month</button>
                            <button class="btn small" id="cal-week-btn">Week</button>
                            <button class="btn small" id="cal-day-btn">Day</button>
                        </div>
                    </div>
                </div>
                
                <div class="calendar-main">
                    <div class="calendar-view" id="calendar-view">
                        <!-- Calendar grid will be inserted here -->
                    </div>
                    
                    <div class="calendar-sidebar">
                        <div class="event-form">
                            <fieldset>
                                <legend>Add/Edit Event</legend>
                                <div class="form-row">
                                    <label for="event-title">Title:</label>
                                    <input type="text" id="event-title" maxlength="50" placeholder="Event title">
                                </div>
                                <div class="form-row">
                                    <label for="event-date">Date:</label>
                                    <input type="date" id="event-date">
                                </div>
                                <div class="form-row">
                                    <label>
                                        <input type="checkbox" id="event-all-day"> All Day
                                    </label>
                                </div>
                                <div class="time-inputs" id="time-inputs">
                                    <div class="form-row">
                                        <label for="event-start-time">Start:</label>
                                        <input type="time" id="event-start-time">
                                    </div>
                                    <div class="form-row">
                                        <label for="event-end-time">End:</label>
                                        <input type="time" id="event-end-time">
                                    </div>
                                </div>
                                <div class="form-row">
                                    <label for="event-description">Description:</label>
                                    <textarea id="event-description" rows="3" maxlength="200" placeholder="Optional description"></textarea>
                                </div>
                                <div class="form-actions">
                                    <button class="btn default" id="save-event-btn">Save Event</button>
                                    <button class="btn" id="clear-form-btn">Clear</button>
                                    <button class="btn" id="delete-event-btn" style="display: none;">Delete</button>
                                </div>
                            </fieldset>
                        </div>
                        
                        <div class="event-list">
                            <fieldset>
                                <legend>Today's Events</legend>
                                <div id="todays-events" class="events-list">
                                    <!-- Today's events will be listed here -->
                                </div>
                            </fieldset>
                        </div>
                        
                        <div class="calendar-actions">
                            <fieldset>
                                <legend>Actions</legend>
                                <div class="form-actions">
                                    <button class="btn" id="sync-to-watch-btn">Sync to Watch</button>
                                    <button class="btn small" id="export-events-btn">Export</button>
                                    <button class="btn small" id="import-events-btn">Import</button>
                                </div>
                                <input type="file" id="import-file" accept=".json" style="display: none;">
                            </fieldset>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Initialize calendar UI event handlers
    initializeCalendarUI() {
        // Navigation buttons
        const prevBtn = this.calendarWindow.querySelector('#cal-prev-btn');
        const nextBtn = this.calendarWindow.querySelector('#cal-next-btn');
        const todayBtn = this.calendarWindow.querySelector('#cal-today-btn');
        
        prevBtn.addEventListener('click', () => this.navigatePrevious());
        nextBtn.addEventListener('click', () => this.navigateNext());
        todayBtn.addEventListener('click', () => this.goToToday());
        
        // View buttons
        const monthBtn = this.calendarWindow.querySelector('#cal-month-btn');
        const weekBtn = this.calendarWindow.querySelector('#cal-week-btn');
        const dayBtn = this.calendarWindow.querySelector('#cal-day-btn');
        
        monthBtn.addEventListener('click', () => this.setView('month'));
        weekBtn.addEventListener('click', () => this.setView('week'));
        dayBtn.addEventListener('click', () => this.setView('day'));
        
        // Event form
        const saveBtn = this.calendarWindow.querySelector('#save-event-btn');
        const clearBtn = this.calendarWindow.querySelector('#clear-form-btn');
        const deleteBtn = this.calendarWindow.querySelector('#delete-event-btn');
        const allDayCheckbox = this.calendarWindow.querySelector('#event-all-day');
        
        saveBtn.addEventListener('click', () => this.saveEvent());
        clearBtn.addEventListener('click', () => this.clearForm());
        deleteBtn.addEventListener('click', () => this.deleteCurrentEvent());
        allDayCheckbox.addEventListener('change', () => this.toggleTimeInputs());
        
        // Action buttons
        const syncBtn = this.calendarWindow.querySelector('#sync-to-watch-btn');
        const exportBtn = this.calendarWindow.querySelector('#export-events-btn');
        const importBtn = this.calendarWindow.querySelector('#import-events-btn');
        const importFile = this.calendarWindow.querySelector('#import-file');
        
        syncBtn.addEventListener('click', () => this.syncToWatch());
        exportBtn.addEventListener('click', () => this.exportEvents());
        importBtn.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', (e) => this.importEvents(e));
        
        // Initialize view
        this.updateCalendarView();
        this.updateTodaysEvents();
        this.setCurrentDate();
    }
    
    // Set current date in form
    setCurrentDate() {
        const dateInput = this.calendarWindow.querySelector('#event-date');
        const today = new Date();
        dateInput.value = this.formatDateForInput(today);
    }
    
    // Navigate to previous period
    navigatePrevious() {
        switch (this.currentView) {
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() - 7);
                break;
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() - 1);
                break;
        }
        this.updateCalendarView();
    }
    
    // Navigate to next period
    navigateNext() {
        switch (this.currentView) {
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() + 7);
                break;
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() + 1);
                break;
        }
        this.updateCalendarView();
    }
    
    // Go to today
    goToToday() {
        this.currentDate = new Date();
        this.updateCalendarView();
    }
    
    // Set calendar view
    setView(view) {
        this.currentView = view;
        
        // Update button states
        const buttons = this.calendarWindow.querySelectorAll('.view-buttons button');
        buttons.forEach(btn => btn.classList.remove('active'));
        this.calendarWindow.querySelector(`#cal-${view}-btn`).classList.add('active');
        
        this.updateCalendarView();
    }
    
    // Update calendar view
    updateCalendarView() {
        const titleElement = this.calendarWindow.querySelector('#cal-title');
        const viewElement = this.calendarWindow.querySelector('#calendar-view');
        
        switch (this.currentView) {
            case 'month':
                titleElement.textContent = this.currentDate.toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                });
                viewElement.innerHTML = this.createMonthView();
                break;
            case 'week':
                const weekStart = this.getWeekStart(this.currentDate);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                titleElement.textContent = `${weekStart.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                })} - ${weekEnd.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                })}`;
                viewElement.innerHTML = this.createWeekView();
                break;
            case 'day':
                titleElement.textContent = this.currentDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                });
                viewElement.innerHTML = this.createDayView();
                break;
        }
        
        this.attachCalendarEventHandlers();
    }
    
    // Create month view HTML
    createMonthView() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = this.getWeekStart(firstDay);
        
        let html = `
            <div class="month-view">
                <div class="month-header">
                    <div class="day-header">Sun</div>
                    <div class="day-header">Mon</div>
                    <div class="day-header">Tue</div>
                    <div class="day-header">Wed</div>
                    <div class="day-header">Thu</div>
                    <div class="day-header">Fri</div>
                    <div class="day-header">Sat</div>
                </div>
                <div class="month-grid">
        `;
        
        const currentDate = new Date(startDate);
        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                const isCurrentMonth = currentDate.getMonth() === month;
                const isToday = this.isSameDay(currentDate, new Date());
                const events = this.calendar.getEventsForDate(currentDate);
                
                html += `
                    <div class="calendar-day ${isCurrentMonth ? 'current-month' : 'other-month'} ${isToday ? 'today' : ''}" 
                         data-date="${this.formatDateForInput(currentDate)}">
                        <div class="day-number">${currentDate.getDate()}</div>
                        <div class="day-events">
                            ${events.slice(0, 3).map(event => 
                                `<div class="event-dot" title="${event.title}">${event.title.substring(0, 8)}</div>`
                            ).join('')}
                            ${events.length > 3 ? `<div class="event-more">+${events.length - 3}</div>` : ''}
                        </div>
                    </div>
                `;
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }
    
    // Create week view HTML (simplified)
    createWeekView() {
        return '<div class="week-view"><p>Week view - Coming soon</p></div>';
    }
    
    // Create day view HTML (simplified)
    createDayView() {
        const events = this.calendar.getEventsForDate(this.currentDate);
        
        let html = `
            <div class="day-view">
                <div class="day-events-list">
        `;
        
        if (events.length === 0) {
            html += '<div class="no-events">No events for this day</div>';
        } else {
            events.forEach(event => {
                const timeStr = event.allDay ? 'All Day' : 
                    event.startTime ? event.startTime.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit', 
                        hour12: true 
                    }) : '';
                
                html += `
                    <div class="day-event" data-event-id="${event.id}">
                        <div class="event-time">${timeStr}</div>
                        <div class="event-title">${event.title}</div>
                        <div class="event-description">${event.description}</div>
                    </div>
                `;
            });
        }
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }
    
    // Attach event handlers to calendar elements
    attachCalendarEventHandlers() {
        // Day click handlers
        const dayElements = this.calendarWindow.querySelectorAll('.calendar-day');
        dayElements.forEach(dayEl => {
            dayEl.addEventListener('click', (e) => {
                const dateStr = dayEl.dataset.date;
                this.selectDate(new Date(dateStr));
            });
        });
        
        // Event click handlers
        const eventElements = this.calendarWindow.querySelectorAll('.day-event');
        eventElements.forEach(eventEl => {
            eventEl.addEventListener('click', (e) => {
                const eventId = parseFloat(eventEl.dataset.eventId);
                this.selectEvent(eventId);
            });
        });
    }
    
    // Select a date
    selectDate(date) {
        // Handle date string properly to avoid timezone issues
        this.selectedDate = this.parseDateString(date);
        const dateInput = this.calendarWindow.querySelector('#event-date');
        dateInput.value = this.formatDateForInput(this.selectedDate);
        this.clearForm();
    }
    
    // Select an event for editing
    selectEvent(eventId) {
        const event = this.calendar.events.find(e => e.id === eventId);
        if (!event) return;
        
        // Populate form with event data
        const titleInput = this.calendarWindow.querySelector('#event-title');
        const dateInput = this.calendarWindow.querySelector('#event-date');
        const allDayCheckbox = this.calendarWindow.querySelector('#event-all-day');
        const startTimeInput = this.calendarWindow.querySelector('#event-start-time');
        const endTimeInput = this.calendarWindow.querySelector('#event-end-time');
        const descriptionInput = this.calendarWindow.querySelector('#event-description');
        const deleteBtn = this.calendarWindow.querySelector('#delete-event-btn');
        
        titleInput.value = event.title;
        dateInput.value = event.date.toISOString().split('T')[0];
        allDayCheckbox.checked = event.allDay;
        descriptionInput.value = event.description;
        
        if (!event.allDay && event.startTime) {
            startTimeInput.value = event.startTime.toTimeString().substring(0, 5);
        }
        if (!event.allDay && event.endTime) {
            endTimeInput.value = event.endTime.toTimeString().substring(0, 5);
        }
        
        this.toggleTimeInputs();
        deleteBtn.style.display = 'inline-block';
        deleteBtn.dataset.eventId = eventId;
    }
    
    // Save event
    saveEvent() {
        const titleInput = this.calendarWindow.querySelector('#event-title');
        const dateInput = this.calendarWindow.querySelector('#event-date');
        const allDayCheckbox = this.calendarWindow.querySelector('#event-all-day');
        const startTimeInput = this.calendarWindow.querySelector('#event-start-time');
        const endTimeInput = this.calendarWindow.querySelector('#event-end-time');
        const descriptionInput = this.calendarWindow.querySelector('#event-description');
        const deleteBtn = this.calendarWindow.querySelector('#delete-event-btn');
        
        if (!titleInput.value.trim()) {
            alert('Please enter an event title');
            return;
        }
        
        if (!dateInput.value) {
            alert('Please select a date');
            return;
        }
        
        const eventData = {
            title: titleInput.value.trim(),
            description: descriptionInput.value.trim(),
            date: dateInput.value,
            allDay: allDayCheckbox.checked
        };
        
        if (!eventData.allDay) {
            if (startTimeInput.value) {
                eventData.startTime = `${dateInput.value}T${startTimeInput.value}:00`;
            }
            if (endTimeInput.value) {
                eventData.endTime = `${dateInput.value}T${endTimeInput.value}:00`;
            }
        }
        
        // Check if editing existing event
        const eventId = deleteBtn.dataset.eventId;
        if (eventId) {
            this.calendar.updateEvent(parseFloat(eventId), eventData);
        } else {
            this.calendar.addEvent(eventData);
        }
        
        this.clearForm();
        this.updateCalendarView();
        this.updateTodaysEvents();
        
        // Notify parent of changes
        if (this.onEventsChange) {
            this.onEventsChange();
        }
    }
    
    // Clear form
    clearForm() {
        const form = this.calendarWindow.querySelector('.event-form');
        form.querySelectorAll('input[type="text"], input[type="time"], textarea').forEach(input => {
            input.value = '';
        });
        form.querySelector('#event-all-day').checked = false;
        form.querySelector('#delete-event-btn').style.display = 'none';
        form.querySelector('#delete-event-btn').dataset.eventId = '';
        this.toggleTimeInputs();
    }
    
    // Delete current event
    deleteCurrentEvent() {
        const deleteBtn = this.calendarWindow.querySelector('#delete-event-btn');
        const eventId = deleteBtn.dataset.eventId;
        
        if (!eventId) return;
        
        if (confirm('Are you sure you want to delete this event?')) {
            this.calendar.deleteEvent(parseFloat(eventId));
            this.clearForm();
            this.updateCalendarView();
            this.updateTodaysEvents();
            
            // Notify parent of changes
            if (this.onEventsChange) {
                this.onEventsChange();
            }
        }
    }
    
    // Toggle time inputs based on all-day checkbox
    toggleTimeInputs() {
        const allDayCheckbox = this.calendarWindow.querySelector('#event-all-day');
        const timeInputs = this.calendarWindow.querySelector('#time-inputs');
        
        if (allDayCheckbox.checked) {
            timeInputs.style.display = 'none';
        } else {
            timeInputs.style.display = 'block';
        }
    }
    
    // Update today's events list
    updateTodaysEvents() {
        const todaysEventsEl = this.calendarWindow.querySelector('#todays-events');
        const events = this.calendar.getTodaysEvents();
        
        if (events.length === 0) {
            todaysEventsEl.innerHTML = '<div class="no-events">No events today</div>';
            return;
        }
        
        let html = '';
        events.forEach(event => {
            const timeStr = event.allDay ? 'All Day' : 
                event.startTime ? event.startTime.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit', 
                    hour12: true 
                }) : '';
            
            html += `
                <div class="event-item" data-event-id="${event.id}">
                    <div class="event-time">${timeStr}</div>
                    <div class="event-title">${event.title}</div>
                </div>
            `;
        });
        
        todaysEventsEl.innerHTML = html;
        
        // Add click handlers
        todaysEventsEl.querySelectorAll('.event-item').forEach(item => {
            item.addEventListener('click', () => {
                const eventId = parseFloat(item.dataset.eventId);
                this.selectEvent(eventId);
            });
        });
    }
    
    // Sync to watch
    syncToWatch() {
        const events = this.calendar.getUpcomingEvents(7);
        const appointments = this.calendar.convertEventsToAppointments(events);
        
        if (this.onEventSelect) {
            this.onEventSelect(appointments);
        }
        
        alert(`${appointments.length} events ready to sync to watch. Use the main app to complete the sync.`);
    }
    
    // Export events
    exportEvents() {
        const data = this.calendar.exportEvents();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `calendar-events-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Import events
    importEvents(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const events = JSON.parse(e.target.result);
                const imported = this.calendar.importEvents(events);
                
                this.updateCalendarView();
                this.updateTodaysEvents();
                
                alert(`Imported ${imported.length} events successfully`);
                
                // Notify parent of changes
                if (this.onEventsChange) {
                    this.onEventsChange();
                }
            } catch (error) {
                alert('Error importing events: ' + error.message);
            }
        };
        reader.readAsText(file);
        
        // Clear file input
        event.target.value = '';
    }
    
    // Utility methods
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }
    
    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
    
    // Format date as YYYY-MM-DD string without timezone issues
    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Parse date string safely in local timezone
    parseDateString(dateStr) {
        if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return new Date(dateStr + 'T00:00:00');
        }
        return new Date(dateStr);
    }
    
    // Get events for sync
    getEventsForSync() {
        return this.calendar.getUpcomingEvents(7);
    }
    
    // Get appointments for sync
    getAppointmentsForSync() {
        const events = this.getEventsForSync();
        return this.calendar.convertEventsToAppointments(events);
    }
    
    // Ensure window is visible and properly positioned
    ensureWindowVisible() {
        if (!this.calendarWindow) return;
        
        const rect = this.calendarWindow.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        console.log('CalendarUI: Window position check - top:', rect.top, 'left:', rect.left, 'viewport:', viewportWidth, 'x', viewportHeight);
        
        // If window is too low or off-screen, reposition it
        if (rect.top > viewportHeight - 100 || rect.top < 0) {
            console.log('CalendarUI: Repositioning window - was too low or high');
            this.calendarWindow.style.top = '80px';
        }
        
        if (rect.left > viewportWidth - 100 || rect.left < 0) {
            console.log('CalendarUI: Repositioning window - was too far left or right');
            this.calendarWindow.style.left = '100px';
        }
    }
}