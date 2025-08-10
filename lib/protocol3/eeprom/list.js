/**
 * Protocol 3 EEPROM List implementation
 * 
 * Handles list data encoding for EEPROM storage
 */

import { CharacterEncoders } from '../../helpers/character-encoders.js';
import LengthPacketWrapper from '../../helpers/length-packet-wrapper.js';

class Protocol3EepromList {
  /**
   * Create a List instance
   * @param {Object} options - List configuration
   * @param {string} options.listEntry - List entry text
   * @param {number|null} options.priority - List priority (1-5 or null)
   */
  constructor({ listEntry, priority }) {
    this.listEntry = listEntry;
    this.priority = priority;
    
    this.validate();
  }

  /**
   * Validate list parameters
   * @throws {Error} If validation fails
   */
  validate() {
    if (this.priority !== null && (!Number.isInteger(this.priority) || this.priority < 1 || this.priority > 5)) {
      throw new Error(`${this.priority} is invalid! Valid priorities are 1..5 or null.`);
    }
  }

  /**
   * Compile a packet for a list
   * @returns {Array<number>} Array of integers that represent bytes
   */
  packet() {
    this.validate();

    const rawPacket = [
      this.priorityValue(),
      ...this.listEntryCharacters()
    ];

    return LengthPacketWrapper.wrapPacket(rawPacket);
  }

  /**
   * Convert list entry to EEPROM character encoding
   * @returns {Array<number>} Array of encoded characters
   * @private
   */
  listEntryCharacters() {
    return CharacterEncoders.eepromCharsFor(this.listEntry);
  }

  /**
   * Convert priority to numeric value
   * @returns {number} Priority value (0 if null, otherwise the priority)
   * @private
   */
  priorityValue() {
    return this.priority === null ? 0 : this.priority;
  }
}

export default Protocol3EepromList;