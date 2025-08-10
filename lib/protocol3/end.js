/**
 * Protocol 3 End class
 * 
 * Implements protocol termination packet generation for Protocol 3 communication.
 * This class generates the end packet required to properly terminate communication
 * with a Protocol 3 compatible Timex Datalink device.
 */

import CrcPacketsWrapper from '../helpers/crc-packets-wrapper.js';

class End {
  /**
   * End packet constant - matches Ruby CPACKET_SKIP
   */
  static CPACKET_SKIP = [0x21];

  /**
   * Generate end packets with CRC wrapping
   * 
   * @returns {Array<Array<number>>} Array of CRC-wrapped packet arrays
   */
  packets() {
    const rawPackets = [End.CPACKET_SKIP];
    return CrcPacketsWrapper.wrapPackets(rawPackets);
  }
}

export default End;