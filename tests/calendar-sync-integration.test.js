// Calendar Sync Integration Tests
import { CalendarSyncIntegration } from '../lib/calendar-sync-integration.js';

// Mock TimexDatalinkClient
class MockTimexDatalinkClient {
    constructor() {
        this.models = [];
        this.writeCallCount = 0;
    }
    
    async write() {
        this.writeCallCount++;
        return Promise.resolve();
    }
}

// Test data
const mockCalendarAppointments = [
    {
        date: new Date('2025-02-09T10:00:00'),
        time: new Date('2025-02-09T10:00:00'),
        description: 'Meeting',
        originalTitle: 'Team Meeting',
        isAllDay: false
    },
    {
        date: new Date('2025-02-09T14:30:00'),
        time: new Date('2025-02-09T14:30:00'),
        description: 'Dr Appt',
        originalTitle: 'Doctor Appointment',
        isAllDay: false
    },
    {
        date: new Date('2025-02-09T00:00:00'),
        time: new Date('2025-02-09T00:00:00'),
        description: 'Birthday',
        originalTitle: 'John\'s Birthday',
        isAllDay: true
    }
];

// Test functions
function testCalendarSyncIntegration() {
    console.log('Testing Calendar Sync Integration...');
    
    const mockClient = new MockTimexDatalinkClient();
    const calendarSync = new CalendarSyncIntegration(mockClient);
    
    // Test 1: Convert calendar appointments to EEPROM
    console.log('Test 1: Converting calendar appointments to EEPROM format');
    const eepromAppointments = calendarSync.convertCalendarAppointmentsToEeprom(mockCalendarAppointments);
    
    console.log(`Original appointments: ${mockCalendarAppointments.length}`);
    console.log(`EEPROM appointments: ${eepromAppointments.length}`);
    console.log('EEPROM appointments:', eepromAppointments.map(apt => ({
        time: apt.time.toISOString(),
        message: apt.message,
        time15m: apt.time15m()
    })));
    
    // Test 2: Preview sync
    console.log('\nTest 2: Preview sync');
    const preview = calendarSync.previewSync(mockCalendarAppointments);
    console.log('Preview result:', {
        totalEvents: preview.totalEvents,
        syncableAppointments: preview.syncableAppointments,
        skippedEvents: preview.skippedEvents,
        errors: preview.errors.length
    });
    
    // Test 3: Sync to watch (mock)
    console.log('\nTest 3: Sync to watch');
    calendarSync.syncCalendarToWatch(mockCalendarAppointments, {
        appointmentNotificationMinutes: 5,
        clearExisting: true
    }).then(result => {
        console.log('Sync result:', result);
        console.log(`Client write calls: ${mockClient.writeCallCount}`);
        console.log(`Models added to client: ${mockClient.models.length}`);
        
        if (mockClient.models.length > 0) {
            console.log('EEPROM model appointments:', mockClient.models[0].appointments.length);
        }
    }).catch(error => {
        console.error('Sync error:', error);
    });
    
    // Test 4: Validation
    console.log('\nTest 4: Notification minutes validation');
    const validValues = [null, 0, 5, 10, 15, 20, 25, 30];
    const invalidValues = [1, 3, 35, 60, -5];
    
    validValues.forEach(value => {
        const isValid = CalendarSyncIntegration.isValidNotificationMinutes(value);
        console.log(`${value} minutes: ${isValid ? 'VALID' : 'INVALID'}`);
    });
    
    invalidValues.forEach(value => {
        const isValid = CalendarSyncIntegration.isValidNotificationMinutes(value);
        console.log(`${value} minutes: ${isValid ? 'VALID' : 'INVALID'}`);
    });
    
    console.log('\nCalendar Sync Integration tests completed!');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
    // Node.js environment
    testCalendarSyncIntegration();
} else {
    // Browser environment - expose test function
    window.testCalendarSyncIntegration = testCalendarSyncIntegration;
}

export { testCalendarSyncIntegration };