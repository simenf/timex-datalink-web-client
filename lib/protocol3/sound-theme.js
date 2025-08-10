/**
 * Protocol 3 SoundTheme implementation
 * 
 * Handles sound theme data for Protocol 3 devices.
 * Supports loading sound data from raw data or SPC files.
 */

import CrcPacketsWrapper from '../helpers/crc-packets-wrapper.js';
import CpacketPaginator from '../helpers/cpacket-paginator.js';

class Protocol3SoundTheme {
  static CPACKET_SECT = [0x90, 0x03];
  static CPACKET_DATA = [0x91, 0x03];
  static CPACKET_END = [0x92, 0x03];

  static CPACKET_DATA_LENGTH = 32;
  static SOUND_DATA_HEADER = new Uint8Array([0x25, 0x04, 0x19, 0x69]); // "%\x04\x19i"

  /**
   * Create a SoundTheme instance
   * @param {Object} options - Sound theme configuration
   * @param {string|Uint8Array|null} options.soundThemeData - Sound theme data
   * @param {string|null} options.spcFile - Path to SPC file (not supported in browser)
   */
  constructor({ soundThemeData = null, spcFile = null }) {
    this.soundThemeData = soundThemeData;
    this.spcFile = spcFile;
  }

  /**
   * Compile packets for a sound theme
   * @returns {Array<Array<number>>} Two-dimensional array of integers that represent bytes
   */
  packets() {
    const packets = [
      this.loadSect(),
      ...this.payloads(),
      Protocol3SoundTheme.CPACKET_END
    ];

    return CrcPacketsWrapper.wrapPackets(packets);
  }

  /**
   * Generate section header packet
   * @returns {Array<number>} Section header packet
   * @private
   */
  loadSect() {
    const payloads = this.payloads();
    return [
      ...Protocol3SoundTheme.CPACKET_SECT,
      payloads.length,
      this.offset()
    ];
  }

  /**
   * Generate paginated payload packets
   * @returns {Array<Array<number>>} Paginated packets
   * @private
   */
  payloads() {
    const soundData = this.getSoundThemeData();
    const soundBytes = typeof soundData === 'string' 
      ? Array.from(new TextEncoder().encode(soundData))
      : Array.from(soundData);

    return CpacketPaginator.paginateCpackets({
      header: Protocol3SoundTheme.CPACKET_DATA,
      length: Protocol3SoundTheme.CPACKET_DATA_LENGTH,
      cpackets: soundBytes
    });
  }

  /**
   * Get sound theme data, preferring provided data over SPC file
   * @returns {string|Uint8Array} Sound theme data
   * @private
   */
  getSoundThemeData() {
    if (this.soundThemeData !== null) {
      return this.soundThemeData;
    }

    if (this.spcFile !== null) {
      throw new Error('SPC file loading is not supported in browser environment. Use soundThemeData instead.');
    }

    throw new Error('Either soundThemeData or spcFile must be provided');
  }

  /**
   * Calculate offset for sound data
   * @returns {number} Offset value
   * @private
   */
  offset() {
    const soundData = this.getSoundThemeData();
    const dataLength = typeof soundData === 'string' 
      ? new TextEncoder().encode(soundData).length
      : soundData.length;
    
    return 0x100 - dataLength;
  }
}

export default Protocol3SoundTheme;