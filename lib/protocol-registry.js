/**
 * Protocol Registry
 * 
 * Central registry for managing protocol implementations and providing
 * protocol detection, selection, and instantiation capabilities.
 */

import { ProtocolBase } from './protocol-base.js';

export class ProtocolRegistry {
  constructor() {
    this.protocols = new Map();
    this.deviceMappings = new Map();
  }

  /**
   * Register a protocol implementation
   * @param {class} ProtocolClass - Protocol class extending ProtocolBase
   */
  register(ProtocolClass) {
    if (!ProtocolClass || typeof ProtocolClass !== 'function') {
      throw new Error('Protocol class is required');
    }

    // Validate protocol implementation
    const validation = ProtocolClass.validate();
    if (!validation.isValid) {
      throw new Error(`Invalid protocol implementation: ${validation.errors.join(', ')}`);
    }

    const version = ProtocolClass.VERSION;
    const name = ProtocolClass.NAME;

    if (this.protocols.has(version)) {
      throw new Error(`Protocol version ${version} is already registered`);
    }

    this.protocols.set(version, ProtocolClass);

    // Register device mappings
    for (const device of ProtocolClass.SUPPORTED_DEVICES) {
      if (!this.deviceMappings.has(device)) {
        this.deviceMappings.set(device, []);
      }
      this.deviceMappings.get(device).push(version);
    }

    console.log(`Registered protocol: ${name} (version ${version})`);
  }

  /**
   * Unregister a protocol
   * @param {number} version - Protocol version to unregister
   */
  unregister(version) {
    const ProtocolClass = this.protocols.get(version);
    if (!ProtocolClass) {
      return false;
    }

    // Remove device mappings
    for (const device of ProtocolClass.SUPPORTED_DEVICES) {
      const versions = this.deviceMappings.get(device);
      if (versions) {
        const index = versions.indexOf(version);
        if (index !== -1) {
          versions.splice(index, 1);
        }
        if (versions.length === 0) {
          this.deviceMappings.delete(device);
        }
      }
    }

    this.protocols.delete(version);
    console.log(`Unregistered protocol version ${version}`);
    return true;
  }

  /**
   * Get protocol by version
   * @param {number} version - Protocol version
   * @returns {class|null} Protocol class or null if not found
   */
  getProtocol(version) {
    return this.protocols.get(version) || null;
  }

  /**
   * Get all registered protocols
   * @returns {Array<class>} Array of protocol classes
   */
  getAllProtocols() {
    return Array.from(this.protocols.values());
  }

  /**
   * Get protocols compatible with device
   * @param {string} deviceModel - Device model name
   * @returns {Array<class>} Array of compatible protocol classes
   */
  getProtocolsForDevice(deviceModel) {
    const versions = this.deviceMappings.get(deviceModel) || [];
    return versions.map(version => this.protocols.get(version)).filter(Boolean);
  }

  /**
   * Detect protocol from device information
   * @param {Object} deviceInfo - Device information
   * @param {string} deviceInfo.model - Device model
   * @param {number} deviceInfo.protocol - Protocol version (if known)
   * @param {Array<number>} deviceInfo.response - Device response bytes (if available)
   * @returns {class|null} Best matching protocol class
   */
  detectProtocol(deviceInfo) {
    if (!deviceInfo) {
      return null;
    }

    // If protocol version is explicitly specified, use it
    if (deviceInfo.protocol && this.protocols.has(deviceInfo.protocol)) {
      const ProtocolClass = this.protocols.get(deviceInfo.protocol);
      if (ProtocolClass.isCompatible(deviceInfo)) {
        return ProtocolClass;
      }
    }

    // Try to detect by device model
    if (deviceInfo.model) {
      const compatibleProtocols = this.getProtocolsForDevice(deviceInfo.model);
      if (compatibleProtocols.length > 0) {
        // Return the highest version protocol that's compatible
        return compatibleProtocols
          .filter(protocol => protocol.isCompatible(deviceInfo))
          .sort((a, b) => b.VERSION - a.VERSION)[0] || null;
      }
    }

    // Try to detect by device response pattern
    if (deviceInfo.response && Array.isArray(deviceInfo.response)) {
      for (const ProtocolClass of this.protocols.values()) {
        if (this.matchesResponsePattern(deviceInfo.response, ProtocolClass)) {
          return ProtocolClass;
        }
      }
    }

    // Fallback: test all protocols for compatibility
    for (const ProtocolClass of this.protocols.values()) {
      if (ProtocolClass.isCompatible(deviceInfo)) {
        return ProtocolClass;
      }
    }

    return null;
  }

  /**
   * Check if device response matches protocol pattern
   * @param {Array<number>} response - Device response bytes
   * @param {class} ProtocolClass - Protocol class to test
   * @returns {boolean} True if response matches protocol pattern
   * @private
   */
  matchesResponsePattern(response, ProtocolClass) {
    // This is a placeholder for protocol-specific response pattern matching
    // Each protocol could define its own response patterns for detection
    
    // For now, we'll use a simple heuristic based on start packet
    const startPacket = ProtocolClass.START_PACKET;
    if (!startPacket || startPacket.length === 0) {
      return false;
    }

    // Check if response contains or starts with protocol identifier
    if (response.length >= startPacket.length) {
      // Check if response starts with start packet
      for (let i = 0; i < startPacket.length; i++) {
        if (response[i] === startPacket[i]) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Auto-detect protocol from device
   * @param {Object} serialAdapter - Serial adapter for communication
   * @param {Object} options - Detection options
   * @returns {Promise<class|null>} Detected protocol class
   */
  async autoDetectProtocol(serialAdapter, options = {}) {
    const {
      timeout = 5000,
      retries = 3,
      verbose = false
    } = options;

    if (!serialAdapter || !serialAdapter.isPortConnected()) {
      throw new Error('Serial adapter must be connected for auto-detection');
    }

    if (verbose) {
      console.log('Starting protocol auto-detection...');
    }

    // Try each registered protocol in order of version (highest first)
    const protocols = Array.from(this.protocols.values())
      .sort((a, b) => b.VERSION - a.VERSION);

    for (const ProtocolClass of protocols) {
      if (verbose) {
        console.log(`Testing protocol ${ProtocolClass.NAME} (version ${ProtocolClass.VERSION})`);
      }

      try {
        // Create a test instance of the protocol's Start component
        const components = ProtocolClass.getComponents();
        if (!components.Start) {
          if (verbose) {
            console.log(`Protocol ${ProtocolClass.NAME} has no Start component, skipping`);
          }
          continue;
        }

        const startComponent = new components.Start();
        const testPackets = startComponent.packets();

        // Send test packets and wait for response
        for (let attempt = 0; attempt < retries; attempt++) {
          try {
            await serialAdapter.write(testPackets);
            
            // Wait for response
            const response = await serialAdapter.read(timeout);
            
            if (response && response.length > 0) {
              if (verbose) {
                console.log(`Received response from protocol ${ProtocolClass.NAME}:`, 
                  response.slice(0, 10).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '));
              }

              // Check if response indicates successful communication
              const deviceInfo = {
                protocol: ProtocolClass.VERSION,
                response: response
              };

              if (ProtocolClass.isCompatible(deviceInfo)) {
                if (verbose) {
                  console.log(`Successfully detected protocol: ${ProtocolClass.NAME}`);
                }
                return ProtocolClass;
              }
            }
          } catch (error) {
            if (verbose) {
              console.log(`Attempt ${attempt + 1} failed for protocol ${ProtocolClass.NAME}: ${error.message}`);
            }
          }
        }
      } catch (error) {
        if (verbose) {
          console.log(`Error testing protocol ${ProtocolClass.NAME}: ${error.message}`);
        }
      }
    }

    if (verbose) {
      console.log('Protocol auto-detection failed - no compatible protocol found');
    }

    return null;
  }

  /**
   * Get registry statistics
   * @returns {Object} Registry statistics
   */
  getStats() {
    const protocolVersions = Array.from(this.protocols.keys()).sort((a, b) => a - b);
    const deviceModels = Array.from(this.deviceMappings.keys()).sort();
    
    return {
      protocolCount: this.protocols.size,
      deviceModelCount: this.deviceMappings.size,
      protocolVersions,
      deviceModels,
      protocolInfo: protocolVersions.map(version => {
        const ProtocolClass = this.protocols.get(version);
        return ProtocolClass.getInfo();
      })
    };
  }

  /**
   * Clear all registered protocols
   */
  clear() {
    this.protocols.clear();
    this.deviceMappings.clear();
    console.log('Protocol registry cleared');
  }

  /**
   * Export registry state
   * @returns {Object} Registry state
   */
  export() {
    return {
      protocols: Array.from(this.protocols.entries()).map(([version, ProtocolClass]) => ({
        version,
        info: ProtocolClass.getInfo()
      })),
      deviceMappings: Array.from(this.deviceMappings.entries())
    };
  }
}

// Global registry instance
export const protocolRegistry = new ProtocolRegistry();