/**
 * Protocol 3 Start class
 * 
 * Implements the start packet generation for Protocol 3 communication.
 * This class generates the initial packet required to begin communication
 * with a Protocol 3 compatible Timex Datalink device.
 */

import CrcPacketsWrapper from '../helpers/crc-packets-wrapper.js';

class Start {
  /**
   * Start packet constant - matches Ruby CPACKET_START
   */
  static CPACKET_START = [0x20, 0x00, 0x00, 0x03];

  /**
   * Generate start packets with CRC wrapping
   * 
   * @returns {Array<Array<number>>} Array of CRC-wrapped packet arrays
   */
  packets() {
    const rawPackets = [Start.CPACKET_START];
    return CrcPacketsWrapper.wrapPackets(rawPackets);
  }
}

export default Start;