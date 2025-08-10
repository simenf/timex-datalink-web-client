/**
 * Protocol 4 Alarm packet implementation
 * Ported from Ruby TimexDatalinkClient::Protocol4::Alarm
 */

import { DataValidator, ValidationError, range } from '../helpers/data-validator.js';
import { CharacterEncoders } from '../helpers/character-encoders.js';
import CrcPacketsWrapper from '../helpers/crc-packets-wrapper.js';

class Protocol4Alarm {
  static CPACKET_ALARM = [0x50];

  constructor({ number, audible, time, message }) {
    this.number = number;
    this.audible = audible;
    this.time = time;
    this.message = message;
    
    this.validator = new DataValidator();
    this.setupValidations();
  }

  /**
   * Setup validation rules
   * @private
   */
  setupValidations() {
    this.validator.validateInclusion('number', {
      in: range(1, 5),
      message: 'value %{value} is invalid!  Valid number values are 1..5.'
    });
  }

  /**
   * Validate the alarm data
   * @throws {ValidationError} If validation fails
   */
  validate() {
    this.validator.validate(this);
  }

  /**
   * Compile packets for an alarm
   * @throws {ValidationError} One or more model values are invalid
   * @returns {Array<Array<number>>} Two-dimensional array of integers that represent bytes
   */
  packets() {
    this.validate();

    const packet = [
      ...Protocol4Alarm.CPACKET_ALARM,
      this.number,
      this.time.getHours(),
      this.time.getMinutes(),
      0, // Reserved byte
      0, // Reserved byte
      ...this.messageCharacters(),
      this.audibleInteger()
    ];

    return CrcPacketsWrapper.wrapPackets([packet]);
  }

  /**
   * Convert message to character indices
   * @private
   * @returns {Array<number>} Array of character indices
   */
  messageCharacters() {
    return CharacterEncoders.charsFor(this.message, { 
      length: 8, 
      pad: true 
    });
  }

  /**
   * Convert boolean audible to integer
   * @private
   * @returns {number} 1 for audible, 0 for silent
   */
  audibleInteger() {
    return this.audible ? 1 : 0;
  }
}

export default Protocol4Alarm;