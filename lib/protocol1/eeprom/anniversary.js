/**
 * Protocol 1 EEPROM Anniversary implementation
 * Ported from Ruby TimexDatalinkClient::Protocol1::Eeprom::Anniversary
 */

import { CharacterEncoders } from '../../helpers/character-encoders.js';
import LengthPacketWrapper from '../../helpers/length-packet-wrapper.js';

class Protocol1Anniversary {
  constructor({ time, anniversary }) {
    this.time = time;
    this.anniversary = anniversary;
  }

  /**
   * Compile a packet for an anniversary
   * @returns {Array<number>} Array of integers that represent bytes
   */
  packet() {
    const basePacket = [
      this.time.getMonth() + 1, // JavaScript months are 0-based
      this.time.getDate(),
      ...this.anniversaryCharacters()
    ];

    return LengthPacketWrapper.wrapPacket(basePacket);
  }

  /**
   * Convert anniversary text to EEPROM character indices
   * @private
   * @returns {Array<number>} Array of character indices
   */
  anniversaryCharacters() {
    return CharacterEncoders.eepromCharsFor(this.anniversary);
  }
}

export default Protocol1Anniversary;