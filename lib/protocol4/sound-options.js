/**
 * Protocol 4 SoundOptions packet implementation
 * Ported from Ruby TimexDatalinkClient::Protocol4::SoundOptions
 */

import CrcPacketsWrapper from '../helpers/crc-packets-wrapper.js';

class Protocol4SoundOptions {
  static CPACKET_BEEPS = [0x71];

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
      ...Protocol4SoundOptions.CPACKET_BEEPS,
      this.hourlyChimeInteger(),
      this.buttonBeepInteger()
    ];

    return CrcPacketsWrapper.wrapPackets([packet]);
  }

  /**
   * Convert hourly chime boolean to integer
   * @private
   * @returns {number} 1 for enabled, 0 for disabled
   */
  hourlyChimeInteger() {
    return this.hourlyChime ? 1 : 0;
  }

  /**
   * Convert button beep boolean to integer
   * @private
   * @returns {number} 1 for enabled, 0 for disabled
   */
  buttonBeepInteger() {
    return this.buttonBeep ? 1 : 0;
  }
}

export default Protocol4SoundOptions;