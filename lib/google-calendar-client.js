// Google Calendar API Client
export class GoogleCalendarClient {
    constructor(auth) {
        this.auth = auth;
        this.baseUrl = 'https://www.googleapis.com/calendar/v3';
    }
    
    // Get today's calendar events
    async getTodaysEvents() {
        const token = await this.auth.getAccessToken();
        
        // Get today's date range
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        try {
            const response = await fetch(`${this.baseUrl}/calendars/primary/events?` + new URLSearchParams({
                timeMin: startOfDay.toISOString(),
                timeMax: endOfDay.toISOString(),
                singleEvents: 'true',
                orderBy: 'startTime',
                maxResults: '50'
            }), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('Error fetching calendar events:', error);
            throw error;
        }
    }
    
    // Get upcoming events (next 7 days)
    async getUpcomingEvents(days = 7) {
        const token = await this.auth.getAccessToken();
        
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(now.getDate() + days);
        
        try {
            const response = await fetch(`${this.baseUrl}/calendars/primary/events?` + new URLSearchParams({
                timeMin: now.toISOString(),
                timeMax: futureDate.toISOString(),
                singleEvents: 'true',
                orderBy: 'startTime',
                maxResults: '100'
            }), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch upcoming events: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('Error fetching upcoming events:', error);
            throw error;
        }
    }
    
    // Convert Google Calendar event to watch-compatible appointment
    convertEventToAppointment(event) {
        // Extract event details
        const summary = event.summary || 'Untitled Event';
        const startTime = this.parseEventTime(event.start);
        const endTime = this.parseEventTime(event.end);
        
        // Truncate summary to fit watch limitations (8 characters for Protocol 3)
        const truncatedSummary = this.truncateForWatch(summary, 8);
        
        return {
            date: startTime,
            time: startTime,
            description: truncatedSummary,
            originalTitle: summary,
            duration: endTime ? Math.round((endTime - startTime) / (1000 * 60)) : 60, // minutes
            isAllDay: !event.start.dateTime,
            originalEvent: event
        };
    }
    
    // Parse event time from Google Calendar format
    parseEventTime(timeObj) {
        if (!timeObj) return null;
        
        // Handle all-day events
        if (timeObj.date) {
            return new Date(timeObj.date + 'T00:00:00');
        }
        
        // Handle timed events
        if (timeObj.dateTime) {
            return new Date(timeObj.dateTime);
        }
        
        return null;
    }
    
    // Truncate text to fit watch character limitations
    truncateForWatch(text, maxLength) {
        if (!text) return '';
        
        // Remove common words and abbreviate
        let abbreviated = text
            .replace(/\bmeet(ing)?\b/gi, 'mtg')
            .replace(/\bappointment\b/gi, 'appt')
            .replace(/\bconference\b/gi, 'conf')
            .replace(/\bdoctor\b/gi, 'dr')
            .replace(/\bwith\b/gi, 'w/')
            .replace(/\band\b/gi, '&')
            .replace(/\s+/g, ' ')
            .trim();
        
        // If still too long, truncate
        if (abbreviated.length > maxLength) {
            abbreviated = abbreviated.substring(0, maxLength - 1) + '…';
        }
        
        return abbreviated;
    }
    
    // Prioritize events for watch memory constraints
    prioritizeEvents(appointments, maxCount = 10) {
        // Sort by priority: current/upcoming events first, then by start time
        const now = new Date();
        
        return appointments
            .filter(apt => apt.date >= now) // Only future events
            .sort((a, b) => {
                // Prioritize events happening today
                const aToday = this.isSameDay(a.date, now);
                const bToday = this.isSameDay(b.date, now);
                
                if (aToday && !bToday) return -1;
                if (!aToday && bToday) return 1;
                
                // Then sort by start time
                return a.date - b.date;
            })
            .slice(0, maxCount);
    }
    
    // Check if two dates are on the same day
    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
    
    // Get calendar list
    async getCalendarList() {
        const token = await this.auth.getAccessToken();
        
        try {
            const response = await fetch(`${this.baseUrl}/users/me/calendarList`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch calendar list: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('Error fetching calendar list:', error);
            throw error;
        }
    }
    
    // Format appointment for display
    formatAppointmentForDisplay(appointment) {
        const timeStr = appointment.isAllDay 
            ? 'All Day' 
            : appointment.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const dateStr = appointment.date.toLocaleDateString();
        
        return {
            displayText: `${timeStr} - ${appointment.description}`,
            fullText: `${dateStr} ${timeStr} - ${appointment.originalTitle}`,
            watchText: appointment.description,
            date: dateStr,
            time: timeStr
        };
    }
}