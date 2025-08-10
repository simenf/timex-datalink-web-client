/**
 * Protocol 1 Class
 * Complete Protocol 1 implementation extending ProtocolBase
 */

import { ProtocolBase } from './protocol-base.js';
import Protocol1Start from './protocol1/start.js';
import Protocol1End from './protocol1/end.js';
import Protocol1Sync from './protocol1/sync.js';
import Protocol1Time from './protocol1/time.js';
import Protocol1TimeName from './protocol1/time-name.js';
import Protocol1Alarm from './protocol1/alarm.js';
import Protocol1Eeprom from './protocol1/eeprom.js';
import Protocol1Anniversary from './protocol1/eeprom/anniversary.js';
import Protocol1Appointment from './protocol1/eeprom/appointment.js';
import Protocol1List from './protocol1/eeprom/list.js';
import Protocol1PhoneNumber from './protocol1/eeprom/phone-number.js';

export class Protocol1 extends ProtocolBase {
  /**
   * Protocol version number
   * @returns {number} Protocol version
   */
  static get VERSION() {
    return 1;
  }

  /**
   * Protocol name
   * @returns {string} Protocol name
   */
  static get NAME() {
    return 'Protocol 1';
  }

  /**
   * Supported device models
   * @returns {Array<string>} Array of supported device model names
   */
  static get SUPPORTED_DEVICES() {
    return [
      'Timex Datalink 50',
      'Timex Datalink 70',
      'Timex Datalink Classic',
      'Protocol 1 Compatible'
    ];
  }

  /**
   * Protocol capabilities
   * @returns {Object} Capabilities object
   */
  static get CAPABILITIES() {
    return {
      bidirectional: false,
      time: true,
      timeName: true,
      alarms: true,
      eeprom: true,
      appointments: true,
      anniversaries: true,
      phoneNumbers: true,
      lists: true,
      soundOptions: false,
      soundTheme: false,
      wristApps: false,
      maxAlarms: 5
    };
  }

  /**
   * Get protocol start packet constant
   * @returns {Array<number>} Start packet bytes
   */
  static get START_PACKET() {
    return Protocol1Start.CPACKET_START;
  }

  /**
   * Create protocol-specific component classes
   * @returns {Object} Object containing component classes
   */
  static getComponents() {
    return {
      Start: Protocol1Start,
      End: Protocol1End,
      Sync: Protocol1Sync,
      Time: Protocol1Time,
      TimeName: Protocol1TimeName,
      Alarm: Protocol1Alarm,
      Eeprom: Protocol1Eeprom,
      Anniversary: Protocol1Anniversary,
      Appointment: Protocol1Appointment,
      List: Protocol1List,
      PhoneNumber: Protocol1PhoneNumber
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
    if (deviceInfo.protocol === 1) {
      return true;
    }
    
    // Check device model
    if (deviceInfo.model) {
      const modelLower = deviceInfo.model.toLowerCase();
      if (modelLower.includes('datalink 50') || 
          modelLower.includes('datalink 70') ||
          modelLower.includes('protocol 1')) {
        return true;
      }
    }
    
    // Check response pattern (if available)
    if (deviceInfo.response && Array.isArray(deviceInfo.response)) {
      // Look for Protocol 1 specific response patterns
      // This is a placeholder - actual implementation would depend on device responses
      return false;
    }
    
    return super.isCompatible(deviceInfo);
  }

  /**
   * Get protocol-specific constants
   * @returns {Object} Protocol constants
   */
  static getConstants() {
    return {
      CPACKET_START: Protocol1Start.CPACKET_START,
      CPACKET_END: Protocol1End.CPACKET_END,
      CPACKET_TIME: Protocol1Time.CPACKET_TIME,
      CPACKET_NAME: Protocol1TimeName.CPACKET_NAME,
      CPACKET_ALARM: Protocol1Alarm.CPACKET_ALARM,
      CPACKET_SECT: Protocol1Eeprom.CPACKET_SECT,
      CPACKET_DATA: Protocol1Eeprom.CPACKET_DATA,
      SYNC_LENGTH_DEFAULT: 300,
      ALARM_COUNT_MAX: 5,
      PHONE_DIGITS: Protocol1PhoneNumber.PHONE_DIGITS
    };
  }

  /**
   * Create a complete sync sequence for Protocol 1
   * @param {Object} options - Sync options
   * @param {Date} options.time - Time to set
   * @param {number} options.zone - Time zone (1 or 2)
   * @param {boolean} options.is24h - 24-hour format
   * @param {string} options.zoneName - Time zone name
   * @param {Array} options.alarms - Alarm instances
   * @param {Array} options.appointments - Appointment instances
   * @param {Array} options.anniversaries - Anniversary instances
   * @param {Array} options.phoneNumbers - Phone number instances
   * @param {Array} options.lists - List instances
   * @param {number} options.syncLength - Sync length (default: 300)
   * @returns {Array<Object>} Array of component instances
   */
  static createSyncSequence(options = {}) {
    const {
      time = new Date(),
      zone = 1,
      is24h = true,
      zoneName = null,
      alarms = [],
      appointments = [],
      anniversaries = [],
      phoneNumbers = [],
      lists = [],
      syncLength = 300,
      appointmentNotificationMinutes = null
    } = options;

    const sequence = [];

    // Start packet
    sequence.push(new Protocol1Start());

    // Sync packet
    sequence.push(new Protocol1Sync({ length: syncLength }));

    // Time packet
    sequence.push(new Protocol1Time({ zone, is24h, time }));

    // Time name packet (if provided)
    if (zoneName) {
      sequence.push(new Protocol1TimeName({ zone, name: zoneName }));
    }

    // Alarm packets
    for (const alarm of alarms) {
      sequence.push(alarm);
    }

    // EEPROM packet (if any EEPROM data provided)
    if (appointments.length > 0 || anniversaries.length > 0 || 
        phoneNumbers.length > 0 || lists.length > 0) {
      sequence.push(new Protocol1Eeprom({
        appointments,
        anniversaries,
        phoneNumbers,
        lists,
        appointmentNotificationMinutes
      }));
    }

    // End packet
    sequence.push(new Protocol1End());

    return sequence;
  }

  /**
   * Get usage examples for Protocol 1
   * @returns {Object} Usage examples
   */
  static getUsageExamples() {
    return {
      basicTimeSync: {
        description: 'Basic time synchronization',
        code: `
const protocol1 = new Protocol1();
const components = Protocol1.getComponents();

const sequence = [
  new components.Start(),
  new components.Sync({ length: 300 }),
  new components.Time({ 
    zone: 1, 
    is24h: true, 
    time: new Date() 
  }),
  new components.End()
];

const packets = sequence.flatMap(component => component.packets());
await serialAdapter.write(packets);
        `
      },
      alarmSetup: {
        description: 'Setting up alarms',
        code: `
const alarm = new components.Alarm({
  number: 1,
  audible: true,
  time: new Date(2024, 0, 1, 7, 30, 0),
  message: 'Wake up!',
  month: null,
  day: null
});

const sequence = Protocol1.createSyncSequence({
  alarms: [alarm]
});
        `
      },
      eepromData: {
        description: 'Syncing EEPROM data',
        code: `
const appointment = new components.Appointment({
  time: new Date(2024, 0, 15, 14, 30, 0),
  message: 'Meeting'
});

const phoneNumber = new components.PhoneNumber({
  name: 'John Doe',
  number: '555-1234',
  type: 'H'
});

const sequence = Protocol1.createSyncSequence({
  appointments: [appointment],
  phoneNumbers: [phoneNumber]
});
        `
      }
    };
  }
}

export default Protocol1;