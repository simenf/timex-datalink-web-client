/**
 * Protocol 3 SoundOptions implementation
 * 
 * Handles sound configuration for Protocol 3 devices.
 * Controls hourly chime and button beep settings.
 */

import CrcPacketsWrapper from '../helpers/crc-packets-wrapper.js';

class Protocol3SoundOptions {
  static CPACKET_BEEPS = [0x71];

  /**
   * Create a SoundOptions instance
   * @param {Object} options - Sound configuration
   * @param {boolean} options.hourlyChime - Toggle hourly chime sounds
   * @param {boolean} options.buttonBeep - Toggle button beep sounds
   */
  constructor({ hourlyChime, buttonBeep }) {
    this.hourlyChime = hourlyChime;
    this.buttonBeep = buttonBeep;
  }

  /**
   * Compile packets for sound options
   * @returns {Array<Array<number>>} Two-dimensional array of integers that represent bytes
   */
  packets() {
    const packet = [
      ...Protocol3SoundOptions.CPACKET_BEEPS,
      this.hourlyChimeInteger(),
      this.buttonBeepInteger()
    ];

    return CrcPacketsWrapper.wrapPackets([packet]);
  }

  /**
   * Convert hourly chime boolean to integer
   * @returns {number} 1 if enabled, 0 if disabled
   * @private
   */
  hourlyChimeInteger() {
    return this.hourlyChime ? 1 : 0;
  }

  /**
   * Convert button beep boolean to integer
   * @returns {number} 1 if enabled, 0 if disabled
   * @private
   */
  buttonBeepInteger() {
    return this.buttonBeep ? 1 : 0;
  }
}

export default Protocol3SoundOptions;