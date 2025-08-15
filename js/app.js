// Main application entry point
import { TimexDatalinkClient } from '../../lib/timex-datalink-client.js';
import { SerialAdapter } from '../../lib/serial-adapter.js';
import { GoogleCalendarAuth } from '../../lib/google-calendar-auth.js';
import { GoogleCalendarClient } from '../../lib/google-calendar-client.js';
import { CalendarSyncIntegration } from '../../lib/calendar-sync-integration.js';
import { CalendarUI } from './calendar-ui.js';
import { windowManager } from './window-manager.js';

class TimexDatalinkApp {
    constructor() {
        this.client = null;
        this.serialAdapter = null;
        this.isConnected = false;
        this.currentPort = null;
        
        // Google Calendar integration
        this.googleAuth = new GoogleCalendarAuth();
        this.googleCalendar = new GoogleCalendarClient(this.googleAuth);
        this.calendarSync = new CalendarSyncIntegration(null); // Will be set when client is created
        this.calendarEvents = [];
        this.calendarAppointments = [];
        
        // Local Calendar integration
        this.localCalendarUI = null;
        this.localCalendarAppointments = [];
        this.windowManager = windowManager;
        
        this.initializeUI();
        this.initializeCalendar();
    }
    
    initializeUI() {
        // Get UI elements
        this.connectBtn = document.getElementById('connect-btn');
        this.syncTimeBtn = document.getElementById('sync-time-btn');
        this.readDataBtn = document.getElementById('read-data-btn');
        this.writeDataBtn = document.getElementById('write-data-btn');
        this.testConnectionBtn = document.getElementById('test-connection-btn');
        
        // Advanced feature elements
        this.writeAdvancedBtn = document.getElementById('write-advanced-btn');
        this.readAdvancedBtn = document.getElementById('read-advanced-btn');
        this.uploadWristAppBtn = document.getElementById('upload-wrist-app-btn');
        this.uploadSoundThemeBtn = document.getElementById('upload-sound-theme-btn');
        this.wristAppFile = document.getElementById('wrist-app-file');
        this.soundThemeFile = document.getElementById('sound-theme-file');
        this.wristAppStatus = document.getElementById('wrist-app-status');
        this.soundThemeStatus = document.getElementById('sound-theme-status');
        
        // Advanced feature data storage
        this.wristAppData = null;
        this.soundThemeData = null;
        
        // Connection interface elements
        this.protocolSelect = document.getElementById('protocol-select');
        this.byteSleepInput = document.getElementById('byte-sleep');
        this.packetSleepInput = document.getElementById('packet-sleep');
        this.verboseModeCheckbox = document.getElementById('verbose-mode');
        
        // Status elements
        this.statusText = document.querySelector('.status-text');
        this.connectionStatus = document.querySelector('.connection-status');
        this.connectionLight = document.getElementById('connection-light');
        this.connectionText = document.getElementById('connection-text');
        this.deviceDetails = document.getElementById('device-details');
        this.portInfo = document.getElementById('port-info');
        this.protocolInfo = document.getElementById('protocol-info');
        this.statusInfo = document.getElementById('status-info');
        this.deviceLog = document.getElementById('device-log');
        
        // Progress elements
        this.syncProgress = document.getElementById('sync-progress');
        this.progressFill = document.getElementById('progress-fill');
        
        // Data management elements
        this.currentTimeInput = document.getElementById('current-time');
        this.setCurrentTimeBtn = document.getElementById('set-current-time-btn');
        this.timeZoneSelect = document.getElementById('time-zone');
        this.readTimeBtn = document.getElementById('read-time-btn');
        this.readAlarmsBtn = document.getElementById('read-alarms-btn');
        this.writeAlarmsBtn = document.getElementById('write-alarms-btn');
        this.readEepromBtn = document.getElementById('read-eeprom-btn');
        this.writeEepromBtn = document.getElementById('write-eeprom-btn');
        this.readAllBtn = document.getElementById('read-all-btn');
        this.writeAllBtn = document.getElementById('write-all-btn');
        
        // Display elements
        this.displayTime = document.getElementById('display-time');
        this.displayAlarms = document.getElementById('display-alarms');
        this.displayEeprom = document.getElementById('display-eeprom');
        
        // Calendar elements
        this.googleClientIdInput = document.getElementById('google-client-id');
        this.saveClientIdBtn = document.getElementById('save-client-id-btn');
        this.calendarAuthBtn = document.getElementById('calendar-auth-btn');
        this.calendarSignoutBtn = document.getElementById('calendar-signout-btn');
        this.calendarAuthLight = document.getElementById('calendar-auth-light');
        this.calendarAuthText = document.getElementById('calendar-auth-text');
        this.calendarUserInfo = document.getElementById('calendar-user-info');
        this.calendarUserEmail = document.getElementById('calendar-user-email');
        this.fetchEventsBtn = document.getElementById('fetch-events-btn');
        this.fetchUpcomingBtn = document.getElementById('fetch-upcoming-btn');
        this.maxEventsInput = document.getElementById('max-events');
        this.calendarEventsList = document.getElementById('calendar-events-list');
        this.autoSyncCalendarCheckbox = document.getElementById('auto-sync-calendar');
        this.prioritizeTodayCheckbox = document.getElementById('prioritize-today');
        this.notificationMinutesSelect = document.getElementById('notification-minutes');
        this.clearExistingCheckbox = document.getElementById('clear-existing');
        this.syncCalendarBtn = document.getElementById('sync-calendar-btn');
        this.previewSyncBtn = document.getElementById('preview-sync-btn');
        this.calendarSyncStatus = document.getElementById('calendar-sync-status');
        this.syncPreview = document.getElementById('sync-preview');
        this.syncPreviewList = document.getElementById('sync-preview-list');
        
        // Local Calendar elements
        this.openLocalCalendarBtn = document.getElementById('open-local-calendar-btn');
        this.syncLocalCalendarBtn = document.getElementById('sync-local-calendar-btn');
        this.localCalendarEventsCount = document.getElementById('local-calendar-events-count');
        
        // Protocol info elements
        this.protocolCapabilitiesList = document.getElementById('protocol-capabilities-list');
        this.protocolFunctionsList = document.getElementById('protocol-functions-list');
        
        // Bind event listeners
        this.connectBtn.addEventListener('click', () => this.handleConnect());
        
        // Add debug button to check available ports
        const debugBtn = document.createElement('button');
        debugBtn.textContent = 'Debug: Check Available Ports';
        debugBtn.className = 'btn';
        debugBtn.addEventListener('click', () => this.debugSerialPorts());
        this.connectBtn.parentNode.appendChild(debugBtn);
        this.testConnectionBtn.addEventListener('click', () => this.handleTestConnection());
        this.protocolSelect.addEventListener('change', () => this.handleProtocolChange());
        
        // Time management
        this.setCurrentTimeBtn.addEventListener('click', () => this.setCurrentTime());
        this.readTimeBtn.addEventListener('click', () => this.handleReadTime());
        this.syncTimeBtn.addEventListener('click', () => this.handleSyncTime());
        
        // Alarm management
        this.readAlarmsBtn.addEventListener('click', () => this.handleReadAlarms());
        this.writeAlarmsBtn.addEventListener('click', () => this.handleWriteAlarms());
        
        // EEPROM management
        this.readEepromBtn.addEventListener('click', () => this.handleReadEeprom());
        this.writeEepromBtn.addEventListener('click', () => this.handleWriteEeprom());
        
        // Sync operations
        this.readAllBtn.addEventListener('click', () => this.handleReadAll());
        this.writeAllBtn.addEventListener('click', () => this.handleWriteAll());
        
        // Calendar operations
        this.saveClientIdBtn.addEventListener('click', () => this.handleSaveClientId());
        this.calendarAuthBtn.addEventListener('click', () => this.handleCalendarAuth());
        this.calendarSignoutBtn.addEventListener('click', () => this.handleCalendarSignout());
        this.fetchEventsBtn.addEventListener('click', () => this.handleFetchEvents());
        this.fetchUpcomingBtn.addEventListener('click', () => this.handleFetchUpcoming());
        this.syncCalendarBtn.addEventListener('click', () => this.handleSyncCalendar());
        this.previewSyncBtn.addEventListener('click', () => this.handlePreviewSync());
        
        // Local Calendar operations
        this.openLocalCalendarBtn.addEventListener('click', () => {
            console.log('Open Local Calendar button clicked');
            this.handleOpenLocalCalendar();
        });
        this.syncLocalCalendarBtn.addEventListener('click', () => {
            console.log('Sync Local Calendar button clicked');
            this.handleSyncLocalCalendar();
        });
        
        // Advanced feature event listeners
        if (this.writeAdvancedBtn) {
            this.writeAdvancedBtn.addEventListener('click', () => this.handleWriteAdvanced());
        }
        if (this.readAdvancedBtn) {
            this.readAdvancedBtn.addEventListener('click', () => this.handleReadAdvanced());
        }
        if (this.uploadWristAppBtn) {
            this.uploadWristAppBtn.addEventListener('click', () => this.handleUploadWristApp());
        }
        if (this.uploadSoundThemeBtn) {
            this.uploadSoundThemeBtn.addEventListener('click', () => this.handleUploadSoundTheme());
        }
        if (this.wristAppFile) {
            this.wristAppFile.addEventListener('change', () => this.handleWristAppFileChange());
        }
        if (this.soundThemeFile) {
            this.soundThemeFile.addEventListener('change', () => this.handleSoundThemeFileChange());
        }
        
        // Tab switching
        this.initializeTabs();
        
        // Protocol capabilities data
        this.protocolCapabilities = {
            1: {
                name: 'Protocol 1',
                devices: ['Timex Datalink 50', 'Timex Datalink 70'],
                features: ['Time', 'Time Name', 'Alarms', 'EEPROM Data', 'Phone Numbers', 'Appointments', 'Anniversaries', 'Lists'],
                functions: [
                    'Set time and date',
                    'Set time zone names (3 chars)',
                    'Configure up to 5 alarms with messages',
                    'Store phone numbers with names',
                    'Store appointments with dates/times',
                    'Store anniversaries',
                    'Create to-do lists with priorities',
                    'Read/write EEPROM data'
                ],
                bidirectional: false,
                status: 'Fully Implemented',
                maxAlarms: 5
            },
            3: {
                name: 'Protocol 3',
                devices: ['Timex Datalink 150', 'Timex Datalink 150s'],
                features: ['Time', 'Alarms', 'EEPROM Data', 'Sound Options', 'Sound Theme', 'Wrist Apps'],
                functions: [
                    'Set time and date',
                    'Configure up to 5 alarms',
                    'Store appointments and phone numbers',
                    'Configure sound options (hourly chime, button beep)',
                    'Upload custom sound themes (.SPC files)',
                    'Upload wrist applications (.ZAP files)',
                    'Read/write EEPROM data'
                ],
                bidirectional: false,
                status: 'Fully Implemented',
                maxAlarms: 5
            },
            4: {
                name: 'Protocol 4',
                devices: ['Timex Datalink Internet Messenger', 'Timex Datalink USB'],
                features: ['Time', 'Alarms', 'EEPROM Data', 'Sound Options', 'Sound Theme', 'Wrist Apps'],
                functions: [
                    'Set time with multiple date formats',
                    'Set time zone names',
                    'Configure up to 5 alarms with messages',
                    'Store appointments, anniversaries, phone numbers, lists',
                    'Configure sound options (hourly chime, button beep)',
                    'Upload custom sound themes (.SPC files)',
                    'Upload wrist applications (.ZAP files)',
                    'Bidirectional data sync',
                    'Read device data back to computer'
                ],
                bidirectional: true,
                status: 'Fully Implemented',
                maxAlarms: 5
            },
            6: {
                name: 'Protocol 6',
                devices: ['Motorola Beepwear Pro'],
                features: ['Time', 'Alarms', 'EEPROM Data', 'Sound Options', 'Pager Options', 'Night Mode'],
                functions: [
                    'Set time with timezone support',
                    'FLEXtime support for automatic time updates',
                    'Configure up to 8 alarms with extended messages',
                    'Configure pager auto on/off times',
                    'Set pager alert sounds (6 options)',
                    'Configure night mode settings',
                    'Set Indiglo timeout duration',
                    'Configure sound and scroll options',
                    'Message scroll speed control'
                ],
                bidirectional: false,
                status: 'Fully Implemented',
                maxAlarms: 8
            },
            7: {
                name: 'Protocol 7',
                devices: ['DSI e-BRAIN'],
                features: ['EEPROM Data', 'Calendar', 'Activities', 'Games', 'Speech', 'Phrase Builder'],
                functions: [
                    'Store calendar events and activities',
                    'Configure educational games (Memory, Fortune Teller, etc.)',
                    'Set countdown timer with custom sounds',
                    'Configure speech synthesis',
                    'Create custom phrases with vocabulary builder',
                    'Set device and user nicknames',
                    'Store phone numbers',
                    'Morse code practice setup',
                    'Music time keeper configuration'
                ],
                bidirectional: false,
                status: 'Fully Implemented',
                maxAlarms: 0
            },
            9: {
                name: 'Protocol 9',
                devices: ['Timex Ironman Triathlon'],
                features: ['Time', 'Time Name', 'Alarms', 'Timer', 'EEPROM Data', 'Chrono', 'Sound Options'],
                functions: [
                    'Set time and date',
                    'Set time zone names (3 chars)',
                    'Configure up to 10 alarms with 16-char messages',
                    'Set multiple timers with labels',
                    'Configure timer end actions (stop, repeat, start chrono)',
                    'Configure sound options (hourly chime, button beep)',
                    'Store EEPROM data',
                    'Chronograph configuration',
                    'Sports timing functions'
                ],
                bidirectional: false,
                status: 'Fully Implemented',
                maxAlarms: 10
            }
        };
        
        this.updateStatus('Ready');
        this.logMessage('Application initialized. Click "Connect Device" to begin.');
        this.setCurrentTime(); // Initialize with current time
        this.handleProtocolChange(); // Initialize protocol info display
        this.updateLocalCalendarStatus(); // Initialize local calendar status
    }
    
    initializeCalendar() {
        // Load stored Google Client ID
        const storedClientId = localStorage.getItem('google_client_id');
        if (storedClientId) {
            this.googleClientIdInput.value = storedClientId;
            this.googleAuth.initialize(storedClientId);
        }
        
        // Update calendar authentication status
        this.updateCalendarAuthStatus();
        
        // Check for OAuth callback
        this.handleOAuthCallback();
    }
    
    handleOAuthCallback() {
        // Handle OAuth callback if we're in a popup window
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        
        if (window.opener && (code || error)) {
            if (code) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', code }, window.location.origin);
            } else {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error }, window.location.origin);
            }
            window.close();
        }
    }
    
    async handleSaveClientId() {
        const clientId = this.googleClientIdInput.value.trim();
        if (!clientId) {
            alert('Please enter a valid Google Client ID');
            return;
        }
        
        try {
            // Store client ID
            localStorage.setItem('google_client_id', clientId);
            this.googleAuth.initialize(clientId);
            
            this.updateStatus('Google Client ID saved successfully');
            this.logMessage('Google OAuth Client ID configured');
            this.updateCalendarAuthStatus();
        } catch (error) {
            console.error('Error saving client ID:', error);
            this.updateStatus(`Error saving client ID: ${error.message}`);
        }
    }
    
    async handleCalendarAuth() {
        if (!this.googleClientIdInput.value.trim()) {
            alert('Please enter and save your Google Client ID first');
            return;
        }
        
        try {
            this.updateCalendarAuthLight('calendar-pending');
            this.calendarAuthText.textContent = 'Authenticating...';
            this.updateStatus('Authenticating with Google Calendar...');
            this.logMessage('Starting Google Calendar authentication...');
            
            await this.googleAuth.authenticate();
            
            // Get user profile
            const profile = await this.googleAuth.getUserProfile();
            this.calendarUserEmail.textContent = profile.email;
            this.calendarUserInfo.classList.remove('hidden');
            
            this.updateCalendarAuthStatus();
            this.updateStatus('Google Calendar authentication successful');
            this.logMessage(`Authenticated as: ${profile.email}`);
            
        } catch (error) {
            console.error('Calendar authentication error:', error);
            this.updateCalendarAuthLight('calendar-error');
            this.calendarAuthText.textContent = 'Authentication failed';
            this.updateStatus(`Calendar authentication failed: ${error.message}`);
            this.logMessage(`Calendar auth error: ${error.message}`);
        }
    }
    
    async handleCalendarSignout() {
        try {
            this.googleAuth.signOut();
            this.calendarEvents = [];
            this.calendarAppointments = [];
            this.updateCalendarAuthStatus();
            this.updateCalendarEventsList();
            this.updateStatus('Signed out from Google Calendar');
            this.logMessage('Signed out from Google Calendar');
        } catch (error) {
            console.error('Sign out error:', error);
            this.updateStatus(`Sign out error: ${error.message}`);
        }
    }
    
    async handleFetchEvents() {
        if (!this.googleAuth.isUserAuthenticated()) {
            alert('Please authenticate with Google Calendar first');
            return;
        }
        
        try {
            this.updateStatus('Fetching today\'s calendar events...');
            this.logMessage('Fetching today\'s events from Google Calendar...');
            this.showProgress('Fetching events...', 0);
            
            this.calendarEvents = await this.googleCalendar.getTodaysEvents();
            this.updateProgress(50);
            
            // Convert events to appointments
            this.calendarAppointments = this.calendarEvents.map(event => 
                this.googleCalendar.convertEventToAppointment(event)
            );
            
            // Apply prioritization if enabled
            if (this.prioritizeTodayCheckbox.checked) {
                const maxEvents = parseInt(this.maxEventsInput.value) || 10;
                this.calendarAppointments = this.googleCalendar.prioritizeEvents(
                    this.calendarAppointments, 
                    maxEvents
                );
            }
            
            this.updateProgress(100);
            this.updateCalendarEventsList();
            this.updateStatus(`Fetched ${this.calendarEvents.length} events from Google Calendar`);
            this.logMessage(`Loaded ${this.calendarEvents.length} events, ${this.calendarAppointments.length} appointments`);
            this.hideProgress();
            
        } catch (error) {
            console.error('Error fetching events:', error);
            this.updateStatus(`Error fetching events: ${error.message}`);
            this.logMessage(`Error fetching events: ${error.message}`);
            this.hideProgress();
        }
    }
    
    async handleFetchUpcoming() {
        if (!this.googleAuth.isUserAuthenticated()) {
            alert('Please authenticate with Google Calendar first');
            return;
        }
        
        try {
            this.updateStatus('Fetching upcoming calendar events...');
            this.logMessage('Fetching upcoming events from Google Calendar...');
            this.showProgress('Fetching upcoming events...', 0);
            
            this.calendarEvents = await this.googleCalendar.getUpcomingEvents(7);
            this.updateProgress(50);
            
            // Convert events to appointments
            this.calendarAppointments = this.calendarEvents.map(event => 
                this.googleCalendar.convertEventToAppointment(event)
            );
            
            // Apply prioritization
            const maxEvents = parseInt(this.maxEventsInput.value) || 10;
            this.calendarAppointments = this.googleCalendar.prioritizeEvents(
                this.calendarAppointments, 
                maxEvents
            );
            
            this.updateProgress(100);
            this.updateCalendarEventsList();
            this.updateStatus(`Fetched ${this.calendarEvents.length} upcoming events`);
            this.logMessage(`Loaded ${this.calendarEvents.length} upcoming events, ${this.calendarAppointments.length} appointments`);
            this.hideProgress();
            
        } catch (error) {
            console.error('Error fetching upcoming events:', error);
            this.updateStatus(`Error fetching upcoming events: ${error.message}`);
            this.logMessage(`Error fetching upcoming events: ${error.message}`);
            this.hideProgress();
        }
    }
    
    async handlePreviewSync() {
        if (this.calendarAppointments.length === 0) {
            alert('No calendar events loaded. Please fetch events first.');
            return;
        }
        
        try {
            this.updateStatus('Generating sync preview...');
            this.logMessage('Generating calendar sync preview...');
            
            // Use the calendar sync integration to generate preview
            const preview = this.calendarSync.previewSync(this.calendarAppointments);
            
            // Generate preview HTML
            let previewHtml = '';
            if (preview.appointments.length === 0) {
                previewHtml = '<div class="preview-item">No syncable appointments found</div>';
            } else {
                preview.appointments.forEach((appointment, index) => {
                    previewHtml += `
                        <div class="preview-item">
                            <span class="watch-format">${appointment.message}</span>
                            <span class="original-title">(${appointment.timeFormatted})</span>
                        </div>
                    `;
                });
            }
            
            // Add error information if any
            if (preview.errors.length > 0) {
                previewHtml += '<div class="preview-item sync-warning">Errors:</div>';
                preview.errors.forEach(error => {
                    previewHtml += `<div class="preview-item sync-error">${error.appointment || error.type}: ${error.error}</div>`;
                });
            }
            
            this.syncPreviewList.innerHTML = previewHtml;
            this.syncPreview.classList.remove('hidden');
            
            this.updateStatus(`Preview: ${preview.syncableAppointments}/${preview.totalEvents} events can be synced`);
            this.logMessage(`Preview: ${preview.syncableAppointments} syncable appointments, ${preview.skippedEvents} skipped`);
            
        } catch (error) {
            console.error('Error generating preview:', error);
            this.updateStatus(`Error generating preview: ${error.message}`);
            this.logMessage(`Preview error: ${error.message}`);
        }
    }
    
    async handleSyncCalendar() {
        if (!this.client) {
            alert('Please connect to your watch first');
            return;
        }
        
        if (this.calendarAppointments.length === 0) {
            alert('No calendar events loaded. Please fetch events first.');
            return;
        }
        
        try {
            this.updateStatus('Syncing calendar events to watch...');
            this.logMessage('Starting calendar sync to watch...');
            this.showProgress('Syncing calendar...', 0);
            
            this.updateProgress(25);
            this.logMessage(`Preparing ${this.calendarAppointments.length} appointments for sync...`);
            
            // Get sync options from UI
            const notificationValue = this.notificationMinutesSelect.value;
            const syncOptions = {
                appointmentNotificationMinutes: notificationValue === '' ? null : parseInt(notificationValue),
                clearExisting: this.clearExistingCheckbox.checked
            };
            
            this.updateProgress(50);
            this.logMessage('Converting appointments to Protocol 3 EEPROM format...');
            
            const syncResult = await this.calendarSync.syncCalendarToWatch(
                this.calendarAppointments, 
                syncOptions
            );
            
            this.updateProgress(75);
            this.logMessage('Writing appointment data to watch...');
            
            this.updateProgress(100);
            
            // Report sync results
            const successMessage = `Calendar sync completed: ${syncResult.appointmentsSynced}/${syncResult.totalRequested} appointments synced`;
            this.updateStatus(successMessage);
            this.logMessage(successMessage);
            
            if (syncResult.errors.length > 0) {
                this.logMessage(`Sync warnings/errors: ${syncResult.errors.length}`);
                syncResult.errors.forEach(error => {
                    this.logMessage(`  - ${error.appointment || error.type}: ${error.error}`);
                });
            }
            
            this.hideProgress();
            
        } catch (error) {
            console.error('Error syncing calendar:', error);
            this.updateStatus(`Calendar sync failed: ${error.message}`);
            this.logMessage(`Calendar sync error: ${error.message}`);
            this.hideProgress();
        }
    }
    
    updateCalendarAuthStatus() {
        const isAuthenticated = this.googleAuth.isUserAuthenticated();
        
        if (isAuthenticated) {
            this.updateCalendarAuthLight('calendar-authenticated');
            this.calendarAuthText.textContent = 'Authenticated';
            this.calendarAuthBtn.textContent = 'Re-authenticate';
            this.calendarSignoutBtn.disabled = false;
            this.fetchEventsBtn.disabled = false;
            this.fetchUpcomingBtn.disabled = false;
            this.syncCalendarBtn.disabled = !this.isConnected;
            this.previewSyncBtn.disabled = false;
            this.updateLocalCalendarStatus();
        } else {
            this.updateCalendarAuthLight('calendar-error');
            this.calendarAuthText.textContent = 'Not authenticated';
            this.calendarAuthBtn.textContent = 'Authenticate with Google';
            this.calendarSignoutBtn.disabled = true;
            this.fetchEventsBtn.disabled = true;
            this.fetchUpcomingBtn.disabled = true;
            this.syncCalendarBtn.disabled = true;
            this.previewSyncBtn.disabled = true;
            this.calendarUserInfo.classList.add('hidden');
            this.updateLocalCalendarStatus();
        }
    }
    
    updateCalendarAuthLight(status) {
        this.calendarAuthLight.className = `status-light ${status}`;
    }
    
    updateCalendarEventsList() {
        if (this.calendarAppointments.length === 0) {
            this.calendarEventsList.innerHTML = '<div class="no-events">No events loaded. Authenticate and fetch events to see your calendar.</div>';
            return;
        }
        
        let eventsHtml = '';
        this.calendarAppointments.forEach((appointment, index) => {
            const formatted = this.googleCalendar.formatAppointmentForDisplay(appointment);
            const priorityClass = index < 3 ? 'event-priority-high' : 
                                 index < 7 ? 'event-priority-medium' : 'event-priority-low';
            
            eventsHtml += `
                <div class="event-item ${priorityClass}">
                    <span class="event-time">${formatted.time}</span>
                    <span class="event-title">${appointment.originalTitle}</span>
                    <div class="event-watch-text">Watch: "${formatted.watchText}"</div>
                </div>
            `;
        });
        
        this.calendarEventsList.innerHTML = eventsHtml;
    }
    
    // Local Calendar Methods
    async handleOpenLocalCalendar() {
        console.log('handleOpenLocalCalendar() called');
        
        try {
            console.log('Checking window.windowManager availability...');
            
            // Wait for window manager to be available
            let attempts = 0;
            while (!window.windowManager && attempts < 50) {
                console.log(`Waiting for window manager... attempt ${attempts + 1}`);
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!window.windowManager) {
                throw new Error('Window manager is not available after waiting. Make sure the page has fully loaded.');
            }
            console.log('Window manager is available');
            
            // Initialize local calendar UI if not already done
            if (!this.localCalendarUI) {
                console.log('Creating new CalendarUI instance...');
                this.localCalendarUI = new CalendarUI(window.windowManager);
                
                // Set up event handlers
                this.localCalendarUI.onEventsChange = () => {
                    this.updateLocalCalendarStatus();
                };
                
                this.localCalendarUI.onEventSelect = (appointments) => {
                    this.localCalendarAppointments = appointments;
                    this.updateLocalCalendarStatus();
                };
                
                console.log('CalendarUI instance created');
            } else {
                console.log('Using existing CalendarUI instance');
            }
            
            // Open the calendar window
            console.log('Opening calendar window...');
            const calendarWindow = this.localCalendarUI.openCalendar();
            console.log('Calendar window result:', calendarWindow);
            
            this.updateLocalCalendarStatus();
            
            this.logMessage('Local calendar opened');
            this.updateStatus('Local calendar opened successfully');
            
        } catch (error) {
            console.error('Error opening local calendar:', error);
            this.updateStatus(`Error opening local calendar: ${error.message}`);
            this.logMessage(`Local calendar error: ${error.message}`);
            alert(`Error opening local calendar: ${error.message}`);
        }
    }
    
    async handleSyncLocalCalendar() {
        if (!this.client) {
            alert('Please connect to your watch first');
            return;
        }
        
        if (!this.localCalendarUI) {
            alert('Please open the local calendar first');
            return;
        }
        
        try {
            this.updateStatus('Syncing local calendar events to watch...');
            this.logMessage('Starting local calendar sync to watch...');
            this.showProgress('Syncing local calendar...', 0);
            
            // Get appointments from local calendar
            const appointments = this.localCalendarUI.getAppointmentsForSync();
            console.log('📅 LOCAL CALENDAR DEBUG: Raw appointments from UI:', appointments);
            appointments.forEach((apt, i) => {
                console.log(`📅 Appointment ${i + 1} details:`, {
                    title: apt.title,
                    originalTitle: apt.originalTitle,
                    date: apt.date,
                    dateType: typeof apt.date,
                    dateValue: apt.date,
                    description: apt.description,
                    isAllDay: apt.isAllDay,
                    fullObject: apt
                });
            });
            
            if (appointments.length === 0) {
                alert('No upcoming events found in local calendar');
                this.hideProgress();
                return;
            }
            
            this.updateProgress(25);
            this.logMessage(`Preparing ${appointments.length} local appointments for sync...`);
            
            // Get sync options from UI (reuse Google Calendar options)
            const notificationValue = this.notificationMinutesSelect.value;
            const syncOptions = {
                appointmentNotificationMinutes: notificationValue === '' ? null : parseInt(notificationValue),
                clearExisting: this.clearExistingCheckbox.checked
            };
            
            this.updateProgress(50);
            this.logMessage('Converting local appointments to Protocol 3 EEPROM format...');
            
            const syncResult = await this.calendarSync.syncCalendarToWatch(
                appointments, 
                syncOptions
            );
            
            this.updateProgress(75);
            this.logMessage('Writing local appointment data to watch...');
            
            this.updateProgress(100);
            
            // Report sync results
            const successMessage = `Local calendar sync completed: ${syncResult.appointmentsSynced}/${syncResult.totalRequested} appointments synced`;
            this.updateStatus(successMessage);
            this.logMessage(successMessage);
            
            if (syncResult.errors.length > 0) {
                this.logMessage(`Sync warnings/errors: ${syncResult.errors.length}`);
                syncResult.errors.forEach(error => {
                    this.logMessage(`  - ${error.appointment || error.type}: ${error.error}`);
                });
            }
            
            this.hideProgress();
            
        } catch (error) {
            console.error('Error syncing local calendar:', error);
            this.updateStatus(`Local calendar sync failed: ${error.message}`);
            this.logMessage(`Local calendar sync error: ${error.message}`);
            this.hideProgress();
        }
    }
    
    updateLocalCalendarStatus() {
        if (!this.localCalendarUI) {
            this.localCalendarEventsCount.textContent = 'No local events loaded';
            this.syncLocalCalendarBtn.disabled = true;
            return;
        }
        
        const upcomingEvents = this.localCalendarUI.getEventsForSync();
        const todaysEvents = this.localCalendarUI.calendar.getTodaysEvents();
        
        this.localCalendarEventsCount.textContent = 
            `${todaysEvents.length} events today, ${upcomingEvents.length} upcoming events`;
        
        this.syncLocalCalendarBtn.disabled = !this.isConnected || upcomingEvents.length === 0;
    }
    
    async debugSerialPorts() {
        try {
            this.logMessage('Checking Web Serial API support...');
            
            if (!('serial' in navigator)) {
                this.logMessage('❌ Web Serial API not supported in this browser');
                return;
            }
            
            this.logMessage('✅ Web Serial API is supported');
            
            // Check for previously authorized ports
            const existingPorts = await navigator.serial.getPorts();
            this.logMessage(`Found ${existingPorts.length} previously authorized ports:`);
            
            existingPorts.forEach((port, index) => {
                const info = port.getInfo();
                this.logMessage(`  Port ${index + 1}: VendorID=0x${info.usbVendorId?.toString(16) || 'unknown'}, ProductID=0x${info.usbProductId?.toString(16) || 'unknown'}`);
            });
            
            // Try to request a new port
            this.logMessage('Attempting to request new port (this will show the device picker)...');
            
        } catch (error) {
            this.logMessage(`❌ Debug error: ${error.message}`);
        }
    }

    async handleConnect() {
        try {
            if (!this.isConnected) {
                this.updateConnectionLight('connecting');
                this.updateStatus('Connecting to device...');
                this.logMessage('Initiating connection...');
                
                // Check Web Serial API support
                if (!('serial' in navigator)) {
                    throw new Error('Web Serial API not supported in this browser');
                }
                
                // Get connection parameters from UI
                const protocol = parseInt(this.protocolSelect.value);
                const byteSleep = parseInt(this.byteSleepInput.value);
                const packetSleep = parseInt(this.packetSleepInput.value);
                const verbose = this.verboseModeCheckbox.checked;
                
                this.logMessage(`Requesting serial port access...`);
                
                // Check if we're in a secure context
                if (!window.isSecureContext) {
                    throw new Error('Web Serial API requires a secure context (HTTPS or localhost)');
                }
                
                // Request serial port - show all available serial devices
                const port = await navigator.serial.requestPort();
                
                this.currentPort = port;
                this.logMessage(`Port selected: ${port.getInfo ? JSON.stringify(port.getInfo()) : 'Unknown device'}`);
                
                // Create serial adapter with UI parameters
                this.serialAdapter = new SerialAdapter({
                    port: port,
                    byteSleep: byteSleep,
                    packetSleep: packetSleep,
                    verbose: verbose
                });
                
                this.logMessage('Connecting to serial port...');
                await this.serialAdapter.connect();
                
                // Create client with protocol selection
                this.client = new TimexDatalinkClient({
                    serialDevice: this.serialAdapter,
                    models: [],
                    verbose: verbose,
                    protocol: protocol,
                    deviceInfo: { protocol: protocol }
                });
                
                // Set the protocol explicitly
                try {
                    this.client.setProtocol(protocol, { protocol: protocol });
                    const protocolInfo = this.protocolCapabilities[protocol];
                    this.logMessage(`Protocol ${protocol} configured successfully - ${protocolInfo.name}`);
                    
                    this.logMessage(`✅ ${protocolInfo.name} fully implemented with ${protocolInfo.functions.length} available functions`);
                    if (protocolInfo.bidirectional) {
                        this.logMessage(`📡 Bidirectional communication supported`);
                    }
                    if (protocolInfo.maxAlarms > 0) {
                        this.logMessage(`⏰ Supports up to ${protocolInfo.maxAlarms} alarms`);
                    }
                } catch (protocolError) {
                    this.logMessage(`Warning: Protocol ${protocol} configuration failed: ${protocolError.message}`);
                }
                
                // Update calendar sync integration with client
                this.calendarSync = new CalendarSyncIntegration(this.client);
                
                this.isConnected = true;
                this.connectBtn.textContent = 'Disconnect';
                this.updateConnectionLight('connected');
                this.updateConnectionStatus(true);
                this.updateDeviceDetails(port, protocol);
                this.enableSyncButtons(true);
                this.updateStatus('Connected to Timex Datalink device');
                this.logMessage('Connection established successfully!');
                
            } else {
                // Disconnect
                await this.disconnect();
            }
        } catch (error) {
            console.error('Connection error:', error);
            this.updateConnectionLight('disconnected');
            this.updateStatus(`Connection failed: ${error.message}`);
            this.logMessage(`Connection error: ${error.message}`);
            this.showConnectionError(error);
        }
    }
    
    async disconnect() {
        try {
            this.logMessage('Disconnecting from device...');
            
            if (this.serialAdapter) {
                await this.serialAdapter.disconnect();
            }
            
            this.client = null;
            this.serialAdapter = null;
            this.currentPort = null;
            this.isConnected = false;
            
            // Reset calendar sync integration
            this.calendarSync = new CalendarSyncIntegration(null);
            this.connectBtn.textContent = 'Connect Device';
            this.updateConnectionLight('disconnected');
            this.updateConnectionStatus(false);
            this.hideDeviceDetails();
            this.enableSyncButtons(false);
            this.updateStatus('Disconnected');
            this.logMessage('Device disconnected successfully');
        } catch (error) {
            console.error('Disconnect error:', error);
            this.updateStatus(`Disconnect error: ${error.message}`);
            this.logMessage(`Disconnect error: ${error.message}`);
        }
    }
    
    async handleTestConnection() {
        if (!this.client) return;
        
        try {
            this.updateStatus('Testing connection...');
            this.logMessage('Testing device connection...');
            this.showProgress('Testing connection...', 0);
            
            const protocol = parseInt(this.protocolSelect.value);
            const protocolInfo = this.protocolCapabilities[protocol];
            
            this.logMessage(`Testing ${protocolInfo.name} connectivity...`);
            this.updateProgress(25);
            
            // Get protocol instance and test basic Start/End sequence
            const protocolInstance = this.client.getProtocolInfo();
            if (protocolInstance) {
                this.logMessage(`Protocol instance created: ${protocolInstance.name}`);
                this.updateProgress(50);
                
                // Test full protocol functionality
                {
                    this.logMessage('Testing full protocol implementation...');
                    this.updateProgress(75);
                    // For fully implemented protocols, could do more comprehensive testing
                }
                
                this.updateProgress(100);
                this.updateStatus('Connection test successful');
                this.logMessage(`✓ ${protocolInfo.name} connection test completed successfully`);
                
            } else {
                throw new Error('Failed to get protocol instance');
            }
            
            this.hideProgress();
        } catch (error) {
            console.error('Connection test error:', error);
            this.updateStatus(`Connection test failed: ${error.message}`);
            this.logMessage(`✗ Connection test failed: ${error.message}`);
            this.hideProgress();
        }
    }
    
    handleProtocolChange() {
        const selectedProtocol = parseInt(this.protocolSelect.value);
        const protocolInfo = this.protocolCapabilities[selectedProtocol];
        
        if (protocolInfo) {
            const featuresText = protocolInfo.features.join(', ');
            const statusClass = protocolInfo.status === 'Fully Implemented' ? 'status-implemented' : 'status-template';
            
            this.protocolCapabilitiesList.innerHTML = `
                <span class="features-list">${featuresText}</span>
                <span class="protocol-status ${statusClass}">(${protocolInfo.status})</span>
                ${protocolInfo.bidirectional ? '<span class="bidirectional-indicator">📡 Bidirectional</span>' : ''}
                ${protocolInfo.maxAlarms > 0 ? `<span class="alarm-count">⏰ ${protocolInfo.maxAlarms} Alarms</span>` : ''}
            `;
            
            // Update functions list
            if (this.protocolFunctionsList && protocolInfo.functions) {
                this.protocolFunctionsList.innerHTML = `
                    <ul class="functions-list">
                        ${protocolInfo.functions.map(func => `<li>${func}</li>`).join('')}
                    </ul>
                `;
            }
            
            // Update UI based on protocol capabilities
            this.updateUIForProtocol(selectedProtocol, protocolInfo);
            this.updateAdvancedUIForProtocol(selectedProtocol, protocolInfo);
        } else {
            this.protocolCapabilitiesList.textContent = 'Unknown protocol';
            if (this.protocolFunctionsList) {
                this.protocolFunctionsList.textContent = 'Unknown protocol';
            }
        }
    }
    
    updateUIForProtocol(protocol, protocolInfo) {
        // Show/hide features based on protocol capabilities
        const hasTime = protocolInfo.features.includes('Time');
        const hasAlarms = protocolInfo.features.includes('Alarms');
        const hasEeprom = protocolInfo.features.includes('EEPROM Data');
        const hasSoundOptions = protocolInfo.features.includes('Sound Options');
        
        // Update tab visibility or styling based on protocol
        const timeTab = document.querySelector('[data-tab="time"]');
        const alarmsTab = document.querySelector('[data-tab="alarms"]');
        const eepromTab = document.querySelector('[data-tab="eeprom"]');
        
        if (timeTab) {
            timeTab.style.opacity = hasTime ? '1' : '0.5';
            timeTab.title = hasTime ? '' : 'Not supported by this protocol';
        }
        
        if (alarmsTab) {
            alarmsTab.style.opacity = hasAlarms ? '1' : '0.5';
            alarmsTab.title = hasAlarms ? '' : 'Not supported by this protocol';
        }
        
        if (eepromTab) {
            eepromTab.style.opacity = hasEeprom ? '1' : '0.5';
            eepromTab.title = hasEeprom ? '' : 'Not supported by this protocol';
        }
        
        // Special handling for Protocol 7 (DSI e-BRAIN) - no time/alarms
        if (protocol === 7) {
            if (timeTab) timeTab.style.display = 'none';
            if (alarmsTab) alarmsTab.style.display = 'none';
        } else {
            if (timeTab) timeTab.style.display = '';
            if (alarmsTab) alarmsTab.style.display = '';
        }
        
        this.logMessage(`Protocol ${protocol} selected: ${protocolInfo.name} - ${protocolInfo.status}`);
    }
    
    updateAdvancedUIForProtocol(protocol, protocolInfo) {
        // Hide all protocol-specific sections first
        const protocol6SoundOptions = document.getElementById('protocol6-sound-options');
        const protocol6PagerOptions = document.getElementById('protocol6-pager-options');
        const protocol6NightMode = document.getElementById('protocol6-night-mode');
        const protocol9Timers = document.getElementById('protocol9-timers');
        const protocol7Games = document.getElementById('protocol7-games');
        const protocol4WristApps = document.getElementById('protocol4-wrist-apps');
        
        // Hide all sections
        [protocol6SoundOptions, protocol6PagerOptions, protocol6NightMode, 
         protocol9Timers, protocol7Games, protocol4WristApps].forEach(element => {
            if (element) element.style.display = 'none';
        });
        
        // Show protocol-specific sections
        if (protocol === 6) {
            if (protocol6SoundOptions) protocol6SoundOptions.style.display = 'block';
            if (protocol6PagerOptions) protocol6PagerOptions.style.display = 'block';
            if (protocol6NightMode) protocol6NightMode.style.display = 'block';
        } else if (protocol === 9) {
            if (protocol9Timers) protocol9Timers.style.display = 'block';
        } else if (protocol === 7) {
            if (protocol7Games) protocol7Games.style.display = 'block';
        } else if (protocol === 4) {
            if (protocol4WristApps) protocol4WristApps.style.display = 'block';
        }
        
        // Update advanced tab visibility
        const advancedTab = document.querySelector('[data-tab="advanced"]');
        const hasAdvancedFeatures = [3, 4, 6, 7, 9].includes(protocol);
        
        if (advancedTab) {
            advancedTab.style.display = hasAdvancedFeatures ? '' : 'none';
            advancedTab.style.opacity = hasAdvancedFeatures ? '1' : '0.5';
            advancedTab.title = hasAdvancedFeatures ? '' : 'No advanced features for this protocol';
        }
    }
    
    initializeTabs() {
        const tabs = document.querySelectorAll('.tab');
        const tabPanels = document.querySelectorAll('.tab-panel');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // Remove active class from all tabs and panels
                tabs.forEach(t => t.classList.remove('active'));
                tabPanels.forEach(panel => {
                    panel.classList.add('hidden');
                    panel.classList.remove('active');
                });
                
                // Add active class to clicked tab and corresponding panel
                tab.classList.add('active');
                const targetPanel = document.getElementById(`${targetTab}-tab`);
                if (targetPanel) {
                    targetPanel.classList.remove('hidden');
                    targetPanel.classList.add('active');
                }
            });
        });
    }
    
    setCurrentTime() {
        const now = new Date();
        const localDateTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
        this.currentTimeInput.value = localDateTime.toISOString().slice(0, 16);
    }
    
    async handleReadTime() {
        if (!this.client) return;
        
        try {
            this.updateStatus('Reading time from device...');
            this.logMessage('Reading current time from watch...');
            this.showProgress('Reading time...', 0);
            
            const protocol = parseInt(this.protocolSelect.value);
            const protocolInfo = this.protocolCapabilities[protocol];
            
            if (!protocolInfo.features.includes('Time')) {
                throw new Error(`Protocol ${protocol} does not support time reading`);
            }
            
            // Note: Most Timex Datalink protocols are write-only, not bidirectional
            // This is a limitation of the original hardware design
            if (!protocolInfo.bidirectional) {
                this.updateProgress(100);
                this.updateStatus('Time read not supported - protocol is write-only');
                this.logMessage(`Protocol ${protocol} (${protocolInfo.name}) is write-only. Cannot read time from device.`);
                this.logMessage('Tip: Use "Sync Time" to write current time to the watch instead.');
                this.displayTime.textContent = 'Read not supported (write-only protocol)';
                this.hideProgress();
                return;
            }
            
            // For bidirectional protocols (like Protocol 4), implement actual reading
            this.updateProgress(25);
            this.logMessage('Sending read time request...');
            
            // Create a minimal read workflow using protocol manager
            const readWorkflow = this.client.createProtocolSyncWorkflow({
                start: {},
                end: {}
            });
            
            this.updateProgress(50);
            
            // Execute read operation
            const result = await this.client.sync({
                writeData: true,  // Send read request
                readData: true,   // Read response
                expectedReadBytes: 16, // Typical time response size
                readTimeout: 3000
            });
            
            this.updateProgress(75);
            
            if (result.success && result.readResult && result.readResult.data.length > 0) {
                // Parse time data (implementation would depend on protocol specifics)
                const timeData = this.parseTimeResponse(result.readResult.data, protocol);
                this.displayTime.textContent = timeData.formatted;
                this.updateStatus('Time read successfully');
                this.logMessage(`Time read from device: ${timeData.formatted}`);
            } else {
                throw new Error('No valid time data received from device');
            }
            
            this.updateProgress(100);
            this.hideProgress();
            
        } catch (error) {
            console.error('Read time error:', error);
            this.updateStatus(`Read time failed: ${error.message}`);
            this.logMessage(`Read time error: ${error.message}`);
            this.hideProgress();
        }
    }
    
    async handleSyncTime() {
        if (!this.client) return;
        
        try {
            this.updateStatus('Syncing time...');
            this.logMessage('Syncing time to watch...');
            this.showProgress('Syncing time...', 0);
            
            const timeValue = this.currentTimeInput.value;
            const timeZone = parseInt(this.timeZoneSelect.value);
            const protocol = parseInt(this.protocolSelect.value);
            const protocolInfo = this.protocolCapabilities[protocol];
            
            if (!timeValue) {
                throw new Error('Please set a time value first');
            }
            
            if (!protocolInfo.features.includes('Time')) {
                throw new Error(`Protocol ${protocol} does not support time setting`);
            }
            
            this.logMessage(`Setting time to: ${timeValue} (UTC${timeZone >= 0 ? '+' : ''}${timeZone})`);
            
            const targetTime = new Date(timeValue);
            
            // Adjust for timezone offset
            const adjustedTime = new Date(targetTime.getTime() + (timeZone * 60 * 60 * 1000));
            
            this.updateProgress(25);
            this.logMessage('Creating time sync workflow...');
            
            // Create sync workflow with time data
            const syncData = {
                start: {},
                time: {
                    zone: 1, // Primary time zone
                    is24h: true, // Default to 24h format
                    time: adjustedTime
                }
            };
            
            // Add protocol-specific time data
            if (protocol === 3 || protocol === 4) {
                syncData.time.dateFormat = "%_m-%d-%y"; // MM-DD-YY format
                syncData.time.name = `tz${timeZone >= 0 ? '+' : ''}${timeZone}`;
            }
            
            if (protocol === 1 || protocol === 9) {
                // Protocol 1 and 9 support time names
                syncData.timeName = {
                    zone: 1,
                    name: `UTC${timeZone >= 0 ? '+' : ''}${timeZone}`.substring(0, 3)
                };
            }
            
            // Always add end packet
            syncData.end = {};
            
            this.updateProgress(50);
            this.logMessage('Sending time data to watch...');
            
            // Create and execute sync workflow
            const workflow = this.client.createProtocolSyncWorkflow(syncData);
            
            // Replace client models with sync workflow
            const originalModels = this.client.models;
            this.client.models = workflow;
            
            try {
                const result = await this.client.write();
                
                this.updateProgress(85);
                
                if (result.success) {
                    this.updateStatus('Time synced successfully');
                    this.logMessage(`Time sync completed: ${result.packetsWritten} packets sent`);
                    this.displayTime.textContent = adjustedTime.toLocaleString();
                } else {
                    throw new Error(result.message || 'Time sync failed');
                }
                
            } finally {
                // Restore original models
                this.client.models = originalModels;
            }
            
            this.updateProgress(100);
            this.hideProgress();
            
        } catch (error) {
            console.error('Sync time error:', error);
            this.updateStatus(`Sync time failed: ${error.message}`);
            this.logMessage(`Sync time error: ${error.message}`);
            this.hideProgress();
        }
    }
    
    async handleReadAlarms() {
        if (!this.client) return;
        
        try {
            this.updateStatus('Reading alarms from device...');
            this.logMessage('Reading alarm settings from watch...');
            this.showProgress('Reading alarms...', 0);
            
            const protocol = parseInt(this.protocolSelect.value);
            const protocolInfo = this.protocolCapabilities[protocol];
            
            if (!protocolInfo.features.includes('Alarms')) {
                throw new Error(`Protocol ${protocol} does not support alarms`);
            }
            
            // Most protocols are write-only
            if (!protocolInfo.bidirectional) {
                this.updateProgress(100);
                this.updateStatus('Alarm read not supported - protocol is write-only');
                this.logMessage(`Protocol ${protocol} (${protocolInfo.name}) is write-only. Cannot read alarms from device.`);
                this.logMessage('Tip: Use "Write Alarms" to send alarm settings to the watch instead.');
                this.displayAlarms.textContent = 'Read not supported (write-only protocol)';
                this.hideProgress();
                return;
            }
            
            // For bidirectional protocols, implement actual reading
            this.updateProgress(50);
            this.logMessage('Sending read alarms request...');
            
            const result = await this.client.sync({
                writeData: true,
                readData: true,
                expectedReadBytes: protocolInfo.maxAlarms * 16, // Estimate based on alarm count
                readTimeout: 3000
            });
            
            this.updateProgress(75);
            
            if (result.success && result.readResult && result.readResult.data.length > 0) {
                const alarmData = this.parseAlarmResponse(result.readResult.data, protocol);
                this.displayAlarms.textContent = `${alarmData.count} alarms configured`;
                this.populateAlarmUI(alarmData.alarms);
                this.updateStatus('Alarms read successfully');
                this.logMessage(`Read ${alarmData.count} alarms from device`);
            } else {
                throw new Error('No valid alarm data received from device');
            }
            
            this.updateProgress(100);
            this.hideProgress();
            
        } catch (error) {
            console.error('Read alarms error:', error);
            this.updateStatus(`Read alarms failed: ${error.message}`);
            this.logMessage(`Read alarms error: ${error.message}`);
            this.hideProgress();
        }
    }
    
    async handleWriteAlarms() {
        if (!this.client) return;
        
        try {
            this.updateStatus('Writing alarms to device...');
            this.logMessage('Writing alarm settings to watch...');
            this.showProgress('Writing alarms...', 0);
            
            const protocol = parseInt(this.protocolSelect.value);
            const protocolInfo = this.protocolCapabilities[protocol];
            
            if (!protocolInfo.features.includes('Alarms')) {
                throw new Error(`Protocol ${protocol} does not support alarms`);
            }
            
            this.updateProgress(25);
            this.logMessage('Collecting alarm data from UI...');
            
            // Collect alarm data from UI
            const alarms = this.collectAlarmDataFromUI();
            
            if (alarms.length === 0) {
                throw new Error('No alarms configured. Please set at least one alarm.');
            }
            
            this.logMessage(`Preparing ${alarms.length} alarms for sync...`);
            
            this.updateProgress(50);
            this.logMessage('Creating alarm sync workflow...');
            
            // Create sync workflow with alarm data
            // Protocol factory expects 'alarms' (plural) not 'alarm'
            const syncData = {
                start: {},
                alarms: alarms, // Protocol factory expects 'alarms' array
                end: {}
            };
            
            // Create and execute sync workflow
            const workflow = this.client.createProtocolSyncWorkflow(syncData);
            
            // Replace client models with sync workflow
            const originalModels = this.client.models;
            this.client.models = workflow;
            
            try {
                this.updateProgress(75);
                this.logMessage('Sending alarm data to watch...');
                
                const result = await this.client.write();
                
                if (result.success) {
                    this.updateStatus('Alarms written successfully');
                    this.logMessage(`Alarm sync completed: ${result.packetsWritten} packets sent`);
                    this.displayAlarms.textContent = `${alarms.length} alarms configured`;
                } else {
                    throw new Error(result.message || 'Alarm write failed');
                }
                
            } finally {
                // Restore original models
                this.client.models = originalModels;
            }
            
            this.updateProgress(100);
            this.hideProgress();
            
        } catch (error) {
            console.error('Write alarms error:', error);
            this.updateStatus(`Write alarms failed: ${error.message}`);
            this.logMessage(`Write alarms error: ${error.message}`);
            this.hideProgress();
        }
    }
    
    async handleReadEeprom() {
        if (!this.client) return;
        
        try {
            this.updateStatus('Reading EEPROM data from device...');
            this.logMessage('Reading EEPROM data from watch...');
            this.showProgress('Reading EEPROM...', 0);
            
            const protocol = parseInt(this.protocolSelect.value);
            const protocolInfo = this.protocolCapabilities[protocol];
            
            if (!protocolInfo.features.includes('EEPROM Data')) {
                throw new Error(`Protocol ${protocol} does not support EEPROM data`);
            }
            
            // Most protocols are write-only
            if (!protocolInfo.bidirectional) {
                this.updateProgress(100);
                this.updateStatus('EEPROM read not supported - protocol is write-only');
                this.logMessage(`Protocol ${protocol} (${protocolInfo.name}) is write-only. Cannot read EEPROM from device.`);
                this.logMessage('Tip: Use "Write EEPROM" to send phone numbers and appointments to the watch instead.');
                this.displayEeprom.textContent = 'Read not supported (write-only protocol)';
                this.hideProgress();
                return;
            }
            
            // For bidirectional protocols, implement actual reading
            this.updateProgress(50);
            this.logMessage('Sending read EEPROM request...');
            
            const result = await this.client.sync({
                writeData: true,
                readData: true,
                expectedReadBytes: 512, // Typical EEPROM size
                readTimeout: 5000
            });
            
            this.updateProgress(75);
            
            if (result.success && result.readResult && result.readResult.data.length > 0) {
                const eepromData = this.parseEepromResponse(result.readResult.data, protocol);
                this.displayEeprom.textContent = `${eepromData.phoneNumbers.length} phone numbers, ${eepromData.appointments.length} appointments loaded`;
                this.populateEepromUI(eepromData);
                this.updateStatus('EEPROM data read successfully');
                this.logMessage(`Read EEPROM: ${eepromData.phoneNumbers.length} phone numbers, ${eepromData.appointments.length} appointments`);
            } else {
                throw new Error('No valid EEPROM data received from device');
            }
            
            this.updateProgress(100);
            this.hideProgress();
            
        } catch (error) {
            console.error('Read EEPROM error:', error);
            this.updateStatus(`Read EEPROM failed: ${error.message}`);
            this.logMessage(`Read EEPROM error: ${error.message}`);
            this.hideProgress();
        }
    }
    
    async handleWriteEeprom() {
        if (!this.client) return;
        
        try {
            this.updateStatus('Writing EEPROM data to device...');
            this.logMessage('Writing EEPROM data to watch...');
            this.showProgress('Writing EEPROM...', 0);
            
            const protocol = parseInt(this.protocolSelect.value);
            const protocolInfo = this.protocolCapabilities[protocol];
            
            if (!protocolInfo.features.includes('EEPROM Data')) {
                throw new Error(`Protocol ${protocol} does not support EEPROM data`);
            }
            
            this.updateProgress(25);
            this.logMessage('Collecting EEPROM data from UI...');
            
            // Collect EEPROM data from UI
            const eepromData = this.collectEepromDataFromUI();
            
            if (eepromData.phoneNumbers.length === 0 && eepromData.appointments.length === 0) {
                throw new Error('No EEPROM data configured. Please add phone numbers or appointments.');
            }
            
            this.logMessage(`Preparing ${eepromData.phoneNumbers.length} phone numbers and ${eepromData.appointments.length} appointments for sync...`);
            
            this.updateProgress(50);
            this.logMessage('Creating EEPROM sync workflow...');
            
            // Create sync workflow with EEPROM data
            // Note: Protocol factory expects lowercase keys that match component names
            const syncData = {
                start: {},
                eeprom: eepromData, // This should work if eeprom components exist
                end: {}
            };
            
            // Create and execute sync workflow
            const workflow = this.client.createProtocolSyncWorkflow(syncData);
            
            // Replace client models with sync workflow
            const originalModels = this.client.models;
            this.client.models = workflow;
            
            try {
                this.updateProgress(75);
                this.logMessage('Sending EEPROM data to watch...');
                
                const result = await this.client.write();
                
                if (result.success) {
                    this.updateStatus('EEPROM data written successfully');
                    this.logMessage(`EEPROM sync completed: ${result.packetsWritten} packets sent`);
                    this.displayEeprom.textContent = `${eepromData.phoneNumbers.length} phone numbers, ${eepromData.appointments.length} appointments written`;
                } else {
                    throw new Error(result.message || 'EEPROM write failed');
                }
                
            } finally {
                // Restore original models
                this.client.models = originalModels;
            }
            
            this.updateProgress(100);
            this.hideProgress();
            
        } catch (error) {
            console.error('Write EEPROM error:', error);
            this.updateStatus(`Write EEPROM failed: ${error.message}`);
            this.logMessage(`Write EEPROM error: ${error.message}`);
            this.hideProgress();
        }
    }
    
    async handleReadAll() {
        if (!this.client) return;
        
        try {
            this.updateStatus('Reading all data from device...');
            this.logMessage('Reading all data from watch...');
            this.showProgress('Reading all data...', 0);
            
            const protocol = parseInt(this.protocolSelect.value);
            const protocolInfo = this.protocolCapabilities[protocol];
            
            // Check if protocol supports reading
            if (!protocolInfo.bidirectional) {
                this.updateProgress(100);
                this.updateStatus('Read all not supported - protocol is write-only');
                this.logMessage(`Protocol ${protocol} (${protocolInfo.name}) is write-only. Cannot read data from device.`);
                this.logMessage('Tip: Use individual "Write" functions to send data to the watch instead.');
                this.displayTime.textContent = 'Read not supported (write-only protocol)';
                this.displayAlarms.textContent = 'Read not supported (write-only protocol)';
                this.displayEeprom.textContent = 'Read not supported (write-only protocol)';
                this.hideProgress();
                return;
            }
            
            let successCount = 0;
            let totalOperations = 0;
            
            // Count available operations
            if (protocolInfo.features.includes('Time')) totalOperations++;
            if (protocolInfo.features.includes('Alarms')) totalOperations++;
            if (protocolInfo.features.includes('EEPROM Data')) totalOperations++;
            
            if (totalOperations === 0) {
                throw new Error('No readable features available for this protocol');
            }
            
            let currentOperation = 0;
            
            // Read time if supported
            if (protocolInfo.features.includes('Time')) {
                try {
                    this.updateProgress((currentOperation / totalOperations) * 100);
                    this.logMessage('Reading time...');
                    
                    const timeResult = await this.readTimeData();
                    if (timeResult.success) {
                        this.displayTime.textContent = timeResult.data.formatted;
                        successCount++;
                        this.logMessage('✓ Time read successfully');
                    } else {
                        this.logMessage('✗ Time read failed: ' + timeResult.error);
                        this.displayTime.textContent = 'Read failed';
                    }
                } catch (error) {
                    this.logMessage('✗ Time read error: ' + error.message);
                    this.displayTime.textContent = 'Read error';
                }
                currentOperation++;
            }
            
            // Read alarms if supported
            if (protocolInfo.features.includes('Alarms')) {
                try {
                    this.updateProgress((currentOperation / totalOperations) * 100);
                    this.logMessage('Reading alarms...');
                    
                    const alarmResult = await this.readAlarmData();
                    if (alarmResult.success) {
                        this.displayAlarms.textContent = `${alarmResult.data.count} alarms configured`;
                        this.populateAlarmUI(alarmResult.data.alarms);
                        successCount++;
                        this.logMessage('✓ Alarms read successfully');
                    } else {
                        this.logMessage('✗ Alarms read failed: ' + alarmResult.error);
                        this.displayAlarms.textContent = 'Read failed';
                    }
                } catch (error) {
                    this.logMessage('✗ Alarms read error: ' + error.message);
                    this.displayAlarms.textContent = 'Read error';
                }
                currentOperation++;
            }
            
            // Read EEPROM if supported
            if (protocolInfo.features.includes('EEPROM Data')) {
                try {
                    this.updateProgress((currentOperation / totalOperations) * 100);
                    this.logMessage('Reading EEPROM data...');
                    
                    const eepromResult = await this.readEepromData();
                    if (eepromResult.success) {
                        this.displayEeprom.textContent = `${eepromResult.data.phoneNumbers.length} phone numbers, ${eepromResult.data.appointments.length} appointments loaded`;
                        this.populateEepromUI(eepromResult.data);
                        successCount++;
                        this.logMessage('✓ EEPROM read successfully');
                    } else {
                        this.logMessage('✗ EEPROM read failed: ' + eepromResult.error);
                        this.displayEeprom.textContent = 'Read failed';
                    }
                } catch (error) {
                    this.logMessage('✗ EEPROM read error: ' + error.message);
                    this.displayEeprom.textContent = 'Read error';
                }
                currentOperation++;
            }
            
            this.updateProgress(100);
            
            if (successCount === totalOperations) {
                this.updateStatus('All data read successfully');
                this.logMessage(`✓ All data read successfully (${successCount}/${totalOperations} operations)`);
            } else if (successCount > 0) {
                this.updateStatus(`Partial read completed (${successCount}/${totalOperations} successful)`);
                this.logMessage(`⚠ Partial read completed: ${successCount}/${totalOperations} operations successful`);
            } else {
                throw new Error('All read operations failed');
            }
            
            this.hideProgress();
            
        } catch (error) {
            console.error('Read all error:', error);
            this.updateStatus(`Read all failed: ${error.message}`);
            this.logMessage(`Read all error: ${error.message}`);
            this.hideProgress();
        }
    }
    
    async handleWriteAll() {
        if (!this.client) return;
        
        try {
            this.updateStatus('Writing all data to device...');
            this.logMessage('Writing all data to watch...');
            this.showProgress('Writing all data...', 0);
            
            const protocol = parseInt(this.protocolSelect.value);
            const protocolInfo = this.protocolCapabilities[protocol];
            
            let successCount = 0;
            let totalOperations = 0;
            
            // Count available operations
            if (protocolInfo.features.includes('Time')) totalOperations++;
            if (protocolInfo.features.includes('Alarms')) totalOperations++;
            if (protocolInfo.features.includes('EEPROM Data')) totalOperations++;
            
            if (totalOperations === 0) {
                throw new Error('No writable features available for this protocol');
            }
            
            // Collect all data first
            const timeValue = this.currentTimeInput.value;
            const timeZone = parseInt(this.timeZoneSelect.value);
            const alarms = this.collectAlarmDataFromUI();
            const eepromData = this.collectEepromDataFromUI();
            
            // Build comprehensive sync data
            const syncData = {
                start: {}
            };
            
            let currentOperation = 0;
            
            // Add time data if supported and configured
            if (protocolInfo.features.includes('Time') && timeValue) {
                this.updateProgress((currentOperation / totalOperations) * 100);
                this.logMessage('Preparing time data...');
                
                const targetTime = new Date(timeValue);
                const adjustedTime = new Date(targetTime.getTime() + (timeZone * 60 * 60 * 1000));
                
                syncData.time = {
                    zone: 1,
                    is24h: true,
                    time: adjustedTime
                };
                
                // Add protocol-specific time data
                if (protocol === 3 || protocol === 4) {
                    syncData.time.dateFormat = "%_m-%d-%y";
                    syncData.time.name = `tz${timeZone >= 0 ? '+' : ''}${timeZone}`;
                }
                
                if (protocol === 1 || protocol === 9) {
                    // Protocol 1 and 9 support separate time name packets
                    syncData.timeName = {
                        zone: 1,
                        name: `UTC${timeZone >= 0 ? '+' : ''}${timeZone}`.substring(0, 3)
                    };
                }
                
                currentOperation++;
                this.logMessage('✓ Time data prepared');
            }
            
            // Add alarm data if supported and configured
            if (protocolInfo.features.includes('Alarms') && alarms.length > 0) {
                this.updateProgress((currentOperation / totalOperations) * 100);
                this.logMessage(`Preparing ${alarms.length} alarms...`);
                
                syncData.alarms = alarms; // Use 'alarms' (plural) to match protocol factory
                currentOperation++;
                this.logMessage('✓ Alarm data prepared');
            }
            
            // Add EEPROM data if supported and configured
            if (protocolInfo.features.includes('EEPROM Data') && 
                (eepromData.phoneNumbers.length > 0 || eepromData.appointments.length > 0)) {
                this.updateProgress((currentOperation / totalOperations) * 100);
                this.logMessage(`Preparing EEPROM data (${eepromData.phoneNumbers.length} phone numbers, ${eepromData.appointments.length} appointments)...`);
                
                syncData.eeprom = eepromData;
                currentOperation++;
                this.logMessage('✓ EEPROM data prepared');
            }
            
            // Always add end packet
            syncData.end = {};
            
            // Check if we have any data to sync
            const hasData = Object.keys(syncData).length > 2; // More than just start and end
            if (!hasData) {
                throw new Error('No data configured to write. Please set time, alarms, or EEPROM data first.');
            }
            
            this.updateProgress(75);
            this.logMessage('Creating comprehensive sync workflow...');
            
            // Create and execute sync workflow
            const workflow = this.client.createProtocolSyncWorkflow(syncData);
            
            // Replace client models with sync workflow
            const originalModels = this.client.models;
            this.client.models = workflow;
            
            try {
                this.updateProgress(85);
                this.logMessage('Sending all data to watch...');
                
                const result = await this.client.write();
                
                if (result.success) {
                    this.updateStatus('All data written successfully');
                    this.logMessage(`✓ Complete sync finished: ${result.packetsWritten} packets sent`);
                    
                    // Update displays
                    if (syncData.time) {
                        this.displayTime.textContent = syncData.time.time.toLocaleString();
                    }
                    if (syncData.alarms) {
                        this.displayAlarms.textContent = `${syncData.alarms.length} alarms configured`;
                    }
                    if (syncData.eeprom) {
                        this.displayEeprom.textContent = `${syncData.eeprom.phoneNumbers.length} phone numbers, ${syncData.eeprom.appointments.length} appointments written`;
                    }
                    
                } else {
                    throw new Error(result.message || 'Write all failed');
                }
                
            } finally {
                // Restore original models
                this.client.models = originalModels;
            }
            
            this.updateProgress(100);
            this.hideProgress();
            
        } catch (error) {
            console.error('Write all error:', error);
            this.updateStatus(`Write all failed: ${error.message}`);
            this.logMessage(`Write all error: ${error.message}`);
            this.hideProgress();
        }
    }
    
    updateStatus(message) {
        this.statusText.textContent = message;
        console.log('Status:', message);
    }
    
    updateConnectionStatus(connected) {
        this.connectionStatus.textContent = connected ? 'Connected' : 'Disconnected';
        this.connectionStatus.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
        this.connectionText.textContent = connected ? 'Connected' : 'Not Connected';
    }
    
    updateConnectionLight(status) {
        this.connectionLight.className = `status-light ${status}`;
    }
    
    updateDeviceDetails(port, protocol) {
        const portInfo = port.getInfo ? port.getInfo() : {};
        this.portInfo.textContent = `USB ${portInfo.usbVendorId || 'Unknown'}:${portInfo.usbProductId || 'Unknown'}`;
        this.protocolInfo.textContent = `Protocol ${protocol}`;
        this.statusInfo.textContent = 'Connected';
        this.deviceDetails.classList.remove('hidden');
    }
    
    hideDeviceDetails() {
        this.deviceDetails.classList.add('hidden');
        this.portInfo.textContent = '-';
        this.protocolInfo.textContent = '-';
        this.statusInfo.textContent = '-';
    }
    
    logMessage(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}\n`;
        this.deviceLog.textContent += logEntry;
        this.deviceLog.scrollTop = this.deviceLog.scrollHeight;
    }
    
    showProgress(label, percentage) {
        this.syncProgress.querySelector('.progress-label').textContent = label;
        this.progressFill.style.width = `${percentage}%`;
        this.syncProgress.classList.remove('hidden');
    }
    
    updateProgress(percentage) {
        this.progressFill.style.width = `${percentage}%`;
    }
    
    hideProgress() {
        this.syncProgress.classList.add('hidden');
    }
    
    showConnectionError(error) {
        let errorMessage = 'Connection failed. ';
        
        if (error.name === 'NotFoundError') {
            errorMessage += 'No device selected or device not found.';
        } else if (error.name === 'SecurityError') {
            errorMessage += 'Permission denied. Please allow serial port access.';
        } else if (error.name === 'NetworkError') {
            errorMessage += 'Device communication error. Check cable and device.';
        } else {
            errorMessage += error.message;
        }
        
        this.logMessage(`ERROR: ${errorMessage}`);
    }
    
    enableSyncButtons(enabled) {
        const protocol = parseInt(this.protocolSelect.value);
        const protocolInfo = this.protocolCapabilities[protocol];
        const isFullyImplemented = protocolInfo && protocolInfo.status === 'Fully Implemented';
        
        // Basic connection test is available for all protocols
        this.testConnectionBtn.disabled = !enabled;
        
        // Data operations only available for fully implemented protocols
        const dataOperationsEnabled = enabled && isFullyImplemented;
        
        // Time controls
        this.readTimeBtn.disabled = !dataOperationsEnabled || !protocolInfo.features.includes('Time');
        this.syncTimeBtn.disabled = !dataOperationsEnabled || !protocolInfo.features.includes('Time');
        
        // Alarm controls
        this.readAlarmsBtn.disabled = !dataOperationsEnabled || !protocolInfo.features.includes('Alarms');
        this.writeAlarmsBtn.disabled = !dataOperationsEnabled || !protocolInfo.features.includes('Alarms');
        
        // EEPROM controls
        this.readEepromBtn.disabled = !dataOperationsEnabled || !protocolInfo.features.includes('EEPROM Data');
        this.writeEepromBtn.disabled = !dataOperationsEnabled || !protocolInfo.features.includes('EEPROM Data');
        
        // Sync controls
        this.readAllBtn.disabled = !dataOperationsEnabled;
        this.writeAllBtn.disabled = !dataOperationsEnabled;
        
        // Calendar sync controls (only enable if both connected and authenticated)
        const calendarEnabled = dataOperationsEnabled && this.googleAuth.isUserAuthenticated();
        this.syncCalendarBtn.disabled = !calendarEnabled;
        
        // Local calendar sync controls
        this.updateLocalCalendarStatus();
        
        // Advanced feature controls
        if (this.writeAdvancedBtn) {
            this.writeAdvancedBtn.disabled = !dataOperationsEnabled;
        }
        if (this.readAdvancedBtn) {
            this.readAdvancedBtn.disabled = !dataOperationsEnabled;
        }
        if (this.uploadWristAppBtn) {
            this.uploadWristAppBtn.disabled = !enabled || protocol !== 4;
        }
        if (this.uploadSoundThemeBtn) {
            this.uploadSoundThemeBtn.disabled = !enabled || protocol !== 4;
        }
        
        // Clear button titles (all protocols are now fully implemented)
        this.readTimeBtn.title = '';
        this.syncTimeBtn.title = '';
        this.readAlarmsBtn.title = '';
        this.writeAlarmsBtn.title = '';
        this.readEepromBtn.title = '';
        this.writeEepromBtn.title = '';
        this.readAllBtn.title = '';
        this.writeAllBtn.title = '';
        this.syncCalendarBtn.title = '';
        if (this.writeAdvancedBtn) this.writeAdvancedBtn.title = '';
        if (this.readAdvancedBtn) this.readAdvancedBtn.title = '';
        
        // Disable connection controls when connected
        this.protocolSelect.disabled = enabled;
        this.byteSleepInput.disabled = enabled;
        this.packetSleepInput.disabled = enabled;
        this.verboseModeCheckbox.disabled = enabled;
    }
    
    // Helper Methods for Data Collection and Parsing
    
    /**
     * Parse time response data from device
     */
    parseTimeResponse(data, protocol) {
        try {
            // Basic time parsing - would need protocol-specific implementation
            if (data.length < 8) {
                throw new Error('Insufficient time data received');
            }
            
            // Extract time components (this is a simplified example)
            const hours = data[2] || 0;
            const minutes = data[3] || 0;
            const month = data[4] || 1;
            const day = data[5] || 1;
            const year = 2000 + (data[6] || 24);
            
            const timeDate = new Date(year, month - 1, day, hours, minutes);
            
            return {
                formatted: timeDate.toLocaleString(),
                raw: data,
                components: { hours, minutes, month, day, year }
            };
        } catch (error) {
            return {
                formatted: 'Parse error',
                raw: data,
                error: error.message
            };
        }
    }
    
    /**
     * Parse alarm response data from device
     */
    parseAlarmResponse(data, protocol) {
        try {
            const alarms = [];
            const protocolInfo = this.protocolCapabilities[protocol];
            const maxAlarms = protocolInfo.maxAlarms || 5;
            
            // Parse alarm data (simplified - would need protocol-specific implementation)
            for (let i = 0; i < Math.min(maxAlarms, Math.floor(data.length / 16)); i++) {
                const offset = i * 16;
                const alarmData = data.slice(offset, offset + 16);
                
                if (alarmData.length >= 8) {
                    alarms.push({
                        number: i + 1,
                        hours: alarmData[2] || 0,
                        minutes: alarmData[3] || 0,
                        enabled: (alarmData[7] || 0) > 0,
                        message: this.parseAlarmMessage(alarmData.slice(8, 16))
                    });
                }
            }
            
            return {
                count: alarms.filter(a => a.enabled).length,
                alarms: alarms
            };
        } catch (error) {
            return {
                count: 0,
                alarms: [],
                error: error.message
            };
        }
    }
    
    /**
     * Parse EEPROM response data from device
     */
    parseEepromResponse(data, protocol) {
        try {
            const phoneNumbers = [];
            const appointments = [];
            
            // Parse EEPROM data (simplified - would need protocol-specific implementation)
            // This is a basic parser that would need to be enhanced for each protocol
            
            let offset = 0;
            while (offset < data.length - 32) {
                const entryType = data[offset];
                
                if (entryType === 0x01) { // Phone number entry
                    const phoneData = data.slice(offset + 1, offset + 25);
                    const phone = this.parsePhoneNumberEntry(phoneData);
                    if (phone.name || phone.number) {
                        phoneNumbers.push(phone);
                    }
                    offset += 25;
                } else if (entryType === 0x02) { // Appointment entry
                    const appointmentData = data.slice(offset + 1, offset + 17);
                    const appointment = this.parseAppointmentEntry(appointmentData);
                    if (appointment.message) {
                        appointments.push(appointment);
                    }
                    offset += 17;
                } else {
                    offset++;
                }
            }
            
            return {
                phoneNumbers: phoneNumbers,
                appointments: appointments
            };
        } catch (error) {
            return {
                phoneNumbers: [],
                appointments: [],
                error: error.message
            };
        }
    }
    
    /**
     * Collect alarm data from UI
     */
    collectAlarmDataFromUI() {
        const alarms = [];
        
        for (let i = 1; i <= 3; i++) {
            const enabledCheckbox = document.getElementById(`alarm${i}-enabled`);
            const timeInput = document.getElementById(`alarm${i}-time`);
            const daysSelect = document.getElementById(`alarm${i}-days`);
            
            if (enabledCheckbox && enabledCheckbox.checked && timeInput && timeInput.value) {
                const [hours, minutes] = timeInput.value.split(':').map(Number);
                const alarmTime = new Date();
                alarmTime.setHours(hours, minutes, 0, 0);
                
                alarms.push({
                    number: i,
                    audible: true, // Default to audible
                    time: alarmTime,
                    message: `Alarm ${i}`,
                    days: daysSelect ? daysSelect.value : 'daily'
                });
            }
        }
        
        return alarms;
    }
    
    /**
     * Collect EEPROM data from UI
     */
    collectEepromDataFromUI() {
        const phoneNumbers = [];
        const appointments = [];
        
        // Collect phone numbers
        const phoneItems = document.querySelectorAll('.phone-item');
        phoneItems.forEach((item, index) => {
            const nameInput = item.querySelector('.phone-name');
            const numberInput = item.querySelector('.phone-number');
            
            if (nameInput && numberInput && nameInput.value.trim() && numberInput.value.trim()) {
                phoneNumbers.push({
                    name: nameInput.value.trim(),
                    number: numberInput.value.trim(),
                    type: ' ' // Default type
                });
            }
        });
        
        // Collect appointments
        const appointmentItems = document.querySelectorAll('.appointment-item');
        appointmentItems.forEach((item, index) => {
            const dateInput = item.querySelector('.appointment-date');
            const timeInput = item.querySelector('.appointment-time');
            const descInput = item.querySelector('.appointment-desc');
            
            if (dateInput && timeInput && descInput && 
                dateInput.value && timeInput.value && descInput.value.trim()) {
                
                const appointmentDate = new Date(dateInput.value + 'T' + timeInput.value);
                
                appointments.push({
                    time: appointmentDate,
                    message: descInput.value.trim()
                });
            }
        });
        
        return {
            phoneNumbers: phoneNumbers,
            appointments: appointments
        };
    }
    
    /**
     * Populate alarm UI with data
     */
    populateAlarmUI(alarms) {
        alarms.forEach((alarm, index) => {
            if (index < 3) { // Only populate first 3 alarms in UI
                const alarmNumber = index + 1;
                const enabledCheckbox = document.getElementById(`alarm${alarmNumber}-enabled`);
                const timeInput = document.getElementById(`alarm${alarmNumber}-time`);
                
                if (enabledCheckbox) {
                    enabledCheckbox.checked = alarm.enabled || false;
                }
                
                if (timeInput && alarm.hours !== undefined && alarm.minutes !== undefined) {
                    const timeString = `${alarm.hours.toString().padStart(2, '0')}:${alarm.minutes.toString().padStart(2, '0')}`;
                    timeInput.value = timeString;
                }
            }
        });
    }
    
    /**
     * Populate EEPROM UI with data
     */
    populateEepromUI(eepromData) {
        // Populate phone numbers
        const phoneItems = document.querySelectorAll('.phone-item');
        eepromData.phoneNumbers.forEach((phone, index) => {
            if (index < phoneItems.length) {
                const item = phoneItems[index];
                const nameInput = item.querySelector('.phone-name');
                const numberInput = item.querySelector('.phone-number');
                
                if (nameInput) nameInput.value = phone.name || '';
                if (numberInput) numberInput.value = phone.number || '';
            }
        });
        
        // Populate appointments
        const appointmentItems = document.querySelectorAll('.appointment-item');
        eepromData.appointments.forEach((appointment, index) => {
            if (index < appointmentItems.length) {
                const item = appointmentItems[index];
                const dateInput = item.querySelector('.appointment-date');
                const timeInput = item.querySelector('.appointment-time');
                const descInput = item.querySelector('.appointment-desc');
                
                if (appointment.time && dateInput && timeInput) {
                    const date = new Date(appointment.time);
                    dateInput.value = date.toISOString().split('T')[0];
                    timeInput.value = date.toTimeString().split(' ')[0].substring(0, 5);
                }
                
                if (descInput) descInput.value = appointment.message || '';
            }
        });
    }
    
    /**
     * Helper methods for parsing specific data types
     */
    parseAlarmMessage(messageBytes) {
        // Convert bytes to string, removing null bytes
        return String.fromCharCode(...messageBytes.filter(b => b > 0)).trim();
    }
    
    parsePhoneNumberEntry(data) {
        // Parse phone number entry (simplified)
        const name = String.fromCharCode(...data.slice(0, 12).filter(b => b > 0)).trim();
        const number = String.fromCharCode(...data.slice(12, 24).filter(b => b > 0)).trim();
        
        return { name, number };
    }
    
    parseAppointmentEntry(data) {
        // Parse appointment entry (simplified)
        const message = String.fromCharCode(...data.slice(8, 16).filter(b => b > 0)).trim();
        const month = data[0] || 1;
        const day = data[1] || 1;
        const hours = data[2] || 0;
        const minutes = data[3] || 0;
        
        const appointmentDate = new Date(2024, month - 1, day, hours, minutes);
        
        return {
            time: appointmentDate,
            message: message
        };
    }
    
    /**
     * Individual data reading methods for Read All functionality
     */
    async readTimeData() {
        try {
            const result = await this.client.sync({
                writeData: true,
                readData: true,
                expectedReadBytes: 16,
                readTimeout: 3000
            });
            
            if (result.success && result.readResult && result.readResult.data.length > 0) {
                const protocol = parseInt(this.protocolSelect.value);
                const timeData = this.parseTimeResponse(result.readResult.data, protocol);
                return { success: true, data: timeData };
            } else {
                return { success: false, error: 'No time data received' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async readAlarmData() {
        try {
            const protocol = parseInt(this.protocolSelect.value);
            const protocolInfo = this.protocolCapabilities[protocol];
            
            const result = await this.client.sync({
                writeData: true,
                readData: true,
                expectedReadBytes: protocolInfo.maxAlarms * 16,
                readTimeout: 3000
            });
            
            if (result.success && result.readResult && result.readResult.data.length > 0) {
                const alarmData = this.parseAlarmResponse(result.readResult.data, protocol);
                return { success: true, data: alarmData };
            } else {
                return { success: false, error: 'No alarm data received' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async readEepromData() {
        try {
            const result = await this.client.sync({
                writeData: true,
                readData: true,
                expectedReadBytes: 512,
                readTimeout: 5000
            });
            
            if (result.success && result.readResult && result.readResult.data.length > 0) {
                const protocol = parseInt(this.protocolSelect.value);
                const eepromData = this.parseEepromResponse(result.readResult.data, protocol);
                return { success: true, data: eepromData };
            } else {
                return { success: false, error: 'No EEPROM data received' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Advanced Features Implementation
    
    /**
     * Handle writing advanced settings (sound options, timers, games, etc.)
     */
    async handleWriteAdvanced() {
        if (!this.client) return;
        
        try {
            this.updateStatus('Writing advanced settings to device...');
            this.logMessage('Writing advanced settings to watch...');
            this.showProgress('Writing advanced settings...', 0);
            
            const protocol = parseInt(this.protocolSelect.value);
            const protocolInfo = this.protocolCapabilities[protocol];
            
            this.updateProgress(25);
            this.logMessage('Collecting advanced settings from UI...');
            
            // Collect advanced data based on protocol
            const advancedData = this.collectAdvancedDataFromUI(protocol);
            
            if (Object.keys(advancedData).length === 0) {
                throw new Error('No advanced settings configured. Please configure settings for this protocol.');
            }
            
            this.logMessage(`Preparing advanced settings for ${protocolInfo.name}...`);
            
            this.updateProgress(50);
            this.logMessage('Creating advanced settings sync workflow...');
            
            // Create sync workflow with advanced data
            const syncData = {
                start: {},
                ...advancedData,
                end: {}
            };
            
            // Create and execute sync workflow
            const workflow = this.client.createProtocolSyncWorkflow(syncData);
            
            // Replace client models with sync workflow
            const originalModels = this.client.models;
            this.client.models = workflow;
            
            try {
                this.updateProgress(75);
                this.logMessage('Sending advanced settings to watch...');
                
                const result = await this.client.write();
                
                if (result.success) {
                    this.updateStatus('Advanced settings written successfully');
                    this.logMessage(`Advanced settings sync completed: ${result.packetsWritten} packets sent`);
                } else {
                    throw new Error(result.message || 'Advanced settings write failed');
                }
                
            } finally {
                // Restore original models
                this.client.models = originalModels;
            }
            
            this.updateProgress(100);
            this.hideProgress();
            
        } catch (error) {
            console.error('Write advanced error:', error);
            this.updateStatus(`Write advanced failed: ${error.message}`);
            this.logMessage(`Write advanced error: ${error.message}`);
            this.hideProgress();
        }
    }

    /**
     * Handle reading advanced settings (for bidirectional protocols)
     */
    async handleReadAdvanced() {
        if (!this.client) return;
        
        try {
            this.updateStatus('Reading advanced settings from device...');
            this.logMessage('Reading advanced settings from watch...');
            this.showProgress('Reading advanced settings...', 0);
            
            const protocol = parseInt(this.protocolSelect.value);
            const protocolInfo = this.protocolCapabilities[protocol];
            
            // Most protocols are write-only
            if (!protocolInfo.bidirectional) {
                this.updateProgress(100);
                this.updateStatus('Advanced read not supported - protocol is write-only');
                this.logMessage(`Protocol ${protocol} (${protocolInfo.name}) is write-only. Cannot read advanced settings from device.`);
                this.hideProgress();
                return;
            }
            
            // For bidirectional protocols, implement actual reading
            this.updateProgress(50);
            this.logMessage('Sending read advanced settings request...');
            
            const result = await this.client.sync({
                writeData: true,
                readData: true,
                expectedReadBytes: 256, // Estimate for advanced settings
                readTimeout: 5000
            });
            
            this.updateProgress(75);
            
            if (result.success && result.readResult && result.readResult.data.length > 0) {
                const advancedData = this.parseAdvancedResponse(result.readResult.data, protocol);
                this.populateAdvancedUI(advancedData, protocol);
                this.updateStatus('Advanced settings read successfully');
                this.logMessage(`Advanced settings read from device`);
            } else {
                throw new Error('No valid advanced settings data received from device');
            }
            
            this.updateProgress(100);
            this.hideProgress();
            
        } catch (error) {
            console.error('Read advanced error:', error);
            this.updateStatus(`Read advanced failed: ${error.message}`);
            this.logMessage(`Read advanced error: ${error.message}`);
            this.hideProgress();
        }
    }

    /**
     * Handle wrist app file upload
     */
    async handleUploadWristApp() {
        const file = this.wristAppFile.files[0];
        if (!file) {
            alert('Please select a .zap file first');
            return;
        }
        
        try {
            this.updateStatus('Loading wrist app...');
            this.logMessage(`Loading wrist app: ${file.name}`);
            
            const arrayBuffer = await file.arrayBuffer();
            this.wristAppData = new Uint8Array(arrayBuffer);
            
            this.wristAppStatus.textContent = `${file.name} loaded (${this.wristAppData.length} bytes)`;
            this.updateStatus('Wrist app loaded successfully');
            this.logMessage(`Wrist app loaded: ${this.wristAppData.length} bytes`);
            
        } catch (error) {
            console.error('Wrist app upload error:', error);
            this.updateStatus(`Wrist app upload failed: ${error.message}`);
            this.logMessage(`Wrist app upload error: ${error.message}`);
        }
    }

    /**
     * Handle sound theme file upload
     */
    async handleUploadSoundTheme() {
        const file = this.soundThemeFile.files[0];
        if (!file) {
            alert('Please select a .spc file first');
            return;
        }
        
        try {
            this.updateStatus('Loading sound theme...');
            this.logMessage(`Loading sound theme: ${file.name}`);
            
            const arrayBuffer = await file.arrayBuffer();
            this.soundThemeData = new Uint8Array(arrayBuffer);
            
            this.soundThemeStatus.textContent = `${file.name} loaded (${this.soundThemeData.length} bytes)`;
            this.updateStatus('Sound theme loaded successfully');
            this.logMessage(`Sound theme loaded: ${this.soundThemeData.length} bytes`);
            
        } catch (error) {
            console.error('Sound theme upload error:', error);
            this.updateStatus(`Sound theme upload failed: ${error.message}`);
            this.logMessage(`Sound theme upload error: ${error.message}`);
        }
    }

    /**
     * Handle wrist app file change
     */
    handleWristAppFileChange() {
        const file = this.wristAppFile.files[0];
        this.uploadWristAppBtn.disabled = !file;
        
        if (file) {
            this.wristAppStatus.textContent = `Ready to upload: ${file.name}`;
        } else {
            this.wristAppStatus.textContent = 'No wrist app loaded';
            this.wristAppData = null;
        }
    }

    /**
     * Handle sound theme file change
     */
    handleSoundThemeFileChange() {
        const file = this.soundThemeFile.files[0];
        this.uploadSoundThemeBtn.disabled = !file;
        
        if (file) {
            this.soundThemeStatus.textContent = `Ready to upload: ${file.name}`;
        } else {
            this.soundThemeStatus.textContent = 'No sound theme loaded';
            this.soundThemeData = null;
        }
    }

    /**
     * Collect advanced data from UI based on protocol
     */
    collectAdvancedDataFromUI(protocol) {
        const advancedData = {};
        
        // Sound options (all protocols that support it)
        if ([3, 4, 6, 9].includes(protocol)) {
            const hourlyChime = document.getElementById('hourly-chime')?.checked || false;
            const buttonBeep = document.getElementById('button-beep')?.checked || false;
            
            if (protocol === 6) {
                // Protocol 6 has extended sound options
                const scrollSpeed = parseInt(document.getElementById('scroll-speed')?.value) || 2;
                advancedData.soundScrollOptions = {
                    hourlyChime,
                    buttonBeep,
                    scrollSpeed
                };
            } else {
                advancedData.soundOptions = {
                    hourlyChime,
                    buttonBeep
                };
            }
        }
        
        // Protocol 6 specific options
        if (protocol === 6) {
            // Pager options
            const autoOnOff = document.getElementById('auto-on-off')?.checked || false;
            if (autoOnOff) {
                const onTime = document.getElementById('on-time')?.value || '08:00';
                const offTime = document.getElementById('off-time')?.value || '22:00';
                const alertSound = parseInt(document.getElementById('alert-sound')?.value) || 0;
                
                const [onHour, onMinute] = onTime.split(':').map(Number);
                const [offHour, offMinute] = offTime.split(':').map(Number);
                
                advancedData.pagerOptions = {
                    autoOnOff,
                    onHour,
                    onMinute,
                    offHour,
                    offMinute,
                    alertSound
                };
            }
            
            // Night mode options
            const nightModeNotification = document.getElementById('night-mode-notification')?.checked || false;
            const nightModeHours = parseInt(document.getElementById('night-mode-hours')?.value) || 8;
            const indigloTimeout = parseInt(document.getElementById('indiglo-timeout')?.value) || 4;
            
            advancedData.nightModeOptions = {
                nightModeOnNotification: nightModeNotification,
                nightModeDeactivateHours: nightModeHours,
                indigloTimeoutSeconds: indigloTimeout
            };
        }
        
        // Protocol 9 timers
        if (protocol === 9) {
            const timers = [];
            
            for (let i = 1; i <= 2; i++) {
                const timeInput = document.getElementById(`timer${i}-time`);
                const labelInput = document.getElementById(`timer${i}-label`);
                const actionSelect = document.getElementById(`timer${i}-action`);
                
                if (timeInput?.value) {
                    const [hours, minutes, seconds = 0] = timeInput.value.split(':').map(Number);
                    const timerTime = new Date(0, 0, 0, hours, minutes, seconds);
                    
                    timers.push({
                        number: i,
                        label: labelInput?.value || `Timer ${i}`,
                        time: timerTime,
                        actionAtEnd: actionSelect?.value || 'stop_timer'
                    });
                }
            }
            
            if (timers.length > 0) {
                advancedData.timers = timers;
            }
        }
        
        // Protocol 7 games
        if (protocol === 7) {
            const games = {
                memoryGameEnabled: document.getElementById('memory-game')?.checked || false,
                fortuneTellerEnabled: document.getElementById('fortune-teller')?.checked || false,
                countdownTimerEnabled: document.getElementById('countdown-timer')?.checked || false,
                countdownTimerSeconds: parseInt(document.getElementById('countdown-seconds')?.value) || 60,
                mindReaderEnabled: document.getElementById('mind-reader')?.checked || false,
                musicTimeKeeperEnabled: document.getElementById('music-timekeeper')?.checked || false,
                morseCodePracticeEnabled: document.getElementById('morse-code')?.checked || false,
                treasureHunterEnabled: document.getElementById('treasure-hunter')?.checked || false,
                rhythmRhymeBusterEnabled: document.getElementById('rhythm-rhyme')?.checked || false,
                stopWatchEnabled: document.getElementById('stopwatch')?.checked || false,
                redLightGreenLightEnabled: document.getElementById('red-light-green')?.checked || false
            };
            
            // Only add games if at least one is enabled
            const hasEnabledGames = Object.values(games).some(value => value === true);
            if (hasEnabledGames) {
                advancedData.games = games;
            }
        }
        
        // Protocol 4 wrist apps and sound themes
        if (protocol === 4) {
            if (this.wristAppData) {
                advancedData.wristAppData = this.wristAppData;
            }
            
            if (this.soundThemeData) {
                advancedData.soundThemeData = this.soundThemeData;
            }
        }
        
        return advancedData;
    }

    /**
     * Parse advanced settings response from device
     */
    parseAdvancedResponse(data, protocol) {
        // Simplified parsing - would need protocol-specific implementation
        return {
            soundOptions: {
                hourlyChime: (data[0] || 0) > 0,
                buttonBeep: (data[1] || 0) > 0
            }
        };
    }

    /**
     * Populate advanced UI with data from device
     */
    populateAdvancedUI(advancedData, protocol) {
        if (advancedData.soundOptions) {
            const hourlyChime = document.getElementById('hourly-chime');
            const buttonBeep = document.getElementById('button-beep');
            
            if (hourlyChime) hourlyChime.checked = advancedData.soundOptions.hourlyChime;
            if (buttonBeep) buttonBeep.checked = advancedData.soundOptions.buttonBeep;
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TimexDatalinkApp();
});