/**
 * Protocol 3 Implementation
 * 
 * Complete Protocol 3 implementation following the new protocol abstraction framework.
 * This serves as the reference implementation and demonstrates how other protocols
 * should be structured.
 */

import { ProtocolBase } from './protocol-base.js';

// Import existing Protocol 3 components
import Start from './protocol3/start.js';
import Sync from './protocol3/sync.js';
import Time from './protocol3/time.js';
import Alarm from './protocol3/alarm.js';
import End from './protocol3/end.js';
import Eeprom from './protocol3/eeprom.js';
import SoundOptions from './protocol3/sound-options.js';
import SoundTheme from './protocol3/sound-theme.js';

export class Protocol3 extends ProtocolBase {
  /**
   * Protocol version number
   */
  static get VERSION() {
    return 3;
  }

  /**
   * Protocol name
   */
  static get NAME() {
    return 'Protocol 3';
  }

  /**
   * Supported device models
   */
  static get SUPPORTED_DEVICES() {
    return [
      'Timex Datalink 150',
      'Timex Datalink 150s',
      'Timex Datalink USB',
      'Timex Datalink Ironman',
      'Generic Protocol 3 Device'
    ];
  }

  /**
   * Protocol capabilities
   */
  static get CAPABILITIES() {
    return {
      bidirectional: true,
      time: true,
      alarms: true,
      eeprom: true,
      soundOptions: true,
      soundTheme: true,
      wristApps: false, // Not implemented yet
      sync: true
    };
  }

  /**
   * Protocol start packet constant
   */
  static get START_PACKET() {
    return [0x20, 0x00, 0x00, 0x03];
  }

  /**
   * Get protocol-specific component classes
   */
  static getComponents() {
    return {
      Start,
      Sync,
      Time,
      Alarm,
      End,
      Eeprom,
      SoundOptions,
      SoundTheme
    };
  }

  /**
   * Enhanced compatibility detection for Protocol 3
   */
  static isCompatible(deviceInfo) {
    if (!deviceInfo) return false;

    // Check explicit protocol version
    if (deviceInfo.protocol === 3) {
      return true;
    }

    // Check device model
    if (deviceInfo.model && this.SUPPORTED_DEVICES.includes(deviceInfo.model)) {
      return true;
    }

    // Check device response pattern
    if (deviceInfo.response && Array.isArray(deviceInfo.response)) {
      // Look for Protocol 3 specific response patterns
      const response = deviceInfo.response;
      
      // Check if response contains Protocol 3 start packet
      if (this.containsStartPacket(response)) {
        return true;
      }

      // Check for Protocol 3 specific byte patterns
      if (this.matchesProtocol3Pattern(response)) {
        return true;
      }
    }

    // Check device identifier strings
    if (deviceInfo.identifier) {
      const identifier = deviceInfo.identifier.toLowerCase();
      if (identifier.includes('datalink') || 
          identifier.includes('protocol3') || 
          identifier.includes('timex')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if response contains Protocol 3 start packet
   * @private
   */
  static containsStartPacket(response) {
    const startPacket = this.START_PACKET;
    
    for (let i = 0; i <= response.length - startPacket.length; i++) {
      let matches = true;
      for (let j = 0; j < startPacket.length; j++) {
        if (response[i + j] !== startPacket[j]) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }
    
    return false;
  }

  /**
   * Check if response matches Protocol 3 patterns
   * @private
   */
  static matchesProtocol3Pattern(response) {
    if (response.length < 4) return false;

    // Look for common Protocol 3 packet headers
    const commonHeaders = [
      0x20, // Start packet header
      0x32, // Time packet header
      0x50, // Alarm packet header
      0x90, // EEPROM packet header
      0x71  // End packet header
    ];

    for (const header of commonHeaders) {
      if (response.includes(header)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get Protocol 3 specific information
   */
  static getInfo() {
    const baseInfo = super.getInfo();
    
    return {
      ...baseInfo,
      description: 'Protocol 3 for Timex Datalink 150/150s and compatible devices',
      features: [
        'Bidirectional communication',
        'Time synchronization with timezone support',
        'Multiple alarms with custom messages',
        'EEPROM data (appointments, phone numbers, anniversaries, lists)',
        'Sound options and themes',
        'CRC packet validation'
      ],
      packetTypes: {
        start: 0x20,
        time: 0x32,
        alarm: 0x50,
        eeprom: 0x90,
        soundOptions: 0x61,
        soundTheme: 0x62,
        end: 0x71
      },
      maxDataSizes: {
        appointments: 50,
        phoneNumbers: 50,
        anniversaries: 50,
        lists: 6,
        alarms: 5
      }
    };
  }

  /**
   * Create a complete sync sequence for Protocol 3
   * @param {Object} syncData - Data to synchronize
   * @returns {Array<Object>} Array of component instances
   */
  static createSyncSequence(syncData = {}) {
    const sequence = [];

    // Always start with Start component
    sequence.push(new Start());

    // Add Sync component if specified
    if (syncData.sync !== false) {
      sequence.push(new Sync(syncData.sync || {}));
    }

    // Add Time component if time data provided
    if (syncData.time) {
      sequence.push(new Time(syncData.time));
    }

    // Add Alarm components if alarm data provided
    if (syncData.alarms && Array.isArray(syncData.alarms)) {
      for (const alarmData of syncData.alarms) {
        sequence.push(new Alarm(alarmData));
      }
    }

    // Add EEPROM component if EEPROM data provided
    if (syncData.eeprom) {
      sequence.push(new Eeprom(syncData.eeprom));
    }

    // Add Sound Options if provided
    if (syncData.soundOptions) {
      sequence.push(new SoundOptions(syncData.soundOptions));
    }

    // Add Sound Theme if provided
    if (syncData.soundTheme) {
      sequence.push(new SoundTheme(syncData.soundTheme));
    }

    // Always end with End component
    sequence.push(new End());

    return sequence;
  }

  /**
   * Validate Protocol 3 sync data
   * @param {Object} syncData - Data to validate
   * @returns {Object} Validation result
   */
  static validateSyncData(syncData) {
    const errors = [];
    const warnings = [];

    if (!syncData || typeof syncData !== 'object') {
      errors.push('Sync data must be an object');
      return { isValid: false, errors, warnings };
    }

    // Validate time data
    if (syncData.time) {
      try {
        const timeComponent = new Time(syncData.time);
        const timeValidation = timeComponent.validate();
        if (!timeValidation.isValid) {
          errors.push(...timeValidation.errors.map(e => `Time: ${e}`));
        }
      } catch (error) {
        errors.push(`Time validation failed: ${error.message}`);
      }
    }

    // Validate alarm data
    if (syncData.alarms) {
      if (!Array.isArray(syncData.alarms)) {
        errors.push('Alarms must be an array');
      } else {
        if (syncData.alarms.length > 5) {
          warnings.push('Protocol 3 supports maximum 5 alarms, excess alarms will be ignored');
        }

        for (let i = 0; i < Math.min(syncData.alarms.length, 5); i++) {
          try {
            const alarmComponent = new Alarm(syncData.alarms[i]);
            const alarmValidation = alarmComponent.validate();
            if (!alarmValidation.isValid) {
              errors.push(...alarmValidation.errors.map(e => `Alarm ${i + 1}: ${e}`));
            }
          } catch (error) {
            errors.push(`Alarm ${i + 1} validation failed: ${error.message}`);
          }
        }
      }
    }

    // Validate EEPROM data
    if (syncData.eeprom) {
      try {
        const eepromComponent = new Eeprom(syncData.eeprom);
        const eepromValidation = eepromComponent.validate();
        if (!eepromValidation.isValid) {
          errors.push(...eepromValidation.errors.map(e => `EEPROM: ${e}`));
        }
      } catch (error) {
        errors.push(`EEPROM validation failed: ${error.message}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get default sync configuration for Protocol 3
   */
  static getDefaultSyncConfig() {
    return {
      sync: {
        length: 300 // Default sync length
      },
      time: {
        zone: 1,
        is24h: false,
        dateFormat: "%_m-%d-%y",
        time: new Date(),
        name: null
      },
      alarms: [],
      eeprom: {
        appointments: [],
        phoneNumbers: [],
        anniversaries: [],
        lists: []
      },
      soundOptions: null,
      soundTheme: null
    };
  }
}