/**
 * Protocol 1 EEPROM Appointment implementation
 * Ported from Ruby TimexDatalinkClient::Protocol1::Eeprom::Appointment
 */

import { CharacterEncoders } from '../../helpers/character-encoders.js';
import LengthPacketWrapper from '../../helpers/length-packet-wrapper.js';

class Protocol1Appointment {
  constructor({ time, message }) {
    this.time = time;
    this.message = message;
  }

  /**
   * Compile a packet for an appointment
   * @returns {Array<number>} Array of integers that represent bytes
   */
  packet() {
    const basePacket = [
      this.time.getMonth() + 1, // JavaScript months are 0-based
      this.time.getDate(),
      this.time15m(),
      ...this.messageCharacters()
    ];

    return LengthPacketWrapper.wrapPacket(basePacket);
  }

  /**
   * Convert time to 15-minute intervals since midnight
   * @private
   * @returns {number} Time in 15-minute intervals
   */
  time15m() {
    return this.time.getHours() * 4 + Math.floor(this.time.getMinutes() / 15);
  }

  /**
   * Convert message text to EEPROM character indices
   * @private
   * @returns {Array<number>} Array of character indices
   */
  messageCharacters() {
    return CharacterEncoders.eepromCharsFor(this.message);
  }
}

export default Protocol1Appointment;