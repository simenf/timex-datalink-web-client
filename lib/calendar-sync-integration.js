// Calendar Sync Integration Module
// Connects Google Calendar data to Protocol 3 EEPROM appointment writing

import Protocol3EepromAppointment from './protocol3/eeprom/appointment.js';
import Protocol3Eeprom from './protocol3/eeprom.js';

export class CalendarSyncIntegration {
    constructor(client) {
        this.client = client;
        this.syncStatus = {
            inProgress: false,
            lastSync: null,
            appointmentsSynced: 0,
            errors: []
        };
    }
    
    /**
     * Convert calendar appointments to Protocol 3 EEPROM appointments
     * @param {Array} calendarAppointments - Array of calendar appointments from GoogleCalendarClient
     * @returns {Array} Array of Protocol3EepromAppointment instances
     */
    convertCalendarAppointmentsToEeprom(calendarAppointments) {
        const eepromAppointments = [];
        
        for (const appointment of calendarAppointments) {
            try {
                console.log(`🔍 Processing appointment:`, {
                    title: appointment.originalTitle || appointment.title,
                    date: appointment.date,
                    time: appointment.time,
                    dateType: typeof appointment.date,
                    timeType: typeof appointment.time,
                    isAllDay: appointment.isAllDay,
                    description: appointment.description,
                    fullObject: appointment
                });
                
                // Skip all-day events as they don't have specific times
                if (appointment.isAllDay) {
                    console.log(`Skipping all-day event: ${appointment.originalTitle || appointment.title}`);
                    continue;
                }
                
                // Try to get a valid date from multiple possible sources
                let appointmentDate = null;
                
                // Check appointment.time first (from local calendar conversion)
                if (appointment.time && appointment.time instanceof Date && !isNaN(appointment.time.getTime())) {
                    appointmentDate = appointment.time;
                } 
                // Then check appointment.date
                else if (appointment.date && appointment.date instanceof Date && !isNaN(appointment.date.getTime())) {
                    appointmentDate = appointment.date;
                }
                // Try to parse appointment.date as string
                else if (appointment.date && typeof appointment.date === 'string') {
                    appointmentDate = new Date(appointment.date);
                    if (isNaN(appointmentDate.getTime())) {
                        appointmentDate = null;
                    }
                }
                // Try to parse appointment.time as string
                else if (appointment.time && typeof appointment.time === 'string') {
                    appointmentDate = new Date(appointment.time);
                    if (isNaN(appointmentDate.getTime())) {
                        appointmentDate = null;
                    }
                }
                
                if (!appointmentDate) {
                    throw new Error(`No valid date found - date: ${appointment.date}, time: ${appointment.time}`);
                }
                
                console.log(`✅ Valid date found:`, appointmentDate);
                
                // Get message from available sources
                const message = appointment.message || appointment.description || appointment.title || appointment.originalTitle || 'Appointment';
                
                // Create Protocol 3 EEPROM appointment
                const eepromAppointment = new Protocol3EepromAppointment({
                    time: appointmentDate,
                    message: message
                });
                
                eepromAppointments.push(eepromAppointment);
                
            } catch (error) {
                console.error(`Error converting appointment "${appointment.originalTitle || appointment.title}":`, error);
                this.syncStatus.errors.push({
                    appointment: appointment.originalTitle || appointment.title || 'Unknown',
                    error: error.message
                });
            }
        }
        
        return eepromAppointments;
    }
    
    /**
     * Sync calendar appointments to watch
     * @param {Array} calendarAppointments - Calendar appointments to sync
     * @param {Object} options - Sync options
     * @param {number} options.appointmentNotificationMinutes - Notification minutes (0, 5, 10, 15, 20, 25, 30, or null)
     * @param {boolean} options.clearExisting - Whether to clear existing appointments
     * @returns {Promise<Object>} Sync result
     */
    async syncCalendarToWatch(calendarAppointments, options = {}) {
        const {
            appointmentNotificationMinutes = 5,
            clearExisting = true
        } = options;
        
        if (this.syncStatus.inProgress) {
            throw new Error('Sync already in progress');
        }
        
        if (!this.client) {
            throw new Error('No watch client available');
        }
        
        // Debug existing client state
        console.log('🔍 CLIENT DEBUG: Existing models before sync:', this.client.models);
        console.log('🔍 CLIENT DEBUG: Existing model count:', this.client.models.length);
        this.client.models.forEach((model, i) => {
            console.log(`🔍 CLIENT DEBUG: Model ${i}:`, {
                name: model.constructor?.name,
                hasPacketsMethod: typeof model.packets === 'function',
                model: model
            });
        });
        
        this.syncStatus.inProgress = true;
        this.syncStatus.errors = [];
        this.syncStatus.appointmentsSynced = 0;
        
        try {
            // Debug input data thoroughly
            console.log('📅 CALENDAR SYNC DEBUG: Input calendar appointments:', calendarAppointments);
            console.log('📅 CALENDAR SYNC DEBUG: Input count:', calendarAppointments.length);
            
            calendarAppointments.forEach((apt, i) => {
                console.log(`📅 INPUT APPOINTMENT ${i}:`, JSON.stringify(apt, null, 2));
                console.log(`📅 INPUT APPOINTMENT ${i} DETAILS:`, {
                    hasTime: 'time' in apt,
                    hasDate: 'date' in apt,
                    timeValue: apt.time,
                    dateValue: apt.date,
                    timeType: typeof apt.time,
                    dateType: typeof apt.date,
                    timeIsDate: apt.time instanceof Date,
                    dateIsDate: apt.date instanceof Date,
                    allKeys: Object.keys(apt)
                });
            });
            
            // Convert calendar appointments to EEPROM format
            const eepromAppointments = this.convertCalendarAppointmentsToEeprom(calendarAppointments);
            console.log('📊 CALENDAR SYNC DEBUG: Converted EEPROM appointments:', eepromAppointments);
            
            // Validate all EEPROM appointments before proceeding
            for (let i = 0; i < eepromAppointments.length; i++) {
                const apt = eepromAppointments[i];
                console.log(`🔍 VALIDATION: Appointment ${i}:`, {
                    time: apt.time,
                    timeType: typeof apt.time,
                    isDate: apt.time instanceof Date,
                    isValid: apt.time instanceof Date && !isNaN(apt.time.getTime()),
                    message: apt.message
                });
                
                if (!apt.time || !(apt.time instanceof Date) || isNaN(apt.time.getTime())) {
                    throw new Error(`Invalid appointment at index ${i}: time is ${apt.time} (${typeof apt.time})`);
                }
            }
            
            if (eepromAppointments.length === 0) {
                throw new Error('No valid appointments to sync');
            }
            
            // Create EEPROM data structure
            console.log('📊 CALENDAR SYNC DEBUG: EEPROM appointments data:', eepromAppointments);
            eepromAppointments.forEach((apt, i) => {
                console.log(`📅 Appointment ${i + 1}:`, {
                    time: apt.time,
                    message: apt.message,
                    month: apt.month,
                    day: apt.day,
                    timeType: typeof apt.time,
                    timeValue: apt.time
                });
            });
            
            const eepromData = new Protocol3Eeprom({
                appointments: eepromAppointments,
                anniversaries: [], // Keep existing or empty
                phoneNumbers: [], // Keep existing or empty  
                lists: [], // Keep existing or empty
                appointmentNotificationMinutes: appointmentNotificationMinutes
            });
            
            // Add EEPROM data to client models
            this.client.models = [eepromData];
            console.log('📦 CLIENT DEBUG: Models added to client:', this.client.models);
            console.log('📦 CLIENT DEBUG: EEPROM data structure:', eepromData);
            
            // Write to watch
            console.log('📅 CALENDAR SYNC DEBUG: Starting write to watch with EEPROM data');
            console.log(`📊 CALENDAR SYNC DEBUG: ${eepromAppointments.length} appointments converted to EEPROM format`);
            await this.client.write();
            
            // Update sync status
            this.syncStatus.appointmentsSynced = eepromAppointments.length;
            this.syncStatus.lastSync = new Date();
            
            return {
                success: true,
                appointmentsSynced: eepromAppointments.length,
                totalRequested: calendarAppointments.length,
                errors: this.syncStatus.errors,
                syncTime: this.syncStatus.lastSync
            };
            
        } catch (error) {
            console.error('Calendar sync error:', error);
            this.syncStatus.errors.push({
                type: 'sync_error',
                error: error.message
            });
            
            throw error;
        } finally {
            this.syncStatus.inProgress = false;
        }
    }
    
    /**
     * Preview what will be synced without actually syncing
     * @param {Array} calendarAppointments - Calendar appointments to preview
     * @returns {Object} Preview information
     */
    previewSync(calendarAppointments) {
        const eepromAppointments = this.convertCalendarAppointmentsToEeprom(calendarAppointments);
        
        const preview = {
            totalEvents: calendarAppointments.length,
            syncableAppointments: eepromAppointments.length,
            skippedEvents: calendarAppointments.length - eepromAppointments.length,
            appointments: eepromAppointments.map(apt => ({
                time: apt.time,
                message: apt.message,
                timeFormatted: apt.time.toLocaleString(),
                time15m: apt.time15m()
            })),
            errors: this.syncStatus.errors.slice() // Copy current errors
        };
        
        return preview;
    }
    
    /**
     * Get current sync status
     * @returns {Object} Current sync status
     */
    getSyncStatus() {
        return {
            ...this.syncStatus,
            isInProgress: this.syncStatus.inProgress
        };
    }
    
    /**
     * Clear sync status and errors
     */
    clearSyncStatus() {
        this.syncStatus.errors = [];
        this.syncStatus.appointmentsSynced = 0;
    }
    
    /**
     * Validate appointment notification minutes
     * @param {number|null} minutes - Minutes to validate
     * @returns {boolean} Whether the value is valid
     */
    static isValidNotificationMinutes(minutes) {
        const validMinutes = [0, 5, 10, 15, 20, 25, 30];
        return minutes === null || validMinutes.includes(minutes);
    }
    
    /**
     * Get available notification minute options
     * @returns {Array} Array of valid notification minute values
     */
    static getNotificationMinuteOptions() {
        return [
            { value: null, label: 'No notification' },
            { value: 0, label: 'At event time' },
            { value: 5, label: '5 minutes before' },
            { value: 10, label: '10 minutes before' },
            { value: 15, label: '15 minutes before' },
            { value: 20, label: '20 minutes before' },
            { value: 25, label: '25 minutes before' },
            { value: 30, label: '30 minutes before' }
        ];
    }
}