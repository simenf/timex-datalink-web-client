/**
 * Protocol 3 EEPROM PhoneNumber implementation
 * 
 * Handles phone number data encoding for EEPROM storage
 */

import { CharacterEncoders } from '../../helpers/character-encoders.js';
import LengthPacketWrapper from '../../helpers/length-packet-wrapper.js';

class Protocol3EepromPhoneNumber {
  static PHONE_DIGITS = 12;

  /**
   * Create a PhoneNumber instance
   * @param {Object} options - PhoneNumber configuration
   * @param {string} options.name - Name associated to phone number
   * @param {string} options.number - Phone number text
   * @param {string} options.type - Phone number type (default: " ")
   */
  constructor({ name, number, type = " " }) {
    this.name = name;
    this.number = number;
    this.type = type;
  }

  /**
   * Compile a packet for a phone number
   * @returns {Array<number>} Array of integers that represent bytes
   */
  packet() {
    const rawPacket = [
      ...this.numberWithTypeCharacters(),
      ...this.nameCharacters()
    ];

    return LengthPacketWrapper.wrapPacket(rawPacket);
  }

  /**
   * Pad number with type to required length
   * @returns {string} Padded number with type
   * @private
   */
  numberWithTypePadded() {
    const numberWithType = `${this.number} ${this.type}`;
    return numberWithType.padStart(Protocol3EepromPhoneNumber.PHONE_DIGITS, ' ');
  }

  /**
   * Convert number with type to phone character encoding
   * @returns {Array<number>} Array of encoded characters
   * @private
   */
  numberWithTypeCharacters() {
    return CharacterEncoders.phoneCharsFor(this.numberWithTypePadded());
  }

  /**
   * Convert name to EEPROM character encoding
   * @returns {Array<number>} Array of encoded characters
   * @private
   */
  nameCharacters() {
    return CharacterEncoders.eepromCharsFor(this.name);
  }
}

export default Protocol3EepromPhoneNumber;