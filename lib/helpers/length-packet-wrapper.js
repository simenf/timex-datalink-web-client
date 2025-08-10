/**
 * Length packet wrapper utility
 * 
 * Wraps packets with their length as the first byte
 */

class LengthPacketWrapper {
  /**
   * Wrap a packet with its length
   * @param {Array<number>} packet - The packet to wrap
   * @returns {Array<number>} Packet with length prefix
   */
  static wrapPacket(packet) {
    return [packet.length + 1, ...packet];
  }
}

export default LengthPacketWrapper;