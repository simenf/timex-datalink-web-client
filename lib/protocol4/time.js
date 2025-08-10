/**
 * Protocol 4 Time packet implementation
 * Ported from Ruby TimexDatalinkClient::Protocol4::Time
 */

import { DataValidator, ValidationError, range } from '../helpers/data-validator.js';
import { CharacterEncoders } from '../helpers/character-encoders.js';
import CrcPacketsWrapper from '../helpers/crc-packets-wrapper.js';

class Protocol4Time {
  static CPACKET_TIME = [0x32];

  static DATE_FORMAT_MAP = {
    '%_m-%d-%y': 0,
    '%_d-%m-%y': 1,
    '%y-%m-%d': 2,
    '%_m.%d.%y': 4,
    '%_d.%m.%y': 5,
    '%y.%m.%d': 6
  };

  constructor({ zone, is24h, dateFormat, time, name = null }) {
    this.zone = zone;
    this.is24h = is24h;
    this.dateFormat = dateFormat;
    this.time = time;
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

    this.validator.validateInclusion('dateFormat', {
      in: Object.keys(Protocol4Time.DATE_FORMAT_MAP),
      message: `%{value} is invalid!  Valid date formats are ${Object.keys(Protocol4Time.DATE_FORMAT_MAP)}.`
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
      ...Protocol4Time.CPACKET_TIME,
      this.zone,
      this.time.getSeconds(),
      this.time.getHours(),
      this.time.getMinutes(),
      this.time.getMonth() + 1, // JavaScript months are 0-based
      this.time.getDate(),
      this.yearMod1900(),
      ...this.nameCharacters(),
      this.wdayFromMonday(),
      this.is24hValue(),
      this.dateFormatValue()
    ];

    return CrcPacketsWrapper.wrapPackets([packet]);
  }

  /**
   * Get formatted name (default to time zone or "tz{zone}")
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

  /**
   * Convert date format string to numeric value
   * @private
   * @returns {number} Date format value
   */
  dateFormatValue() {
    return Protocol4Time.DATE_FORMAT_MAP[this.dateFormat];
  }
}

export default Protocol4Time;