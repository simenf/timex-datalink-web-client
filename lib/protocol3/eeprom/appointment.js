/**
 * Protocol 3 EEPROM Appointment implementation
 * 
 * Handles appointment data encoding for EEPROM storage
 */

import { CharacterEncoders } from '../../helpers/character-encoders.js';
import LengthPacketWrapper from '../../helpers/length-packet-wrapper.js';

class Protocol3EepromAppointment {
  /**
   * Create an Appointment instance
   * @param {Object} options - Appointment configuration
   * @param {Date} options.time - Time of appointment
   * @param {string} options.message - Appointment text
   */
  constructor({ time, message }) {
    if (!time) {
      throw new Error('Appointment time is required');
    }
    
    if (!(time instanceof Date)) {
      throw new Error('Appointment time must be a Date object');
    }
    
    if (isNaN(time.getTime())) {
      throw new Error('Appointment time must be a valid Date');
    }
    
    this.time = time;
    this.message = message || 'Appointment';
  }

  /**
   * Compile a packet for an appointment
   * @returns {Array<number>} Array of integers that represent bytes
   */
  packet() {
    console.log('🔍 PACKET DEBUG: Creating packet for appointment:', {
      time: this.time,
      timeType: typeof this.time,
      isDate: this.time instanceof Date,
      isValid: this.time instanceof Date && !isNaN(this.time.getTime()),
      message: this.message
    });
    
    if (!this.time) {
      throw new Error('Cannot create packet: appointment time is null/undefined');
    }
    
    if (!(this.time instanceof Date)) {
      throw new Error(`Cannot create packet: appointment time is not a Date object (${typeof this.time})`);
    }
    
    if (isNaN(this.time.getTime())) {
      throw new Error('Cannot create packet: appointment time is invalid Date');
    }
    
    const rawPacket = [
      this.time.getMonth() + 1, // JavaScript months are 0-based, but we need 1-based
      this.time.getDate(),
      this.time15m(),
      ...this.messageCharacters()
    ];

    return LengthPacketWrapper.wrapPacket(rawPacket);
  }

  /**
   * Convert time to 15-minute intervals
   * @returns {number} Time encoded in 15-minute intervals
   * @private
   */
  time15m() {
    return this.time.getHours() * 4 + Math.floor(this.time.getMinutes() / 15);
  }

  /**
   * Convert message to EEPROM character encoding
   * @returns {Array<number>} Array of encoded characters
   * @private
   */
  messageCharacters() {
    return CharacterEncoders.eepromCharsFor(this.message);
  }
}

export default Protocol3EepromAppointment;