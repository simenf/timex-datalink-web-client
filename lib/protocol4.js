/**
 * Protocol 4 Class
 * Complete Protocol 4 implementation extending ProtocolBase
 */

import { ProtocolBase } from './protocol-base.js';
import Protocol4Start from './protocol4/start.js';
import Protocol4End from './protocol4/end.js';
import Protocol4Sync from './protocol4/sync.js';
import Protocol4Time from './protocol4/time.js';
import Protocol4Alarm from './protocol4/alarm.js';
import Protocol4SoundOptions from './protocol4/sound-options.js';
import Protocol4SoundTheme from './protocol4/sound-theme.js';
import Protocol4WristApp from './protocol4/wrist-app.js';
import Protocol4Eeprom from './protocol4/eeprom.js';
import Protocol4Anniversary from './protocol4/eeprom/anniversary.js';
import Protocol4Appointment from './protocol4/eeprom/appointment.js';
import Protocol4List from './protocol4/eeprom/list.js';
import Protocol4PhoneNumber from './protocol4/eeprom/phone-number.js';

export class Protocol4 extends ProtocolBase {
  /**
   * Protocol version number
   * @returns {number} Protocol version
   */
  static get VERSION() {
    return 4;
  }

  /**
   * Protocol name
   * @returns {string} Protocol name
   */
  static get NAME() {
    return 'Protocol 4';
  }

  /**
   * Supported device models
   * @returns {Array<string>} Array of supported device model names
   */
  static get SUPPORTED_DEVICES() {
    return [
      'Timex Datalink Internet Messenger',
      'Timex Datalink USB',
      'Timex Datalink 150s (USB)',
      'Protocol 4 Compatible'
    ];
  }

  /**
   * Protocol capabilities
   * @returns {Object} Capabilities object
   */
  static get CAPABILITIES() {
    return {
      bidirectional: true,
      time: true,
      alarms: true,
      eeprom: true,
      appointments: true,
      anniversaries: true,
      phoneNumbers: true,
      lists: true,
      soundOptions: true,
      soundTheme: true,
      wristApps: true,
      maxAlarms: 5
    };
  }

  /**
   * Get protocol start packet constant
   * @returns {Array<number>} Start packet bytes
   */
  static get START_PACKET() {
    return Protocol4Start.CPACKET_START;
  }

  /**
   * Create protocol-specific component classes
   * @returns {Object} Object containing component classes
   */
  static getComponents() {
    return {
      Start: Protocol4Start,
      End: Protocol4End,
      Sync: Protocol4Sync,
      Time: Protocol4Time,
      Alarm: Protocol4Alarm,
      SoundOptions: Protocol4SoundOptions,
      SoundTheme: Protocol4SoundTheme,
      WristApp: Protocol4WristApp,
      Eeprom: Protocol4Eeprom,
      Anniversary: Protocol4Anniversary,
      Appointment: Protocol4Appointment,
      List: Protocol4List,
      PhoneNumber: Protocol4PhoneNumber
    };
  }

  /**
   * Detect if this protocol is compatible with given device info
   * @param {Object} deviceInfo - Device information
   * @returns {boolean} True if compatible
   */
  static isCompatible(deviceInfo) {
    if (!deviceInfo) return false;
    
    // Check explicit protocol version
    if (deviceInfo.protocol === 4) {
      return true;
    }
    
    // Check device model
    if (deviceInfo.model) {
      const modelLower = deviceInfo.model.toLowerCase();
      if (modelLower.includes('internet messenger') || 
          modelLower.includes('datalink usb') ||
          modelLower.includes('protocol 4')) {
        return true;
      }
    }
    
    return super.isCompatible(deviceInfo);
  }

  /**
   * Get protocol-specific constants
   * @returns {Object} Protocol constants
   */
  static getConstants() {
    return {
      CPACKET_START: Protocol4Start.CPACKET_START,
      CPACKET_SKIP: Protocol4End.CPACKET_SKIP,
      CPACKET_TIME: Protocol4Time.CPACKET_TIME,
      CPACKET_ALARM: Protocol4Alarm.CPACKET_ALARM,
      CPACKET_BEEPS: Protocol4SoundOptions.CPACKET_BEEPS,
      DATE_FORMAT_MAP: Protocol4Time.DATE_FORMAT_MAP,
      SYNC_LENGTH_DEFAULT: 300,
      ALARM_COUNT_MAX: 5,
      PHONE_DIGITS: Protocol4PhoneNumber.PHONE_DIGITS
    };
  }

  /**
   * Create a complete sync sequence for Protocol 4
   * @param {Object} options - Sync options
   * @param {Date} options.time - Time to set
   * @param {number} options.zone - Time zone (1 or 2)
   * @param {boolean} options.is24h - 24-hour format
   * @param {string} options.dateFormat - Date format
   * @param {string} options.zoneName - Time zone name
   * @param {Array} options.alarms - Alarm instances
   * @param {Array} options.appointments - Appointment instances
   * @param {Array} options.anniversaries - Anniversary instances
   * @param {Array} options.phoneNumbers - Phone number instances
   * @param {Array} options.lists - List instances
   * @param {Object} options.soundOptions - Sound options
   * @param {Uint8Array} options.soundThemeData - Sound theme data
   * @param {Uint8Array} options.wristAppData - Wrist app data
   * @param {number} options.syncLength - Sync length (default: 300)
   * @returns {Array<Object>} Array of component instances
   */
  static createSyncSequence(options = {}) {
    const {
      time = new Date(),
      zone = 1,
      is24h = true,
      dateFormat = '%_m-%d-%y',
      zoneName = null,
      alarms = [],
      appointments = [],
      anniversaries = [],
      phoneNumbers = [],
      lists = [],
      soundOptions = null,
      soundThemeData = null,
      wristAppData = null,
      syncLength = 300,
      appointmentNotificationMinutes = null
    } = options;

    const sequence = [];

    // Start packet
    sequence.push(new Protocol4Start());

    // Sync packet
    sequence.push(new Protocol4Sync({ length: syncLength }));

    // Time packet
    sequence.push(new Protocol4Time({ 
      zone, 
      is24h, 
      dateFormat, 
      time, 
      name: zoneName 
    }));

    // Alarm packets
    for (const alarm of alarms) {
      sequence.push(alarm);
    }

    // Sound options (if provided)
    if (soundOptions) {
      sequence.push(new Protocol4SoundOptions(soundOptions));
    }

    // Sound theme (if provided)
    if (soundThemeData) {
      sequence.push(new Protocol4SoundTheme({ soundThemeData }));
    }

    // Wrist app (if provided)
    if (wristAppData) {
      sequence.push(new Protocol4WristApp({ wristAppData }));
    }

    // EEPROM packet (if any EEPROM data provided)
    if (appointments.length > 0 || anniversaries.length > 0 || 
        phoneNumbers.length > 0 || lists.length > 0) {
      sequence.push(new Protocol4Eeprom({
        appointments,
        anniversaries,
        phoneNumbers,
        lists,
        appointmentNotificationMinutes
      }));
    }

    // End packet
    sequence.push(new Protocol4End());

    return sequence;
  }

  /**
   * Get usage examples for Protocol 4
   * @returns {Object} Usage examples
   */
  static getUsageExamples() {
    return {
      basicTimeSync: {
        description: 'Basic time synchronization with date format',
        code: `
const protocol4 = new Protocol4();
const components = Protocol4.getComponents();

const sequence = [
  new components.Start(),
  new components.Sync({ length: 300 }),
  new components.Time({ 
    zone: 1, 
    is24h: true, 
    dateFormat: '%_m-%d-%y',
    time: new Date(),
    name: 'EST'
  }),
  new components.End()
];

const packets = sequence.flatMap(component => component.packets());
await serialAdapter.write(packets);
        `
      },
      soundConfiguration: {
        description: 'Setting up sound options',
        code: `
const soundOptions = new components.SoundOptions({
  hourlyChime: true,
  buttonBeep: false
});

const sequence = Protocol4.createSyncSequence({
  soundOptions: { hourlyChime: true, buttonBeep: false }
});
        `
      },
      wristAppUpload: {
        description: 'Uploading a wrist app',
        code: `
// Assuming you have wrist app binary data
const wristAppData = new Uint8Array([/* binary data */]);

const wristApp = new components.WristApp({
  wristAppData: wristAppData
});

const sequence = Protocol4.createSyncSequence({
  wristAppData: wristAppData
});
        `
      }
    };
  }
}

export default Protocol4;