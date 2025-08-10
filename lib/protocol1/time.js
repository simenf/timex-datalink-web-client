/**
 * Protocol 1 Time packet implementation
 * Ported from Ruby TimexDatalinkClient::Protocol1::Time
 */

import { DataValidator, ValidationError, range } from '../helpers/data-validator.js';
import CrcPacketsWrapper from '../helpers/crc-packets-wrapper.js';

class Protocol1Time {
  static CPACKET_TIME = [0x30];

  constructor({ zone, is24h, time }) {
    this.zone = zone;
    this.is24h = is24h;
    this.time = time;
    
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
   * Validate the time data
   * @throws {ValidationError} If validation fails
   */
  validate() {
    this.validator.validate(this);
  }

  /**
   * Compile packets for a time
   * @throws {ValidationError} One or more model values are invalid
   * @returns {Array<Array<number>>} Two-dimensional array of integers that represent bytes
   */
  packets() {
    this.validate();

    const packet = [
      ...Protocol1Time.CPACKET_TIME,
      this.zone,
      this.time.getHours(),
      this.time.getMinutes(),
      this.time.getMonth() + 1, // JavaScript months are 0-based
      this.time.getDate(),
      this.yearMod1900(),
      this.wdayFromMonday(),
      this.time.getSeconds(),
      this.is24hValue()
    ];

    return CrcPacketsWrapper.wrapPackets([packet]);
  }

  /**
   * Get year modulo 1900 (last two digits)
   * @private
   * @returns {number} Year mod 100
   */
  yearMod1900() {
    return this.time.getFullYear() % 100;
  }

  /**
   * Convert JavaScript day of week (0=Sunday) to Monday-based (0=Monday)
   * @private
   * @returns {number} Day of week starting from Monday
   */
  wdayFromMonday() {
    return (this.time.getDay() + 6) % 7;
  }

  /**
   * Convert boolean is24h to numeric value
   * @private
   * @returns {number} 2 for 24h, 1 for 12h
   */
  is24hValue() {
    return this.is24h ? 2 : 1;
  }
}

export default Protocol1Time;