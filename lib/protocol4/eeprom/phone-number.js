/**
 * Protocol 4 EEPROM PhoneNumber implementation
 * Ported from Ruby TimexDatalinkClient::Protocol4::Eeprom::PhoneNumber
 */

import { CharacterEncoders } from '../../helpers/character-encoders.js';
import LengthPacketWrapper from '../../helpers/length-packet-wrapper.js';

class Protocol4PhoneNumber {
  static PHONE_DIGITS = 12;

  constructor({ name, number, type = ' ' }) {
    this.name = name;
    this.number = number;
    this.type = type;
  }

  /**
   * Compile a packet for a phone number
   * @returns {Array<number>} Array of integers that represent bytes
   */
  packet() {
    const basePacket = [
      ...this.numberWithTypeCharacters(),
      ...this.nameCharacters()
    ];

    return LengthPacketWrapper.wrapPacket(basePacket);
  }

  /**
   * Format number with type and pad to required length
   * @private
   * @returns {string} Formatted and padded number with type
   */
  numberWithTypePadded() {
    const numberWithType = `${this.number} ${this.type}`;
    return numberWithType.padStart(Protocol4PhoneNumber.PHONE_DIGITS, ' ');
  }

  /**
   * Convert number with type to phone character indices
   * @private
   * @returns {Array<number>} Array of character indices
   */
  numberWithTypeCharacters() {
    return CharacterEncoders.phoneCharsFor(this.numberWithTypePadded());
  }

  /**
   * Convert name to EEPROM character indices
   * @private
   * @returns {Array<number>} Array of character indices
   */
  nameCharacters() {
    return CharacterEncoders.eepromCharsFor(this.name);
  }
}

export default Protocol4PhoneNumber;