// Test for Local Calendar Module
import { LocalCalendar } from '../web/js/local-calendar.js';

// Mock localStorage for testing
const mockLocalStorage = {
    data: {},
    getItem(key) {
        return this.data[key] || null;
    },
    setItem(key, value) {
        this.data[key] = value;
    },
    clear() {
        this.data = {};
    }
};

// Replace localStorage with mock
Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true
});

describe('LocalCalendar', () => {
    let calendar;
    
    beforeEach(() => {
        mockLocalStorage.clear();
        calendar = new LocalCalendar();
    });
    
    test('should initialize with empty events', () => {
        expect(calendar.events).toEqual([]);
    });
    
    test('should add a new event', () => {
        const eventData = {
            title: 'Test Event',
            description: 'Test Description',
            date: '2025-02-10',
            startTime: '2025-02-10T10:00:00',
            endTime: '2025-02-10T11:00:00',
            allDay: false
        };
        
        const event = calendar.addEvent(eventData);
        
        expect(event.title).toBe('Test Event');
        expect(event.description).toBe('Test Description');
        expect(calendar.events.length).toBe(1);
    });
    
    test('should get events for a specific date', () => {
        // Add events for different dates
        calendar.addEvent({
            title: 'Event 1',
            date: '2025-02-10',
            startTime: '2025-02-10T10:00:00'
        });
        
        calendar.addEvent({
            title: 'Event 2',
            date: '2025-02-10',
            startTime: '2025-02-10T14:00:00'
        });
        
        calendar.addEvent({
            title: 'Event 3',
            date: '2025-02-11',
            startTime: '2025-02-11T10:00:00'
        });
        
        const eventsForFeb10 = calendar.getEventsForDate('2025-02-10');
        expect(eventsForFeb10.length).toBe(2);
        expect(eventsForFeb10[0].title).toBe('Event 1');
        expect(eventsForFeb10[1].title).toBe('Event 2');
    });
    
    test('should convert events to watch appointments', () => {
        calendar.addEvent({
            title: 'Very Long Event Title That Should Be Truncated',
            date: '2025-02-10',
            startTime: '2025-02-10T10:00:00'
        });
        
        calendar.addEvent({
            title: 'Short',
            date: '2025-02-10',
            allDay: true
        });
        
        const appointments = calendar.convertEventsToAppointments(calendar.events);
        
        expect(appointments.length).toBe(2);
        expect(appointments[0].message).toBe('Very Lon'); // Truncated to 8 chars
        expect(appointments[0].originalTitle).toBe('Very Long Event Title That Should Be Truncated');
        expect(appointments[1].message).toBe('Short');
        expect(appointments[1].timeFormatted).toBe('All Day');
    });
    
    test('should get upcoming events', () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 8);
        
        calendar.addEvent({
            title: 'Today Event',
            date: today.toISOString().split('T')[0]
        });
        
        calendar.addEvent({
            title: 'Tomorrow Event',
            date: tomorrow.toISOString().split('T')[0]
        });
        
        calendar.addEvent({
            title: 'Next Week Event',
            date: nextWeek.toISOString().split('T')[0]
        });
        
        const upcomingEvents = calendar.getUpcomingEvents(7);
        expect(upcomingEvents.length).toBe(2); // Today and tomorrow, not next week
        expect(upcomingEvents[0].title).toBe('Today Event');
        expect(upcomingEvents[1].title).toBe('Tomorrow Event');
    });
    
    test('should update an existing event', () => {
        const event = calendar.addEvent({
            title: 'Original Title',
            date: '2025-02-10'
        });
        
        const updatedEvent = calendar.updateEvent(event.id, {
            title: 'Updated Title',
            description: 'New description'
        });
        
        expect(updatedEvent.title).toBe('Updated Title');
        expect(updatedEvent.description).toBe('New description');
        expect(calendar.events.length).toBe(1);
    });
    
    test('should delete an event', () => {
        const event = calendar.addEvent({
            title: 'To Delete',
            date: '2025-02-10'
        });
        
        const deleted = calendar.deleteEvent(event.id);
        
        expect(deleted).toBe(true);
        expect(calendar.events.length).toBe(0);
    });
    
    test('should persist events to localStorage', () => {
        calendar.addEvent({
            title: 'Persistent Event',
            date: '2025-02-10'
        });
        
        // Create new calendar instance to test loading
        const newCalendar = new LocalCalendar();
        
        expect(newCalendar.events.length).toBe(1);
        expect(newCalendar.events[0].title).toBe('Persistent Event');
    });
});

// Run tests if this file is executed directly
if (typeof window !== 'undefined' && window.location) {
    console.log('Running Local Calendar Tests...');
    
    // Simple test runner
    const runTests = async () => {
        const tests = [
            () => {
                const calendar = new LocalCalendar();
                console.assert(calendar.events.length === 0, 'Calendar should start empty');
                console.log('✓ Calendar initialization test passed');
            },
            
            () => {
                const calendar = new LocalCalendar();
                const event = calendar.addEvent({
                    title: 'Test Event',
                    date: '2025-02-10'
                });
                console.assert(event.title === 'Test Event', 'Event should be added correctly');
                console.assert(calendar.events.length === 1, 'Calendar should have one event');
                console.log('✓ Add event test passed');
            },
            
            () => {
                const calendar = new LocalCalendar();
                calendar.addEvent({ title: 'Event 1', date: '2025-02-10' });
                calendar.addEvent({ title: 'Event 2', date: '2025-02-10' });
                calendar.addEvent({ title: 'Event 3', date: '2025-02-11' });
                
                const events = calendar.getEventsForDate('2025-02-10');
                console.assert(events.length === 2, 'Should get correct events for date');
                console.log('✓ Get events for date test passed');
            },
            
            () => {
                const calendar = new LocalCalendar();
                calendar.addEvent({
                    title: 'Very Long Event Title That Should Be Truncated',
                    date: '2025-02-10'
                });
                
                const appointments = calendar.convertEventsToAppointments(calendar.events);
                console.assert(appointments[0].message === 'Very Lon', 'Title should be truncated to 8 chars');
                console.log('✓ Convert to appointments test passed');
            }
        ];
        
        for (const test of tests) {
            try {
                test();
            } catch (error) {
                console.error('Test failed:', error);
            }
        }
        
        console.log('Local Calendar tests completed!');
    };
    
    runTests();
}