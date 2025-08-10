/**
 * Protocol 4 SoundTheme packet implementation
 * Ported from Ruby TimexDatalinkClient::Protocol4::SoundTheme
 */

import CpacketPaginator from '../helpers/cpacket-paginator.js';
import CrcPacketsWrapper from '../helpers/crc-packets-wrapper.js';

class Protocol4SoundTheme {
  static CPACKET_SECT = [0x90, 0x03];
  static CPACKET_DATA = [0x91, 0x03];
  static CPACKET_END = [0x92, 0x03];
  static CPACKET_DATA_LENGTH = 32;
  static SOUND_DATA_HEADER = [0x25, 0x04, 0x19, 0x69]; // "\x25\x04\x19\x69" as bytes

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
      Protocol4SoundTheme.CPACKET_END
    ];

    return CrcPacketsWrapper.wrapPackets(packets);
  }

  /**
   * Generate section header packet
   * @private
   * @returns {Array<number>} Section header packet
   */
  loadSect() {
    return [
      ...Protocol4SoundTheme.CPACKET_SECT,
      this.payloads().length,
      this.offset()
    ];
  }

  /**
   * Generate paginated payloads
   * @private
   * @returns {Array<Array<number>>} Paginated payload packets
   */
  payloads() {
    const data = this.getSoundThemeData();
    return CpacketPaginator.paginateCpackets({
      header: Protocol4SoundTheme.CPACKET_DATA,
      length: Protocol4SoundTheme.CPACKET_DATA_LENGTH,
      cpackets: Array.from(data) // Convert to array of bytes
    });
  }

  /**
   * Get sound theme data
   * @private
   * @returns {Uint8Array} Sound theme data bytes
   */
  getSoundThemeData() {
    if (this.soundThemeData) {
      return new Uint8Array(this.soundThemeData);
    }
    
    if (this.spcFile) {
      return this.spcFileDataWithoutHeader();
    }
    
    throw new Error('Either soundThemeData or spcFile must be provided');
  }

  /**
   * Read SPC file data without header
   * @private
   * @returns {Uint8Array} SPC file data without header
   */
  spcFileDataWithoutHeader() {
    // In a browser environment, we can't read files directly
    // This would need to be handled by the caller passing the file data
    throw new Error('SPC file reading not implemented in browser environment. Pass soundThemeData instead.');
  }

  /**
   * Calculate offset value
   * @private
   * @returns {number} Offset value
   */
  offset() {
    const data = this.getSoundThemeData();
    return 0x100 - data.length;
  }
}

export default Protocol4SoundTheme;