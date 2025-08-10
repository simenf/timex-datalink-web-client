/**
 * Protocol 1 Start packet implementation
 * Ported from Ruby TimexDatalinkClient::Protocol1::Start
 */

import CrcPacketsWrapper from '../helpers/crc-packets-wrapper.js';

class Protocol1Start {
  static CPACKET_START = [0x20, 0x00, 0x00, 0x01];

  constructor() {
    // No configuration needed for start packet
  }

  /**
   * Compile packets for protocol start
   * @returns {Array<Array<number>>} Two-dimensional array of integers that represent bytes
   */
  packets() {
    return CrcPacketsWrapper.wrapPackets([Protocol1Start.CPACKET_START]);
  }
}

export default Protocol1Start;