# Protocol Quick Reference

Quick reference for working with the Timex Datalink protocol abstraction framework.

## Protocol Status

| Protocol | Status | Devices | Capabilities |
|----------|--------|---------|--------------|
| Protocol 1 | Template | Datalink 50, 70 | Time, Alarms, EEPROM |
| Protocol 3 | **Complete** | Datalink 150, 150s | Time, Alarms, EEPROM, Sound, Bidirectional |
| Protocol 4 | Template | Internet Messenger | Time, Alarms, EEPROM, Sound, WristApps |
| Protocol 6 | Template | Beepwear Pro | Time, Alarms, EEPROM, Pager, Night Mode |
| Protocol 7 | Template | DSI e-BRAIN | Calendar, Activities, Games, Speech |
| Protocol 9 | Template | Ironman Triathlon | Time, Alarms, Timer, Chrono |

## Quick Start

### Basic Usage

```javascript
import { TimexDatalinkClient } from './lib/timex-datalink-client.js';
import { protocolManager } from './lib/protocol-manager.js';

// Create client
const client = new TimexDatalinkClient({ verbose: true });

// Auto-detect protocol
const protocol = await client.detectProtocol({ model: 'Timex Datalink 150' });

// Or set manually
client.setProtocol(3, { model: 'Timex Datalink 150' });

// Sync data
await client.syncWithProtocol({
  time: {
    zone: 1,
    is24h: false,
    dateFormat: "%_m-%d-%y",
    time: new Date()
  }
});
```

### Protocol Factory

```javascript
import { ProtocolFactory } from './lib/protocol-factory.js';

// Create protocol instance
const protocol = ProtocolFactory.createProtocol(3);

// Create specific component
const timeComponent = protocol.createComponent('Time', {
  zone: 1,
  time: new Date()
});

// Create sync workflow
const workflow = ProtocolFactory.createSyncWorkflow(3, {
  time: { zone: 1, time: new Date() },
  alarms: [{ number: 1, time: new Date(), enabled: true }]
});
```

## Protocol Implementation Template

```javascript
import { ProtocolBase, ProtocolComponentBase } from './lib/protocol-base.js';
import CrcPacketsWrapper from './helpers/crc-packets-wrapper.js';

// Start Component
class ProtocolXStart extends ProtocolComponentBase {
  static CPACKET_START = [0x20, 0x00, 0x00, X];
  
  packets() {
    return CrcPacketsWrapper.wrapPackets([ProtocolXStart.CPACKET_START]);
  }
}

// Main Protocol Class
export class ProtocolX extends ProtocolBase {
  static get VERSION() { return X; }
  static get NAME() { return 'Protocol X'; }
  static get SUPPORTED_DEVICES() { return ['Device Name']; }
  static get CAPABILITIES() {
    return {
      bidirectional: false,
      time: true,
      alarms: true,
      eeprom: true
    };
  }
  static get START_PACKET() { return [0x20, 0x00, 0x00, X]; }
  
  static getComponents() {
    return { Start: ProtocolXStart };
  }
}
```

## Component Types

### Required Components
- **Start** - Initialize protocol session
- **End** - Terminate protocol session (if applicable)

### Common Components
- **Sync** - Synchronization sequences
- **Time** - Time and date setting
- **Alarm** - Alarm configuration
- **Eeprom** - EEPROM data (appointments, phone numbers, etc.)

### Protocol-Specific Components
- **SoundOptions** - Audio settings (Protocol 3, 4, 9)
- **SoundTheme** - Audio themes (Protocol 3, 4)
- **WristApp** - Wrist applications (Protocol 3, 4)
- **PagerOptions** - Pager settings (Protocol 6)
- **Calendar** - Calendar events (Protocol 7)
- **Timer** - Timer functions (Protocol 9)

## Packet Structure

### Standard Packet Format
```
[Length] [Data...] [CRC16-Low] [CRC16-High]
```

### Common Packet Headers
- `0x20` - Start packet
- `0x21` - End packet
- `0x32` - Time packet
- `0x50` - Alarm packet
- `0x78` - Sync packet
- `0x90` - EEPROM packet

## Validation Patterns

```javascript
validate() {
  const errors = [];
  
  if (!this.requiredField) {
    errors.push('Required field is missing');
  }
  
  if (this.numericField < 1 || this.numericField > 10) {
    errors.push('Numeric field must be 1-10');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## Device Detection

```javascript
static isCompatible(deviceInfo) {
  // Explicit protocol match
  if (deviceInfo.protocol === this.VERSION) return true;
  
  // Device model match
  if (deviceInfo.model && this.SUPPORTED_DEVICES.includes(deviceInfo.model)) {
    return true;
  }
  
  // Response pattern match
  if (deviceInfo.response && this.matchesPattern(deviceInfo.response)) {
    return true;
  }
  
  return false;
}
```

## Testing Checklist

- [ ] Protocol validation passes
- [ ] All components generate valid packets
- [ ] Device compatibility detection works
- [ ] Integration with protocol factory works
- [ ] Sync workflow creation works
- [ ] Error handling is comprehensive

## Common Constants

### Date Formats (Protocol 3)
```javascript
static DATE_FORMAT_MAP = {
  "%_m-%d-%y": 0,  // MM-DD-YY
  "%_d-%m-%y": 1,  // DD-MM-YY
  "%y-%m-%d": 2,   // YY-MM-DD
  "%_m.%d.%y": 4,  // MM.DD.YY
  "%_d.%m.%y": 5,  // DD.MM.YY
  "%y.%m.%d": 6    // YY.MM.DD
};
```

### Character Encoding
```javascript
static CHARS = "0123456789abcdefghijklmnopqrstuvwxyz !\"#$%&'()*+,-./:\\;=@?_|<>[]";
```

## Debugging Commands

```javascript
// Get protocol info
const info = protocol.info;
console.log('Protocol:', info.name, 'v' + info.version);

// Get available components
const components = protocol.getAvailableComponents();
console.log('Components:', components);

// Validate protocol setup
const validation = protocolManager.validateSetup();
console.log('Setup valid:', validation.isValid);

// Get registry stats
const stats = protocolManager.getStats();
console.log('Registered protocols:', stats.protocolCount);

// Test component packets
const component = protocol.createComponent('Start');
const packets = component.packets();
console.log('Packets:', packets.map(p => p.map(b => '0x' + b.toString(16)).join(' ')));
```

## Error Messages

### Common Errors
- `Protocol version X is not registered` - Protocol not added to registry
- `Component 'Y' is not available` - Component not implemented for protocol
- `Validation failed: ...` - Data validation errors
- `No protocol detected` - Auto-detection failed
- `Serial adapter is not connected` - Device connection issue

### Solutions
1. Check protocol registration: `protocolRegistry.getProtocol(X)`
2. Verify component availability: `protocol.getAvailableComponents()`
3. Check validation rules and input data
4. Try manual protocol selection
5. Verify device connection and permissions

## Performance Tips

- Cache protocol instances when possible
- Use batch operations for multiple components
- Enable verbose logging only during development
- Validate data before packet generation
- Use appropriate timeout values for device communication

## File Structure

```
lib/
├── protocol-base.js           # Base classes
├── protocol-registry.js       # Protocol registration
├── protocol-factory.js        # Protocol creation
├── protocol-manager.js        # High-level management
├── protocol3-implementation.js # Complete Protocol 3
├── protocol-templates.js      # Template implementations
└── timex-datalink-client.js   # Main client (updated)

docs/
├── protocol-expansion-guide.md # Detailed implementation guide
└── protocol-quick-reference.md # This file

examples/
└── protocol-abstraction-example.js # Usage examples

tests/
└── protocol-abstraction.test.js # Framework tests
```