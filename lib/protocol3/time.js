/**
 * Protocol 3 Time class
 * 
 * Implements time data validation and packet generation for Protocol 3 communication.
 * This class handles time setting with timezone support, date formats, and 12h/24h modes.
 */

import { CharacterEncoders } from '../helpers/character-encoders.js';
import CrcPacketsWrapper from '../helpers/crc-packets-wrapper.js';
import { DataValidator, ValidationError, range } from '../helpers/data-validator.js';

class Time {
  /**
   * Time packet constant
   */
  static CPACKET_TIME = [0x32];

  /**
   * Date format mapping - matches Ruby DATE_FORMAT_MAP
   */
  static DATE_FORMAT_MAP = {
    "%_m-%d-%y": 0,
    "%_d-%m-%y": 1,
    "%y-%m-%d": 2,
    "%_m.%d.%y": 4,
    "%_d.%m.%y": 5,
    "%y.%m.%d": 6
  };

  /**
   * Create a Time instance
   * 
   * @param {Object} options - Time configuration
   * @param {number} options.zone - Time zone number (1 or 2)
   * @param {boolean} options.is24h - Toggle 24 hour time
   * @param {string} options.dateFormat - Date format (strftime format)
   * @param {Date} options.time - Time to set (JavaScript Date object)
   * @param {string|null} options.name - Name of time zone (3 chars max, optional)
   */
  constructor({ zone, is24h, dateFormat, time, name = null }) {
    this.zone = zone;
    this.is24h = is24h;
    this.dateFormat = dateFormat;
    this.time = time;
    this.name = name;

    // Set up validation
    this.validator = new DataValidator();
    this.setupValidations();
  }

  /**
   * Set up validation rules
   * @private
   */
  setupValidations() {
    // Zone validation: must be 1 or 2
    this.validator.validateInclusion('zone', {
      in: range(1, 2),
      message: 'Zone %{value} is invalid!  Valid zones are 1..2.'
    });

    // Date format validation
    this.validator.validateInclusion('dateFormat', {
      in: Object.keys(Time.DATE_FORMAT_MAP),
      message: `Date format %{value} is invalid!  Valid date formats are ${JSON.stringify(Object.keys(Time.DATE_FORMAT_MAP))}.`
    });
  }

  /**
   * Generate time packets with CRC wrapping
   * 
   * @returns {Array<Array<number>>} Array of CRC-wrapped packet arrays
   * @throws {ValidationError} If validation fails
   */
  packets() {
    // Validate input data
    this.validator.validate(this);

    const packet = [
      ...Time.CPACKET_TIME,
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

    const rawPackets = [packet];
    return CrcPacketsWrapper.wrapPackets(rawPackets);
  }

  /**
   * Get formatted timezone name
   * @returns {string} Formatted timezone name
   * @private
   */
  nameFormatted() {
    if (this.name) {
      return this.name;
    }
    
    // JavaScript Date objects don't have rich timezone info like Ruby's TZInfo
    // Default to "tz" + zone number like Ruby does when no timezone info is available
    return `tz${this.zone}`;
  }

  /**
   * Get character-encoded timezone name (3 characters, padded)
   * @returns {Array<number>} Array of 3 character indices
   * @private
   */
  nameCharacters() {
    return CharacterEncoders.charsFor(this.nameFormatted(), {
      length: 3,
      pad: true
    });
  }

  /**
   * Get year modulo 1900 (2-digit year)
   * @returns {number} Year mod 100
   * @private
   */
  yearMod1900() {
    return this.time.getFullYear() % 100;
  }

  /**
   * Get weekday from Monday (0=Monday, 6=Sunday)
   * JavaScript getDay() returns 0=Sunday, so we need to convert
   * @returns {number} Weekday from Monday
   * @private
   */
  wdayFromMonday() {
    return (this.time.getDay() + 6) % 7;
  }

  /**
   * Get 24h format value (1 for 12h, 2 for 24h)
   * @returns {number} Format value
   * @private
   */
  is24hValue() {
    return this.is24h ? 2 : 1;
  }

  /**
   * Get date format value from mapping
   * @returns {number} Date format value
   * @private
   */
  dateFormatValue() {
    return Time.DATE_FORMAT_MAP[this.dateFormat];
  }
}

export default Time;