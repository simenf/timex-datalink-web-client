/**
 * Protocol Factory
 * 
 * Factory class for creating protocol instances and components.
 * Provides a unified interface for protocol instantiation and management.
 */

import { protocolRegistry } from './protocol-registry.js';

export class ProtocolFactory {
  /**
   * Create a protocol instance by version
   * @param {number} version - Protocol version
   * @param {Object} options - Protocol options
   * @returns {Object} Protocol instance with components
   */
  static createProtocol(version, options = {}) {
    const ProtocolClass = protocolRegistry.getProtocol(version);
    if (!ProtocolClass) {
      throw new Error(`Protocol version ${version} is not registered`);
    }

    return this.createProtocolFromClass(ProtocolClass, options);
  }

  /**
   * Create a protocol instance from class
   * @param {class} ProtocolClass - Protocol class
   * @param {Object} options - Protocol options
   * @returns {Object} Protocol instance with components
   */
  static createProtocolFromClass(ProtocolClass, options = {}) {
    if (!ProtocolClass) {
      throw new Error('Protocol class is required');
    }

    const components = ProtocolClass.getComponents();
    const protocolInstance = {
      info: ProtocolClass.getInfo(),
      components: {},
      createComponent: (componentName, componentOptions = {}) => {
        return this.createComponent(ProtocolClass, componentName, componentOptions);
      },
      getAvailableComponents: () => {
        return Object.keys(components);
      },
      hasComponent: (componentName) => {
        return componentName in components;
      }
    };

    // Pre-instantiate common components if requested
    const {
      preInstantiate = ['Start', 'End', 'Sync'],
      componentOptions = {}
    } = options;

    if (Array.isArray(preInstantiate)) {
      for (const componentName of preInstantiate) {
        if (componentName in components) {
          try {
            protocolInstance.components[componentName] = this.createComponent(
              ProtocolClass, 
              componentName, 
              componentOptions[componentName] || {}
            );
          } catch (error) {
            console.warn(`Failed to pre-instantiate component ${componentName}: ${error.message}`);
          }
        }
      }
    }

    return protocolInstance;
  }

  /**
   * Create a specific protocol component
   * @param {class} ProtocolClass - Protocol class
   * @param {string} componentName - Component name (e.g., 'Start', 'Time', 'Alarm')
   * @param {Object} options - Component options
   * @returns {Object} Component instance
   */
  static createComponent(ProtocolClass, componentName, options = {}) {
    const components = ProtocolClass.getComponents();
    const ComponentClass = components[componentName];

    if (!ComponentClass) {
      throw new Error(`Component '${componentName}' is not available for protocol ${ProtocolClass.NAME}`);
    }

    try {
      return new ComponentClass(options);
    } catch (error) {
      throw new Error(`Failed to create component '${componentName}': ${error.message}`);
    }
  }

  /**
   * Auto-detect and create protocol from device
   * @param {Object} serialAdapter - Serial adapter
   * @param {Object} options - Detection and creation options
   * @returns {Promise<Object>} Protocol instance
   */
  static async autoCreateProtocol(serialAdapter, options = {}) {
    const {
      detectionOptions = {},
      protocolOptions = {}
    } = options;

    const ProtocolClass = await protocolRegistry.autoDetectProtocol(serialAdapter, detectionOptions);
    if (!ProtocolClass) {
      throw new Error('Could not detect compatible protocol for device');
    }

    return this.createProtocolFromClass(ProtocolClass, protocolOptions);
  }

  /**
   * Create protocol from device information
   * @param {Object} deviceInfo - Device information
   * @param {Object} options - Protocol options
   * @returns {Object} Protocol instance
   */
  static createProtocolFromDevice(deviceInfo, options = {}) {
    const ProtocolClass = protocolRegistry.detectProtocol(deviceInfo);
    if (!ProtocolClass) {
      throw new Error(`Could not find compatible protocol for device: ${JSON.stringify(deviceInfo)}`);
    }

    return this.createProtocolFromClass(ProtocolClass, options);
  }

  /**
   * Get available protocols
   * @returns {Array<Object>} Array of protocol information
   */
  static getAvailableProtocols() {
    return protocolRegistry.getAllProtocols().map(ProtocolClass => ProtocolClass.getInfo());
  }

  /**
   * Get protocols for specific device
   * @param {string} deviceModel - Device model name
   * @returns {Array<Object>} Array of compatible protocol information
   */
  static getProtocolsForDevice(deviceModel) {
    return protocolRegistry.getProtocolsForDevice(deviceModel)
      .map(ProtocolClass => ProtocolClass.getInfo());
  }

  /**
   * Validate protocol compatibility
   * @param {number|class} protocol - Protocol version or class
   * @param {Object} deviceInfo - Device information
   * @returns {boolean} True if compatible
   */
  static isCompatible(protocol, deviceInfo) {
    let ProtocolClass;

    if (typeof protocol === 'number') {
      ProtocolClass = protocolRegistry.getProtocol(protocol);
    } else if (typeof protocol === 'function') {
      ProtocolClass = protocol;
    } else {
      return false;
    }

    if (!ProtocolClass) {
      return false;
    }

    return ProtocolClass.isCompatible(deviceInfo);
  }

  /**
   * Create a complete sync workflow for a protocol
   * @param {number|class} protocol - Protocol version or class
   * @param {Object} syncData - Data to sync
   * @param {Object} options - Sync options
   * @returns {Array<Object>} Array of component instances for sync workflow
   */
  static createSyncWorkflow(protocol, syncData = {}, options = {}) {
    let ProtocolClass;

    if (typeof protocol === 'number') {
      ProtocolClass = protocolRegistry.getProtocol(protocol);
    } else if (typeof protocol === 'function') {
      ProtocolClass = protocol;
    } else {
      throw new Error('Protocol must be a version number or class');
    }

    if (!ProtocolClass) {
      throw new Error(`Protocol not found: ${protocol}`);
    }

    const workflow = [];
    const components = ProtocolClass.getComponents();

    // Standard sync workflow: Start -> Data Components -> End
    const workflowOrder = ['Start', 'Sync', 'Time', 'Alarm', 'Eeprom', 'SoundOptions', 'End'];

    for (const componentName of workflowOrder) {
      if (componentName in components && syncData[componentName.toLowerCase()]) {
        try {
          const component = this.createComponent(
            ProtocolClass, 
            componentName, 
            syncData[componentName.toLowerCase()]
          );
          workflow.push({
            name: componentName,
            component: component,
            order: workflowOrder.indexOf(componentName)
          });
        } catch (error) {
          if (options.strict) {
            throw new Error(`Failed to create workflow component ${componentName}: ${error.message}`);
          } else {
            console.warn(`Skipping workflow component ${componentName}: ${error.message}`);
          }
        }
      }
    }

    // Always include Start and End if available
    if ('Start' in components && !workflow.find(w => w.name === 'Start')) {
      workflow.unshift({
        name: 'Start',
        component: this.createComponent(ProtocolClass, 'Start'),
        order: -1
      });
    }

    if ('End' in components && !workflow.find(w => w.name === 'End')) {
      workflow.push({
        name: 'End',
        component: this.createComponent(ProtocolClass, 'End'),
        order: 999
      });
    }

    // Sort by order
    workflow.sort((a, b) => a.order - b.order);

    return workflow.map(w => w.component);
  }

  /**
   * Get factory statistics
   * @returns {Object} Factory statistics
   */
  static getStats() {
    const registryStats = protocolRegistry.getStats();
    
    return {
      ...registryStats,
      factoryVersion: '1.0.0',
      supportedComponents: [
        'Start', 'End', 'Sync', 'Time', 'Alarm', 
        'Eeprom', 'SoundOptions', 'SoundTheme', 'WristApp'
      ]
    };
  }
}