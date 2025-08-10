/**
 * Protocol 4 Start packet implementation
 * Ported from Ruby TimexDatalinkClient::Protocol4::Start
 */

import CrcPacketsWrapper from '../helpers/crc-packets-wrapper.js';

class Protocol4Start {
  static CPACKET_START = [0x20, 0x00, 0x00, 0x04];

  constructor() {
    // No configuration needed for start packet
  }

  /**
   * Compile packets for protocol start
   * @returns {Array<Array<number>>} Two-dimensional array of integers that represent bytes
   */
  packets() {
    return CrcPacketsWrapper.wrapPackets([Protocol4Start.CPACKET_START]);
  }
}

export default Protocol4Start;