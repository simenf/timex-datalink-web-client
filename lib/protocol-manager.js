/**
 * Protocol Manager
 * 
 * High-level manager that coordinates protocol registration, detection,
 * and provides a unified interface for protocol operations.
 */

import { protocolRegistry } from './protocol-registry.js';
import { ProtocolFactory } from './protocol-factory.js';
import { Protocol1 } from './protocol1.js';
import { Protocol3 } from './protocol3-implementation.js';
import { Protocol4 } from './protocol4.js';
import { Protocol6 } from './protocol6.js';
import { Protocol7 } from './protocol7.js';
import { Protocol9 } from './protocol9.js';
import { 
  registerAllTemplates 
} from './protocol-templates.js';

export class ProtocolManager {
  constructor(options = {}) {
    this.options = {
      autoRegisterProtocols: true,
      verbose: false,
      ...options
    };

    this.currentProtocol = null;
    this.deviceInfo = null;

    if (this.options.autoRegisterProtocols) {
      this.registerDefaultProtocols();
    }
  }

  /**
   * Register default protocols
   */
  registerDefaultProtocols() {
    try {
      // Register Protocol 1 (fully implemented)
      protocolRegistry.register(Protocol1);
      
      // Register Protocol 3 (fully implemented)
      protocolRegistry.register(Protocol3);
      
      // Register Protocol 4 (fully implemented)
      protocolRegistry.register(Protocol4);
      
      // Register Protocol 6 (fully implemented)
      protocolRegistry.register(Protocol6);
      
      // Register Protocol 7 (fully implemented)
      protocolRegistry.register(Protocol7);
      
      // Register Protocol 9 (fully implemented)
      protocolRegistry.register(Protocol9);
      
      // Register protocol templates
      registerAllTemplates(protocolRegistry);
      
      if (this.options.verbose) {
        console.log('Default protocols registered successfully');
        console.log('Registry stats:', protocolRegistry.getStats());
      }
    } catch (error) {
      console.error('Failed to register default protocols:', error.message);
    }
  }

  /**
   * Register a custom protocol
   */
  registerProtocol(ProtocolClass) {
    try {
      protocolRegistry.register(ProtocolClass);
      
      if (this.options.verbose) {
        console.log(`Registered custom protocol: ${ProtocolClass.NAME}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to register protocol ${ProtocolClass.NAME}:`, error.message);
      return false;
    }
  }

  /**
   * Detect protocol from device
   */
  async detectProtocol(serialAdapter, deviceInfo = {}) {
    try {
      this.deviceInfo = deviceInfo;

      // Try manual detection first if device info is provided
      if (Object.keys(deviceInfo).length > 0) {
        const detectedProtocol = protocolRegistry.detectProtocol(deviceInfo);
        if (detectedProtocol) {
          this.currentProtocol = detectedProtocol;
          
          if (this.options.verbose) {
            console.log(`Detected protocol from device info: ${detectedProtocol.NAME}`);
          }
          
          return detectedProtocol;
        }
      }

      // Try auto-detection if serial adapter is available
      if (serialAdapter && serialAdapter.isPortConnected()) {
        const autoDetected = await protocolRegistry.autoDetectProtocol(
          serialAdapter, 
          { verbose: this.options.verbose }
        );
        
        if (autoDetected) {
          this.currentProtocol = autoDetected;
          
          if (this.options.verbose) {
            console.log(`Auto-detected protocol: ${autoDetected.NAME}`);
          }
          
          return autoDetected;
        }
      }

      if (this.options.verbose) {
        console.log('Protocol detection failed');
      }
      
      return null;
    } catch (error) {
      console.error('Protocol detection error:', error.message);
      return null;
    }
  }

  /**
   * Create protocol instance
   */
  createProtocol(versionOrClass, options = {}) {
    try {
      if (typeof versionOrClass === 'number') {
        return ProtocolFactory.createProtocol(versionOrClass, options);
      } else if (typeof versionOrClass === 'function') {
        return ProtocolFactory.createProtocolFromClass(versionOrClass, options);
      } else {
        throw new Error('Protocol must be a version number or class');
      }
    } catch (error) {
      console.error('Failed to create protocol:', error.message);
      return null;
    }
  }

  /**
   * Create protocol from current detection
   */
  createCurrentProtocol(options = {}) {
    if (!this.currentProtocol) {
      throw new Error('No protocol detected. Call detectProtocol() first.');
    }

    return this.createProtocol(this.currentProtocol, options);
  }

  /**
   * Get available protocols
   */
  getAvailableProtocols() {
    return ProtocolFactory.getAvailableProtocols();
  }

  /**
   * Get protocols for device
   */
  getProtocolsForDevice(deviceModel) {
    return ProtocolFactory.getProtocolsForDevice(deviceModel);
  }

  /**
   * Check protocol compatibility
   */
  isProtocolCompatible(protocol, deviceInfo) {
    return ProtocolFactory.isCompatible(protocol, deviceInfo);
  }

  /**
   * Create sync workflow
   */
  createSyncWorkflow(protocol, syncData, options = {}) {
    return ProtocolFactory.createSyncWorkflow(protocol, syncData, options);
  }

  /**
   * Get current protocol info
   */
  getCurrentProtocolInfo() {
    if (!this.currentProtocol) {
      return null;
    }

    return {
      ...this.currentProtocol.getInfo(),
      deviceInfo: this.deviceInfo
    };
  }

  /**
   * Reset current protocol
   */
  resetProtocol() {
    this.currentProtocol = null;
    this.deviceInfo = null;
    
    if (this.options.verbose) {
      console.log('Protocol reset');
    }
  }

  /**
   * Get manager statistics
   */
  getStats() {
    const registryStats = protocolRegistry.getStats();
    
    return {
      ...registryStats,
      currentProtocol: this.currentProtocol ? this.currentProtocol.NAME : null,
      deviceInfo: this.deviceInfo,
      managerOptions: this.options
    };
  }

  /**
   * Validate protocol setup
   */
  validateSetup() {
    const errors = [];
    const warnings = [];

    // Check if any protocols are registered
    if (protocolRegistry.getAllProtocols().length === 0) {
      errors.push('No protocols registered');
    }

    // Check if Protocol 3 is available (primary protocol)
    const protocol3 = protocolRegistry.getProtocol(3);
    if (!protocol3) {
      warnings.push('Protocol 3 not registered - primary protocol unavailable');
    }

    // Validate each registered protocol
    for (const ProtocolClass of protocolRegistry.getAllProtocols()) {
      const validation = ProtocolClass.validate();
      if (!validation.isValid) {
        errors.push(`Protocol ${ProtocolClass.NAME} validation failed: ${validation.errors.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get protocol recommendations for device
   */
  getProtocolRecommendations(deviceInfo) {
    const recommendations = [];

    if (!deviceInfo) {
      return recommendations;
    }

    // Get all compatible protocols
    const compatibleProtocols = protocolRegistry.getAllProtocols()
      .filter(ProtocolClass => ProtocolClass.isCompatible(deviceInfo))
      .sort((a, b) => b.VERSION - a.VERSION); // Sort by version descending

    for (const ProtocolClass of compatibleProtocols) {
      const info = ProtocolClass.getInfo();
      const recommendation = {
        ...info,
        confidence: this.calculateConfidence(ProtocolClass, deviceInfo),
        reasons: this.getCompatibilityReasons(ProtocolClass, deviceInfo)
      };

      recommendations.push(recommendation);
    }

    // Sort by confidence
    recommendations.sort((a, b) => b.confidence - a.confidence);

    return recommendations;
  }

  /**
   * Calculate confidence score for protocol compatibility
   * @private
   */
  calculateConfidence(ProtocolClass, deviceInfo) {
    let confidence = 0;

    // Explicit protocol version match
    if (deviceInfo.protocol === ProtocolClass.VERSION) {
      confidence += 50;
    }

    // Device model match
    if (deviceInfo.model && ProtocolClass.SUPPORTED_DEVICES.includes(deviceInfo.model)) {
      confidence += 30;
    }

    // Response pattern match
    if (deviceInfo.response && ProtocolClass.containsStartPacket && 
        ProtocolClass.containsStartPacket(deviceInfo.response)) {
      confidence += 20;
    }

    // Identifier match
    if (deviceInfo.identifier) {
      const identifier = deviceInfo.identifier.toLowerCase();
      const protocolName = ProtocolClass.NAME.toLowerCase();
      if (identifier.includes(protocolName) || identifier.includes(`protocol${ProtocolClass.VERSION}`)) {
        confidence += 15;
      }
    }

    return Math.min(confidence, 100);
  }

  /**
   * Get compatibility reasons
   * @private
   */
  getCompatibilityReasons(ProtocolClass, deviceInfo) {
    const reasons = [];

    if (deviceInfo.protocol === ProtocolClass.VERSION) {
      reasons.push('Explicit protocol version match');
    }

    if (deviceInfo.model && ProtocolClass.SUPPORTED_DEVICES.includes(deviceInfo.model)) {
      reasons.push('Device model is supported');
    }

    if (deviceInfo.response && ProtocolClass.containsStartPacket && 
        ProtocolClass.containsStartPacket(deviceInfo.response)) {
      reasons.push('Device response contains protocol signature');
    }

    if (deviceInfo.identifier) {
      const identifier = deviceInfo.identifier.toLowerCase();
      const protocolName = ProtocolClass.NAME.toLowerCase();
      if (identifier.includes(protocolName) || identifier.includes(`protocol${ProtocolClass.VERSION}`)) {
        reasons.push('Device identifier matches protocol');
      }
    }

    if (reasons.length === 0) {
      reasons.push('General compatibility based on protocol capabilities');
    }

    return reasons;
  }

  /**
   * Export manager configuration
   */
  exportConfig() {
    return {
      options: this.options,
      currentProtocol: this.currentProtocol ? this.currentProtocol.VERSION : null,
      deviceInfo: this.deviceInfo,
      registryState: protocolRegistry.export(),
      stats: this.getStats()
    };
  }

  /**
   * Import manager configuration
   */
  importConfig(config) {
    if (config.options) {
      this.options = { ...this.options, ...config.options };
    }

    if (config.deviceInfo) {
      this.deviceInfo = config.deviceInfo;
    }

    if (config.currentProtocol) {
      this.currentProtocol = protocolRegistry.getProtocol(config.currentProtocol);
    }

    if (this.options.verbose) {
      console.log('Manager configuration imported');
    }
  }
}

// Global protocol manager instance
export const protocolManager = new ProtocolManager();