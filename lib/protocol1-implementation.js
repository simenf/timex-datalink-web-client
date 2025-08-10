/**
 * Protocol 1 Implementation
 * Complete implementation of Timex Datalink Protocol 1
 * Ported from Ruby TimexDatalinkClient::Protocol1
 */

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

/**
 * Protocol 1 implementation for Timex Datalink watches
 * Supports: Timex Datalink 50, 70, and other Protocol 1 compatible devices
 */
class Protocol1Implementation {
  constructor() {
    this.protocolNumber = 1;
    this.name = 'Protocol 1';
    this.description = 'Original Timex Datalink protocol for models 50, 70, and compatible devices';
  }

  /**
   * Create a start packet
   * @returns {Protocol1Start} Start packet instance
   */
  createStart() {
    return new Protocol1Start();
  }

  /**
   * Create an end packet
   * @returns {Protocol1End} End packet instance
   */
  createEnd() {
    return new Protocol1End();
  }

  /**
   * Create a sync packet
   * @param {Object} options - Sync options
   * @param {number} options.length - Number of sync bytes (default: 300)
   * @returns {Protocol1Sync} Sync packet instance
   */
  createSync(options = {}) {
    return new Protocol1Sync(options);
  }

  /**
   * Create a time packet
   * @param {Object} options - Time options
   * @param {number} options.zone - Time zone (1 or 2)
   * @param {boolean} options.is24h - 24-hour format flag
   * @param {Date} options.time - Time to set
   * @returns {Protocol1Time} Time packet instance
   */
  createTime(options) {
    return new Protocol1Time(options);
  }

  /**
   * Create a time name packet
   * @param {Object} options - Time name options
   * @param {number} options.zone - Time zone (1 or 2)
   * @param {string} options.name - Time zone name (3 chars max)
   * @returns {Protocol1TimeName} Time name packet instance
   */
  createTimeName(options) {
    return new Protocol1TimeName(options);
  }

  /**
   * Create an alarm packet
   * @param {Object} options - Alarm options
   * @param {number} options.number - Alarm number (1-5)
   * @param {boolean} options.audible - Audible flag
   * @param {Date} options.time - Alarm time
   * @param {string} options.message - Alarm message
   * @param {number|null} options.month - Alarm month (optional)
   * @param {number|null} options.day - Alarm day (optional)
   * @returns {Protocol1Alarm} Alarm packet instance
   */
  createAlarm(options) {
    return new Protocol1Alarm(options);
  }

  /**
   * Create an EEPROM packet
   * @param {Object} options - EEPROM options
   * @param {Array} options.appointments - Appointment instances
   * @param {Array} options.anniversaries - Anniversary instances
   * @param {Array} options.phoneNumbers - Phone number instances
   * @param {Array} options.lists - List instances
   * @param {number|null} options.appointmentNotificationMinutes - Notification minutes
   * @returns {Protocol1Eeprom} EEPROM packet instance
   */
  createEeprom(options = {}) {
    return new Protocol1Eeprom(options);
  }

  /**
   * Create an anniversary instance
   * @param {Object} options - Anniversary options
   * @param {Date} options.time - Anniversary date
   * @param {string} options.anniversary - Anniversary text
   * @returns {Protocol1Anniversary} Anniversary instance
   */
  createAnniversary(options) {
    return new Protocol1Anniversary(options);
  }

  /**
   * Create an appointment instance
   * @param {Object} options - Appointment options
   * @param {Date} options.time - Appointment time
   * @param {string} options.message - Appointment message
   * @returns {Protocol1Appointment} Appointment instance
   */
  createAppointment(options) {
    return new Protocol1Appointment(options);
  }

  /**
   * Create a list instance
   * @param {Object} options - List options
   * @param {string} options.listEntry - List entry text
   * @param {number|null} options.priority - Priority (1-5 or null)
   * @returns {Protocol1List} List instance
   */
  createList(options) {
    return new Protocol1List(options);
  }

  /**
   * Create a phone number instance
   * @param {Object} options - Phone number options
   * @param {string} options.name - Contact name
   * @param {string} options.number - Phone number
   * @param {string} options.type - Phone type (default: ' ')
   * @returns {Protocol1PhoneNumber} Phone number instance
   */
  createPhoneNumber(options) {
    return new Protocol1PhoneNumber(options);
  }

  /**
   * Get supported features for this protocol
   * @returns {Object} Feature support information
   */
  getSupportedFeatures() {
    return {
      time: true,
      timeName: true,
      alarms: true,
      appointments: true,
      anniversaries: true,
      phoneNumbers: true,
      lists: true,
      soundOptions: false,
      soundTheme: false,
      wristApp: false,
      bidirectionalSync: false
    };
  }

  /**
   * Get protocol-specific constants
   * @returns {Object} Protocol constants
   */
  getConstants() {
    return {
      CPACKET_START: Protocol1Start.CPACKET_START,
      CPACKET_END: Protocol1End.CPACKET_END,
      CPACKET_TIME: Protocol1Time.CPACKET_TIME,
      CPACKET_NAME: Protocol1TimeName.CPACKET_NAME,
      CPACKET_ALARM: Protocol1Alarm.CPACKET_ALARM,
      CPACKET_SECT: Protocol1Eeprom.CPACKET_SECT,
      CPACKET_DATA: Protocol1Eeprom.CPACKET_DATA,
      SYNC_LENGTH_DEFAULT: 300,
      ALARM_COUNT_MAX: 5
    };
  }
}

export default Protocol1Implementation;