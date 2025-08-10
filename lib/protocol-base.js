/**
 * Base Protocol Interface
 * 
 * Defines the common interface that all protocol implementations must follow.
 * This provides a consistent API for protocol detection, instantiation, and usage.
 */

export class ProtocolBase {
  /**
   * Protocol version number (must be overridden by subclasses)
   * @returns {number} Protocol version
   */
  static get VERSION() {
    throw new Error('Protocol VERSION must be defined by subclass');
  }

  /**
   * Protocol name (must be overridden by subclasses)
   * @returns {string} Protocol name
   */
  static get NAME() {
    throw new Error('Protocol NAME must be defined by subclass');
  }

  /**
   * Supported device models (must be overridden by subclasses)
   * @returns {Array<string>} Array of supported device model names
   */
  static get SUPPORTED_DEVICES() {
    throw new Error('Protocol SUPPORTED_DEVICES must be defined by subclass');
  }

  /**
   * Protocol capabilities (must be overridden by subclasses)
   * @returns {Object} Capabilities object
   */
  static get CAPABILITIES() {
    return {
      bidirectional: false,
      time: false,
      alarms: false,
      eeprom: false,
      soundOptions: false,
      wristApps: false
    };
  }

  /**
   * Get protocol start packet constant
   * @returns {Array<number>} Start packet bytes
   */
  static get START_PACKET() {
    throw new Error('Protocol START_PACKET must be defined by subclass');
  }

  /**
   * Create protocol-specific component classes
   * @returns {Object} Object containing component classes
   */
  static getComponents() {
    throw new Error('Protocol getComponents() must be implemented by subclass');
  }

  /**
   * Detect if this protocol is compatible with given device info
   * @param {Object} deviceInfo - Device information
   * @returns {boolean} True if compatible
   */
  static isCompatible(deviceInfo) {
    // Default implementation - can be overridden by subclasses
    if (!deviceInfo) return false;
    
    // Check if device model is in supported list
    if (deviceInfo.model && this.SUPPORTED_DEVICES.includes(deviceInfo.model)) {
      return true;
    }
    
    // Check if protocol version matches
    if (deviceInfo.protocol && deviceInfo.protocol === this.VERSION) {
      return true;
    }
    
    return false;
  }

  /**
   * Get protocol information
   * @returns {Object} Protocol information
   */
  static getInfo() {
    return {
      version: this.VERSION,
      name: this.NAME,
      supportedDevices: this.SUPPORTED_DEVICES,
      capabilities: this.CAPABILITIES,
      startPacket: this.START_PACKET
    };
  }

  /**
   * Validate protocol implementation
   * @returns {Object} Validation result
   */
  static validate() {
    const errors = [];
    
    try {
      if (typeof this.VERSION !== 'number') {
        errors.push('VERSION must be a number');
      }
      
      if (typeof this.NAME !== 'string') {
        errors.push('NAME must be a string');
      }
      
      if (!Array.isArray(this.SUPPORTED_DEVICES)) {
        errors.push('SUPPORTED_DEVICES must be an array');
      }
      
      if (!Array.isArray(this.START_PACKET)) {
        errors.push('START_PACKET must be an array');
      }
      
      if (typeof this.getComponents !== 'function') {
        errors.push('getComponents() must be implemented');
      }
      
    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Protocol Component Base Class
 * 
 * Base class for all protocol components (Start, Time, Alarm, etc.)
 */
export class ProtocolComponentBase {
  /**
   * Generate packets for this component
   * @returns {Array<Array<number>>} Array of packet arrays
   */
  packets() {
    throw new Error('packets() method must be implemented by component subclass');
  }

  /**
   * Validate component data
   * @returns {Object} Validation result
   */
  validate() {
    return { isValid: true, errors: [] };
  }

  /**
   * Get component information
   * @returns {Object} Component information
   */
  getInfo() {
    return {
      name: this.constructor.name,
      hasPacketsMethod: typeof this.packets === 'function',
      hasValidateMethod: typeof this.validate === 'function'
    };
  }
}