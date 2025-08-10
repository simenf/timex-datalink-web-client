/**
 * Protocol 3 Sync class
 * 
 * Implements synchronization packet generation for Protocol 3 communication.
 * This class generates the sync sequence required for reliable communication
 * with Protocol 3 compatible Timex Datalink devices.
 */

class Sync {
  /**
   * Sync byte constants
   */
  static PING_BYTE = [0x78];
  static SYNC_1_BYTE = [0x55];
  static SYNC_2_BYTE = [0xaa];
  static SYNC_2_LENGTH = 40;

  /**
   * Create a Sync instance
   * 
   * @param {Object} options - Configuration options
   * @param {number} options.length - Number of 0x55 sync bytes to use (default: 300)
   */
  constructor({ length = 300 } = {}) {
    this.length = length;
  }

  /**
   * Generate sync packets
   * 
   * @returns {Array<Array<number>>} Array containing single sync packet
   */
  packets() {
    const syncPacket = [
      ...Sync.PING_BYTE,
      ...this.renderSync1(),
      ...this.renderSync2()
    ];
    
    return [syncPacket];
  }

  /**
   * Generate sync1 bytes (0x55 repeated length times)
   * 
   * @returns {Array<number>} Array of sync1 bytes
   * @private
   */
  renderSync1() {
    return new Array(this.length).fill(Sync.SYNC_1_BYTE[0]);
  }

  /**
   * Generate sync2 bytes (0xaa repeated SYNC_2_LENGTH times)
   * 
   * @returns {Array<number>} Array of sync2 bytes
   * @private
   */
  renderSync2() {
    return new Array(Sync.SYNC_2_LENGTH).fill(Sync.SYNC_2_BYTE[0]);
  }
}

export default Sync;