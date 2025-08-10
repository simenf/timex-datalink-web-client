// Local Calendar Module for Timex Datalink Web Client
// Provides a local calendar alternative to Google Calendar integration

export class LocalCalendar {
    constructor() {
        this.events = [];
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.storageKey = 'timex_local_calendar_events';
        this.loadEvents();
    }
    
    // Load events from localStorage
    loadEvents() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.events = JSON.parse(stored).map(event => ({
                    ...event,
                    date: new Date(event.date),
                    startTime: event.startTime ? new Date(event.startTime) : null,
                    endTime: event.endTime ? new Date(event.endTime) : null
                }));
            }
        } catch (error) {
            console.error('Error loading calendar events:', error);
            this.events = [];
        }
    }
    
    // Save events to localStorage
    saveEvents() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.events));
        } catch (error) {
            console.error('Error saving calendar events:', error);
        }
    }
    
    // Add a new event
    addEvent(eventData) {
        const event = {
            id: Date.now() + Math.random(),
            title: eventData.title || 'New Event',
            description: eventData.description || '',
            date: new Date(eventData.date),
            startTime: eventData.startTime ? new Date(eventData.startTime) : null,
            endTime: eventData.endTime ? new Date(eventData.endTime) : null,
            allDay: eventData.allDay || false,
            created: new Date(),
            modified: new Date()
        };
        
        this.events.push(event);
        this.saveEvents();
        return event;
    }
    
    // Update an existing event
    updateEvent(eventId, eventData) {
        const eventIndex = this.events.findIndex(e => e.id === eventId);
        if (eventIndex === -1) return null;
        
        const event = this.events[eventIndex];
        Object.assign(event, {
            ...eventData,
            date: eventData.date ? new Date(eventData.date) : event.date,
            startTime: eventData.startTime ? new Date(eventData.startTime) : event.startTime,
            endTime: eventData.endTime ? new Date(eventData.endTime) : event.endTime,
            modified: new Date()
        });
        
        this.saveEvents();
        return event;
    }
    
    // Delete an event
    deleteEvent(eventId) {
        const eventIndex = this.events.findIndex(e => e.id === eventId);
        if (eventIndex === -1) return false;
        
        this.events.splice(eventIndex, 1);
        this.saveEvents();
        return true;
    }
    
    // Get events for a specific date
    getEventsForDate(date) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        
        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === targetDate.getTime();
        }).sort((a, b) => {
            if (a.allDay && !b.allDay) return -1;
            if (!a.allDay && b.allDay) return 1;
            if (a.startTime && b.startTime) {
                return a.startTime.getTime() - b.startTime.getTime();
            }
            return 0;
        });
    }
    
    // Get events for today
    getTodaysEvents() {
        return this.getEventsForDate(new Date());
    }
    
    // Get upcoming events (next 7 days)
    getUpcomingEvents(days = 7) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + days);
        
        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= today && eventDate < endDate;
        }).sort((a, b) => {
            const dateCompare = a.date.getTime() - b.date.getTime();
            if (dateCompare !== 0) return dateCompare;
            
            if (a.allDay && !b.allDay) return -1;
            if (!a.allDay && b.allDay) return 1;
            if (a.startTime && b.startTime) {
                return a.startTime.getTime() - b.startTime.getTime();
            }
            return 0;
        });
    }
    
    // Convert events to watch-compatible appointments
    convertEventsToAppointments(events, maxEvents = 10) {
        return events.slice(0, maxEvents).map(event => {
            let message = event.title;
            
            // Truncate title to fit watch display (8 characters for Protocol 3)
            if (message.length > 8) {
                message = message.substring(0, 8);
            }
            
            // Use start time if available, otherwise use date
            const appointmentTime = event.startTime || event.date;
            
            return {
                id: event.id,
                message: message,
                time: appointmentTime,
                originalTitle: event.title,
                originalEvent: event,
                timeFormatted: this.formatTimeForDisplay(appointmentTime, event.allDay)
            };
        });
    }
    
    // Format time for display
    formatTimeForDisplay(time, allDay = false) {
        if (allDay) {
            return 'All Day';
        }
        
        return time.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    
    // Get events for a specific month
    getEventsForMonth(year, month) {
        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getFullYear() === year && eventDate.getMonth() === month;
        });
    }
    
    // Get all events
    getAllEvents() {
        return [...this.events].sort((a, b) => a.date.getTime() - b.date.getTime());
    }
    
    // Clear all events
    clearAllEvents() {
        this.events = [];
        this.saveEvents();
    }
    
    // Import events from external source (like Google Calendar format)
    importEvents(externalEvents) {
        const imported = [];
        
        externalEvents.forEach(extEvent => {
            try {
                const event = this.addEvent({
                    title: extEvent.summary || extEvent.title || 'Imported Event',
                    description: extEvent.description || '',
                    date: new Date(extEvent.start?.dateTime || extEvent.start?.date || extEvent.date),
                    startTime: extEvent.start?.dateTime ? new Date(extEvent.start.dateTime) : null,
                    endTime: extEvent.end?.dateTime ? new Date(extEvent.end.dateTime) : null,
                    allDay: !extEvent.start?.dateTime
                });
                imported.push(event);
            } catch (error) {
                console.error('Error importing event:', error, extEvent);
            }
        });
        
        return imported;
    }
    
    // Export events to JSON
    exportEvents() {
        return JSON.stringify(this.events, null, 2);
    }
}