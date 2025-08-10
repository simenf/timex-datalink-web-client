/**
 * Protocol 4 End packet implementation
 * Ported from Ruby TimexDatalinkClient::Protocol4::End
 */

import CrcPacketsWrapper from '../helpers/crc-packets-wrapper.js';

class Protocol4End {
  static CPACKET_SKIP = [0x21];

  constructor() {
    // No configuration needed for end packet
  }

  /**
   * Compile packets for protocol end
   * @returns {Array<Array<number>>} Two-dimensional array of integers that represent bytes
   */
  packets() {
    return CrcPacketsWrapper.wrapPackets([Protocol4End.CPACKET_SKIP]);
  }
}

export default Protocol4End;