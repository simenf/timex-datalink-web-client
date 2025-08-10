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
    this.time = time;
    this.message = message;
  }

  /**
   * Compile a packet for an appointment
   * @returns {Array<number>} Array of integers that represent bytes
   */
  packet() {
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