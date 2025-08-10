/**
 * Protocol 1 Sync packet implementation
 * Ported from Ruby TimexDatalinkClient::Protocol1::Sync
 */

class Protocol1Sync {
  static PING_BYTE = [0x78];
  static SYNC_1_BYTE = [0x55];
  static SYNC_2_BYTE = [0xaa];
  static SYNC_2_LENGTH = 40;

  constructor({ length = 300 } = {}) {
    this.length = length;
  }

  /**
   * Compile packets for synchronization data
   * @returns {Array<Array<number>>} Two-dimensional array of integers that represent bytes
   */
  packets() {
    return [
      [
        ...Protocol1Sync.PING_BYTE,
        ...this.renderSync1(),
        ...this.renderSync2()
      ]
    ];
  }

  /**
   * Generate sync1 bytes (0x55 repeated)
   * @private
   * @returns {Array<number>} Array of sync1 bytes
   */
  renderSync1() {
    return new Array(this.length).fill(Protocol1Sync.SYNC_1_BYTE[0]);
  }

  /**
   * Generate sync2 bytes (0xaa repeated)
   * @private
   * @returns {Array<number>} Array of sync2 bytes
   */
  renderSync2() {
    return new Array(Protocol1Sync.SYNC_2_LENGTH).fill(Protocol1Sync.SYNC_2_BYTE[0]);
  }
}

export default Protocol1Sync;