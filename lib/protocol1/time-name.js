/**
 * Protocol 1 TimeName packet implementation
 * Ported from Ruby TimexDatalinkClient::Protocol1::TimeName
 */

import { DataValidator, ValidationError, range } from '../helpers/data-validator.js';
import { CharacterEncoders } from '../helpers/character-encoders.js';
import CrcPacketsWrapper from '../helpers/crc-packets-wrapper.js';

class Protocol1TimeName {
  static CPACKET_NAME = [0x31];

  constructor({ zone, name }) {
    this.zone = zone;
    this.name = name;
    
    this.validator = new DataValidator();
    this.setupValidations();
  }

  /**
   * Setup validation rules
   * @private
   */
  setupValidations() {
    this.validator.validateInclusion('zone', {
      in: range(1, 2),
      message: '%{value} is invalid!  Valid zones are 1..2.'
    });
  }

  /**
   * Validate the time name data
   * @throws {ValidationError} If validation fails
   */
  validate() {
    this.validator.validate(this);
  }

  /**
   * Compile packets for a time name
   * @throws {ValidationError} One or more model values are invalid
   * @returns {Array<Array<number>>} Two-dimensional array of integers that represent bytes
   */
  packets() {
    this.validate();

    const packet = [
      ...Protocol1TimeName.CPACKET_NAME,
      this.zone,
      ...this.nameCharacters()
    ];

    return CrcPacketsWrapper.wrapPackets([packet]);
  }

  /**
   * Get formatted name (default to "tz{zone}" if not provided)
   * @private
   * @returns {string} Formatted name
   */
  nameFormatted() {
    return this.name || `tz${this.zone}`;
  }

  /**
   * Convert name to character indices
   * @private
   * @returns {Array<number>} Array of character indices
   */
  nameCharacters() {
    return CharacterEncoders.charsFor(this.nameFormatted(), { 
      length: 3, 
      pad: true 
    });
  }
}

export default Protocol1TimeName;