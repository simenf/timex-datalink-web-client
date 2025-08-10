/**
 * Protocol 3 EEPROM Anniversary implementation
 * 
 * Handles anniversary data encoding for EEPROM storage
 */

import { CharacterEncoders } from '../../helpers/character-encoders.js';
import LengthPacketWrapper from '../../helpers/length-packet-wrapper.js';

class Protocol3EepromAnniversary {
  /**
   * Create an Anniversary instance
   * @param {Object} options - Anniversary configuration
   * @param {Date} options.time - Time of anniversary
   * @param {string} options.anniversary - Anniversary text
   */
  constructor({ time, anniversary }) {
    this.time = time;
    this.anniversary = anniversary;
  }

  /**
   * Compile a packet for an anniversary
   * @returns {Array<number>} Array of integers that represent bytes
   */
  packet() {
    const rawPacket = [
      this.time.getMonth() + 1, // JavaScript months are 0-based, but we need 1-based
      this.time.getDate(),
      ...this.anniversaryCharacters()
    ];

    return LengthPacketWrapper.wrapPacket(rawPacket);
  }

  /**
   * Convert anniversary text to EEPROM character encoding
   * @returns {Array<number>} Array of encoded characters
   * @private
   */
  anniversaryCharacters() {
    return CharacterEncoders.eepromCharsFor(this.anniversary);
  }
}

export default Protocol3EepromAnniversary;