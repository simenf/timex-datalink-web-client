/**
 * CRC16-ARC implementation and packet wrapping functionality
 * 
 * This module provides CRC16-ARC calculation and packet wrapping
 * to match the Ruby implementation exactly.
 */

class CrcPacketsWrapper {
  /**
   * CRC16-ARC polynomial (0x8005) with reflection
   */
  static CRC16_ARC_POLYNOMIAL = 0x8005;

  /**
   * Calculate CRC16-ARC checksum for given data
   * 
   * CRC16-ARC parameters:
   * - Polynomial: 0x8005
   * - Initial value: 0x0000
   * - Reflected input: true
   * - Reflected output: true
   * - XOR output: 0x0000
   * 
   * @param {Uint8Array|Array} data - Input data bytes
   * @returns {number} CRC16 checksum
   */
  static crc16Arc(data) {
    let crc = 0x0000;

    // Convert to Uint8Array if needed
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);

    for (let i = 0; i < bytes.length; i++) {
      // Reflect input byte
      let byte = this.reflectByte(bytes[i]);
      crc ^= (byte << 8);

      for (let bit = 0; bit < 8; bit++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ this.CRC16_ARC_POLYNOMIAL;
        } else {
          crc = crc << 1;
        }
        crc &= 0xFFFF; // Keep it 16-bit
      }
    }

    // Reflect output
    return this.reflect16(crc);
  }

  /**
   * Reflect bits in a byte (reverse bit order)
   * @param {number} byte - Input byte
   * @returns {number} Reflected byte
   */
  static reflectByte(byte) {
    let reflected = 0;
    for (let i = 0; i < 8; i++) {
      if (byte & (1 << i)) {
        reflected |= (1 << (7 - i));
      }
    }
    return reflected;
  }

  /**
   * Reflect bits in a 16-bit value
   * @param {number} value - Input 16-bit value
   * @returns {number} Reflected value
   */
  static reflect16(value) {
    let reflected = 0;
    for (let i = 0; i < 16; i++) {
      if (value & (1 << i)) {
        reflected |= (1 << (15 - i));
      }
    }
    return reflected;
  }

  /**
   * Generate CRC header for a packet
   * @param {Array} packet - Packet data
   * @returns {Array} Header bytes
   */
  static crcHeader(packet) {
    return [packet.length + 3];
  }

  /**
   * Generate CRC footer for a packet
   * @param {Array} packet - Packet data
   * @returns {Array} Footer bytes (MSB, LSB)
   */
  static crcFooter(packet) {
    const header = this.crcHeader(packet);
    const crcData = [...header, ...packet];
    const crc = this.crc16Arc(crcData);

    // Return as [MSB, LSB] to match Ruby's divmod(256)
    // divmod(256) returns [quotient, remainder] which is [MSB, LSB]
    return [(crc >> 8) & 0xFF, crc & 0xFF];
  }

  /**
   * Wrap packets with CRC headers and footers
   * @param {Array<Array>} packets - Array of packet arrays
   * @returns {Array<Array>} Wrapped packets
   */
  static wrapPackets(packets) {
    return packets.map(packet => [
      ...this.crcHeader(packet),
      ...packet,
      ...this.crcFooter(packet)
    ]);
  }
}

export default CrcPacketsWrapper;