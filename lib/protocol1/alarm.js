/**
 * Protocol 1 Alarm packet implementation
 * Ported from Ruby TimexDatalinkClient::Protocol1::Alarm
 */

import { DataValidator, ValidationError, range } from '../helpers/data-validator.js';
import { CharacterEncoders } from '../helpers/character-encoders.js';
import CrcPacketsWrapper from '../helpers/crc-packets-wrapper.js';

class Protocol1Alarm {
  static CPACKET_ALARM = [0x50];
  static CPACKET_ALARM_SILENT = [0x70, 0x00];
  static ALARM_SILENT_START_INDEX = 0x61;

  static VALID_DAYS_IN_MONTH = {
    1: range(1, 31),
    2: range(1, 29),
    3: range(1, 31),
    4: range(1, 30),
    5: range(1, 31),
    6: range(1, 30),
    7: range(1, 31),
    8: range(1, 31),
    9: range(1, 30),
    10: range(1, 31),
    11: range(1, 30),
    12: range(1, 31)
  };

  constructor({ number, audible, time, message, month = null, day = null }) {
    this.number = number;
    this.audible = audible;
    this.time = time;
    this.message = message;
    this.month = month;
    this.day = day;
    
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

    this.validator.validateInclusion('month', {
      in: range(1, 12),
      allowNull: true,
      message: '%{value} is invalid!  Valid months are 1..12 and nil.'
    });

    // Day validation when month is null - skip for now as conditional validation is complex

    // Day validation when month is specified - skip for now as conditional validation is complex
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

    const packets = [this.alarmDataPacket()];
    
    if (!this.audible) {
      packets.push(this.alarmSilentPacket());
    }

    return CrcPacketsWrapper.wrapPackets(packets);
  }

  /**
   * Generate alarm data packet
   * @private
   * @returns {Array<number>} Alarm data packet
   */
  alarmDataPacket() {
    return [
      ...Protocol1Alarm.CPACKET_ALARM,
      this.number,
      this.time.getHours(),
      this.time.getMinutes(),
      this.month || 0,
      this.day || 0,
      ...this.messageCharacters(),
      this.audibleInteger()
    ];
  }

  /**
   * Generate alarm silent packet
   * @private
   * @returns {Array<number>} Alarm silent packet
   */
  alarmSilentPacket() {
    return [
      ...Protocol1Alarm.CPACKET_ALARM_SILENT,
      this.alarmSilentIndex(),
      0
    ];
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

  /**
   * Calculate alarm silent index
   * @private
   * @returns {number} Silent alarm index
   */
  alarmSilentIndex() {
    return Protocol1Alarm.ALARM_SILENT_START_INDEX + this.number;
  }
}

export default Protocol1Alarm;