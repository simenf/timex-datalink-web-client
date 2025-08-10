# Protocol Expansion Guide

This guide explains how to add new protocol implementations to the Timex Datalink Web Client using the protocol abstraction framework.

## Overview

The protocol abstraction framework provides a standardized way to implement support for different Timex Datalink protocol versions. Each protocol follows the same interface patterns while allowing for protocol-specific features and capabilities.

## Architecture

### Core Components

1. **ProtocolBase** - Abstract base class that all protocols must extend
2. **ProtocolComponentBase** - Base class for protocol components (Start, Time, Alarm, etc.)
3. **ProtocolRegistry** - Central registry for protocol registration and detection
4. **ProtocolFactory** - Factory for creating protocol instances and components
5. **ProtocolManager** - High-level manager for protocol operations

### Protocol Structure

Each protocol implementation consists of:
- A main protocol class extending `ProtocolBase`
- Component classes for different data types (Start, Time, Alarm, etc.)
- Protocol-specific constants and validation rules
- Device compatibility detection logic

## Adding a New Protocol

### Step 1: Create the Protocol Class

Create a new protocol class that extends `ProtocolBase`:

```javascript
import { ProtocolBase } from '../lib/protocol-base.js';

export class ProtocolX extends ProtocolBase {
  static get VERSION() { return X; }
  static get NAME() { return 'Protocol X'; }
  
  static get SUPPORTED_DEVICES() {
    return [
      'Device Model 1',
      'Device Model 2'
    ];
  }
  
  static get CAPABILITIES() {
    return {
      bidirectional: true,
      time: true,
      alarms: true,
      eeprom: true,
      // Add protocol-specific capabilities
    };
  }
  
  static get START_PACKET() {
    return [0x20, 0x00, 0x00, X]; // Replace X with protocol version
  }
  
  static getComponents() {
    return {
      Start: ProtocolXStart,
      Time: ProtocolXTime,
      // Add other components
    };
  }
}
```

### Step 2: Implement Protocol Components

Create component classes for each data type:

```javascript
import { ProtocolComponentBase } from '../lib/protocol-base.js';
import CrcPacketsWrapper from '../helpers/crc-packets-wrapper.js';

class ProtocolXStart extends ProtocolComponentBase {
  static CPACKET_START = [0x20, 0x00, 0x00, X];

  packets() {
    const rawPackets = [ProtocolXStart.CPACKET_START];
    return CrcPacketsWrapper.wrapPackets(rawPackets);
  }
}

class ProtocolXTime extends ProtocolComponentBase {
  constructor(options = {}) {
    super();
    this.zone = options.zone;
    this.time = options.time;
    // Initialize other properties
  }

  packets() {
    // Implement time packet generation
    const packet = [
      0x32, // Time packet header (example)
      this.zone,
      // Add other time data
    ];
    
    return CrcPacketsWrapper.wrapPackets([packet]);
  }

  validate() {
    const errors = [];
    
    if (!this.zone || this.zone < 1 || this.zone > 2) {
      errors.push('Zone must be 1 or 2');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

### Step 3: Add Protocol-Specific Features

Implement protocol-specific capabilities:

```javascript
// Enhanced compatibility detection
static isCompatible(deviceInfo) {
  if (!deviceInfo) return false;

  // Check explicit protocol version
  if (deviceInfo.protocol === X) {
    return true;
  }

  // Check device model
  if (deviceInfo.model && this.SUPPORTED_DEVICES.includes(deviceInfo.model)) {
    return true;
  }

  // Add protocol-specific detection logic
  if (deviceInfo.response && this.matchesProtocolXPattern(deviceInfo.response)) {
    return true;
  }

  return false;
}

// Protocol-specific response pattern matching
static matchesProtocolXPattern(response) {
  // Implement protocol-specific pattern detection
  return response.includes(0xXX); // Replace with actual pattern
}
```

### Step 4: Register the Protocol

Register your protocol with the system:

```javascript
import { protocolRegistry } from '../lib/protocol-registry.js';
import { ProtocolX } from './protocol-x.js';

// Register the protocol
protocolRegistry.register(ProtocolX);
```

### Step 5: Add Tests

Create comprehensive tests for your protocol:

```javascript
import { ProtocolX } from '../lib/protocol-x.js';

function testProtocolX() {
  // Test protocol validation
  const validation = ProtocolX.validate();
  console.assert(validation.isValid, 'Protocol X should be valid');
  
  // Test component creation
  const components = ProtocolX.getComponents();
  console.assert('Start' in components, 'Protocol X should have Start component');
  
  // Test compatibility detection
  const deviceInfo = { model: 'Device Model 1' };
  console.assert(ProtocolX.isCompatible(deviceInfo), 'Should be compatible with Device Model 1');
  
  // Test packet generation
  const startComponent = new components.Start();
  const packets = startComponent.packets();
  console.assert(Array.isArray(packets), 'Should return packet array');
}
```

## Protocol Implementation Checklist

### Required Implementation

- [ ] Protocol class extends `ProtocolBase`
- [ ] All required static properties defined (VERSION, NAME, SUPPORTED_DEVICES, etc.)
- [ ] `getComponents()` method returns component classes
- [ ] Start component implemented
- [ ] End component implemented (if applicable)
- [ ] Protocol validation passes

### Recommended Implementation

- [ ] Enhanced `isCompatible()` method with protocol-specific logic
- [ ] Protocol-specific response pattern matching
- [ ] Comprehensive component validation
- [ ] Error handling for edge cases
- [ ] Documentation for protocol-specific features

### Optional Implementation

- [ ] Bidirectional communication support
- [ ] Protocol-specific sync workflows
- [ ] Advanced device detection
- [ ] Performance optimizations
- [ ] Protocol-specific utilities

## Component Implementation Guidelines

### Start Component

Every protocol should have a Start component:

```javascript
class ProtocolXStart extends ProtocolComponentBase {
  static CPACKET_START = [0x20, 0x00, 0x00, X];

  packets() {
    const rawPackets = [ProtocolXStart.CPACKET_START];
    return CrcPacketsWrapper.wrapPackets(rawPackets);
  }
}
```

### Data Components

Data components should include validation:

```javascript
class ProtocolXComponent extends ProtocolComponentBase {
  constructor(options = {}) {
    super();
    this.setupValidation();
    this.initializeFromOptions(options);
  }

  setupValidation() {
    // Define validation rules
  }

  validate() {
    // Implement validation logic
    return { isValid: true, errors: [] };
  }

  packets() {
    // Validate before generating packets
    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Generate packets
    return CrcPacketsWrapper.wrapPackets([/* packet data */]);
  }
}
```

### End Component

End components terminate the protocol session:

```javascript
class ProtocolXEnd extends ProtocolComponentBase {
  static CPACKET_END = [0x21, 0x00, 0x00, X];

  packets() {
    const rawPackets = [ProtocolXEnd.CPACKET_END];
    return CrcPacketsWrapper.wrapPackets(rawPackets);
  }
}
```

## Protocol-Specific Features

### Bidirectional Communication

For protocols that support reading data from the device:

```javascript
static get CAPABILITIES() {
  return {
    bidirectional: true,
    // other capabilities
  };
}

// Add read-specific components or methods
class ProtocolXReader extends ProtocolComponentBase {
  async readData(serialAdapter, timeout = 5000) {
    // Implement data reading logic
  }
}
```

### Custom Data Types

For protocols with unique data types:

```javascript
class ProtocolXCustomData extends ProtocolComponentBase {
  constructor(customOptions = {}) {
    super();
    this.customField1 = customOptions.customField1;
    this.customField2 = customOptions.customField2;
  }

  packets() {
    // Generate packets for custom data type
    const packet = [
      0xXX, // Custom packet header
      this.customField1,
      this.customField2
    ];
    
    return CrcPacketsWrapper.wrapPackets([packet]);
  }
}
```

## Testing Guidelines

### Unit Tests

Test each component individually:

```javascript
function testProtocolXStart() {
  const start = new ProtocolXStart();
  const packets = start.packets();
  
  // Verify packet structure
  console.assert(Array.isArray(packets), 'Should return array');
  console.assert(packets.length > 0, 'Should have packets');
  
  // Verify packet content
  const firstPacket = packets[0];
  console.assert(firstPacket.includes(0x20), 'Should contain start header');
}
```

### Integration Tests

Test protocol integration with the framework:

```javascript
function testProtocolXIntegration() {
  // Test registration
  protocolRegistry.register(ProtocolX);
  
  // Test detection
  const deviceInfo = { protocol: X };
  const detected = protocolRegistry.detectProtocol(deviceInfo);
  console.assert(detected === ProtocolX, 'Should detect Protocol X');
  
  // Test factory creation
  const instance = ProtocolFactory.createProtocol(X);
  console.assert(instance.info.version === X, 'Should create correct version');
}
```

### Hardware Tests

Test with actual devices when possible:

```javascript
async function testProtocolXHardware(serialAdapter) {
  // Test device communication
  const protocol = ProtocolFactory.createProtocol(X);
  const start = protocol.createComponent('Start');
  
  // Send start packet
  await serialAdapter.write(start.packets());
  
  // Verify response (if bidirectional)
  if (ProtocolX.CAPABILITIES.bidirectional) {
    const response = await serialAdapter.read(1000);
    console.assert(response.length > 0, 'Should receive response');
  }
}
```

## Common Patterns

### Ruby to JavaScript Translation

When porting from Ruby implementation:

1. **Constants**: Convert Ruby constants to JavaScript static properties
2. **Validation**: Replace ActiveModel validations with custom validation logic
3. **Modules**: Convert Ruby modules to JavaScript classes or mixins
4. **Byte Arrays**: Ensure byte values are integers 0-255

### Error Handling

Implement consistent error handling:

```javascript
class ProtocolXComponent extends ProtocolComponentBase {
  packets() {
    try {
      const validation = this.validate();
      if (!validation.isValid) {
        throw new ValidationError(validation.errors.join(', '));
      }
      
      return this.generatePackets();
    } catch (error) {
      throw new Error(`Protocol X component error: ${error.message}`);
    }
  }
}
```

### Performance Considerations

- Cache packet generation when possible
- Minimize object creation in hot paths
- Use efficient data structures for large datasets
- Consider memory usage for embedded environments

## Debugging and Troubleshooting

### Common Issues

1. **Packet Generation Errors**
   - Verify byte values are 0-255
   - Check packet structure matches protocol specification
   - Ensure CRC wrapping is applied correctly

2. **Validation Failures**
   - Check validation rules match protocol requirements
   - Verify data types and ranges
   - Test edge cases and boundary conditions

3. **Detection Issues**
   - Verify device model names match exactly
   - Check response pattern matching logic
   - Test with actual device responses

### Debug Tools

Enable verbose logging:

```javascript
const protocol = ProtocolFactory.createProtocol(X, {
  verbose: true
});
```

Use protocol manager statistics:

```javascript
const stats = protocolManager.getStats();
console.log('Protocol stats:', stats);
```

Test protocol validation:

```javascript
const validation = ProtocolX.validate();
if (!validation.isValid) {
  console.error('Protocol validation errors:', validation.errors);
}
```

## Examples

### Complete Protocol Implementation

See `lib/protocol3-implementation.js` for a complete example of a fully implemented protocol.

### Template Protocols

See `lib/protocol-templates.js` for template implementations that can be used as starting points.

### Usage Examples

See `examples/protocol-abstraction-example.js` for examples of how to use the protocol framework.

## Contributing

When contributing a new protocol implementation:

1. Follow the implementation checklist
2. Include comprehensive tests
3. Document protocol-specific features
4. Provide usage examples
5. Update this guide if needed

## Future Enhancements

Planned improvements to the protocol framework:

- Automatic protocol detection from device responses
- Protocol capability negotiation
- Dynamic component loading
- Protocol versioning and migration support
- Enhanced debugging and monitoring tools