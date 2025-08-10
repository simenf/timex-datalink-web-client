/**
 * Protocol 3 Alarm implementation
 * 
 * Handles alarm data validation and packet generation for Protocol 3 devices.
 * Supports multiple alarm slots with time and message data.
 */

import { CharacterEncoders } from '../helpers/character-encoders.js';
import CrcPacketsWrapper from '../helpers/crc-packets-wrapper.js';

class Protocol3Alarm {
  static CPACKET_ALARM = [0x50];

  /**
   * Create an Alarm instance
   * @param {Object} options - Alarm configuration
   * @param {number} options.number - Alarm number (from 1 to 5)
   * @param {boolean} options.audible - Toggle alarm sounds
   * @param {Date} options.time - Time of alarm
   * @param {string} options.message - Alarm message text
   */
  constructor({ number, audible, time, message }) {
    this.number = number;
    this.audible = audible;
    this.time = time;
    this.message = message;
    
    this.validate();
  }

  /**
   * Validate alarm parameters
   * @throws {Error} If validation fails
   */
  validate() {
    if (!Number.isInteger(this.number) || this.number < 1 || this.number > 5) {
      throw new Error(`Number value ${this.number} is invalid! Valid number values are 1..5.`);
    }
  }

  /**
   * Compile packets for an alarm
   * @returns {Array<Array<number>>} Two-dimensional array of integers that represent bytes
   */
  packets() {
    this.validate();

    const packet = [
      ...Protocol3Alarm.CPACKET_ALARM,
      this.number,
      this.time.getHours(),
      this.time.getMinutes(),
      0,
      0,
      ...this.messageCharacters(),
      this.audibleInteger()
    ];

    return CrcPacketsWrapper.wrapPackets([packet]);
  }

  /**
   * Convert message to character indices
   * @returns {number[]} Array of character indices (8 characters, padded)
   * @private
   */
  messageCharacters() {
    return CharacterEncoders.charsFor(this.message, { length: 8, pad: true });
  }

  /**
   * Convert audible boolean to integer
   * @returns {number} 1 if audible, 0 if not
   * @private
   */
  audibleInteger() {
    return this.audible ? 1 : 0;
  }
}

export default Protocol3Alarm;