/**
 * Protocol 4 WristApp packet implementation
 * Ported from Ruby TimexDatalinkClient::Protocol4::WristApp
 */

import CpacketPaginator from '../helpers/cpacket-paginator.js';
import CrcPacketsWrapper from '../helpers/crc-packets-wrapper.js';

class Protocol4WristApp {
  static CPACKET_CLEAR = [0x93, 0x02];
  static CPACKET_SECT = [0x90, 0x02];
  static CPACKET_DATA = [0x91, 0x02];
  static CPACKET_END = [0x92, 0x02];
  static CPACKET_DATA_LENGTH = 32;
  static WRIST_APP_CODE_INDEX = 18;

  constructor({ wristAppData = null, zapFile = null }) {
    this.wristAppData = wristAppData;
    this.zapFile = zapFile;
  }

  /**
   * Compile packets for a wrist app
   * @returns {Array<Array<number>>} Two-dimensional array of integers that represent bytes
   */
  packets() {
    const packets = [
      Protocol4WristApp.CPACKET_CLEAR,
      this.cpacketSect(),
      ...this.payloads(),
      Protocol4WristApp.CPACKET_END
    ];

    return CrcPacketsWrapper.wrapPackets(packets);
  }

  /**
   * Generate section header packet
   * @private
   * @returns {Array<number>} Section header packet
   */
  cpacketSect() {
    return [
      ...Protocol4WristApp.CPACKET_SECT,
      this.payloads().length,
      1 // Fixed value from Ruby implementation
    ];
  }

  /**
   * Generate paginated payloads
   * @private
   * @returns {Array<Array<number>>} Paginated payload packets
   */
  payloads() {
    const data = this.getWristAppData();
    return CpacketPaginator.paginateCpackets({
      header: Protocol4WristApp.CPACKET_DATA,
      length: Protocol4WristApp.CPACKET_DATA_LENGTH,
      cpackets: Array.from(data) // Convert to array of bytes
    });
  }

  /**
   * Get wrist app data
   * @private
   * @returns {Uint8Array} Wrist app data bytes
   */
  getWristAppData() {
    if (this.wristAppData) {
      return new Uint8Array(this.wristAppData);
    }
    
    if (this.zapFile) {
      return this.zapFileDataBinary();
    }
    
    throw new Error('Either wristAppData or zapFile must be provided');
  }

  /**
   * Process ZAP file data to binary
   * @private
   * @returns {Uint8Array} Binary wrist app data
   */
  zapFileDataBinary() {
    // In a browser environment, we can't read files directly
    // This would need to be handled by the caller passing the file data
    throw new Error('ZAP file reading not implemented in browser environment. Pass wristAppData instead.');
  }
}

export default Protocol4WristApp;