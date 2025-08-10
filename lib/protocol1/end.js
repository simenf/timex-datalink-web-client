/**
 * Protocol 1 End packet implementation
 * Ported from Ruby TimexDatalinkClient::Protocol1::End
 */

import CrcPacketsWrapper from '../helpers/crc-packets-wrapper.js';

class Protocol1End {
  static CPACKET_END = [0x21];

  constructor() {
    // No configuration needed for end packet
  }

  /**
   * Compile packets for protocol end
   * @returns {Array<Array<number>>} Two-dimensional array of integers that represent bytes
   */
  packets() {
    return CrcPacketsWrapper.wrapPackets([Protocol1End.CPACKET_END]);
  }
}

export default Protocol1End;