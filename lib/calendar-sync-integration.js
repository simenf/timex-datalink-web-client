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
                // Skip all-day events as they don't have specific times
                if (appointment.isAllDay) {
                    console.log(`Skipping all-day event: ${appointment.originalTitle}`);
                    continue;
                }
                
                // Create Protocol 3 EEPROM appointment
                const eepromAppointment = new Protocol3EepromAppointment({
                    time: appointment.date,
                    message: appointment.description
                });
                
                eepromAppointments.push(eepromAppointment);
                
            } catch (error) {
                console.error(`Error converting appointment "${appointment.originalTitle}":`, error);
                this.syncStatus.errors.push({
                    appointment: appointment.originalTitle,
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
        
        this.syncStatus.inProgress = true;
        this.syncStatus.errors = [];
        this.syncStatus.appointmentsSynced = 0;
        
        try {
            // Convert calendar appointments to EEPROM format
            const eepromAppointments = this.convertCalendarAppointmentsToEeprom(calendarAppointments);
            
            if (eepromAppointments.length === 0) {
                throw new Error('No valid appointments to sync');
            }
            
            // Create EEPROM data structure
            const eepromData = new Protocol3Eeprom({
                appointments: eepromAppointments,
                anniversaries: [], // Keep existing or empty
                phoneNumbers: [], // Keep existing or empty  
                lists: [], // Keep existing or empty
                appointmentNotificationMinutes: appointmentNotificationMinutes
            });
            
            // Add EEPROM data to client models
            this.client.models = [eepromData];
            
            // Write to watch
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