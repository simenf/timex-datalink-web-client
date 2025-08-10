/**
 * Protocol 4 EEPROM List implementation
 * Ported from Ruby TimexDatalinkClient::Protocol4::Eeprom::List
 */

import { DataValidator, ValidationError, range } from '../../helpers/data-validator.js';
import { CharacterEncoders } from '../../helpers/character-encoders.js';
import LengthPacketWrapper from '../../helpers/length-packet-wrapper.js';

class Protocol4List {
  constructor({ listEntry, priority }) {
    this.listEntry = listEntry;
    this.priority = priority;
    
    this.validator = new DataValidator();
    this.setupValidations();
  }

  /**
   * Setup validation rules
   * @private
   */
  setupValidations() {
    this.validator.validateInclusion('priority', {
      in: range(1, 5),
      allowNull: true,
      message: '%{value} is invalid!  Valid priorities are 1..5 or nil.'
    });
  }

  /**
   * Validate the list data
   * @throws {ValidationError} If validation fails
   */
  validate() {
    this.validator.validate(this);
  }

  /**
   * Compile a packet for a list
   * @throws {ValidationError} One or more model values are invalid
   * @returns {Array<number>} Array of integers that represent bytes
   */
  packet() {
    this.validate();

    const basePacket = [
      this.priorityValue(),
      ...this.listEntryCharacters()
    ];

    return LengthPacketWrapper.wrapPacket(basePacket);
  }

  /**
   * Convert list entry text to EEPROM character indices
   * @private
   * @returns {Array<number>} Array of character indices
   */
  listEntryCharacters() {
    return CharacterEncoders.eepromCharsFor(this.listEntry);
  }

  /**
   * Convert priority to numeric value (0 if null)
   * @private
   * @returns {number} Priority value
   */
  priorityValue() {
    return this.priority === null ? 0 : this.priority;
  }
}

export default Protocol4List;