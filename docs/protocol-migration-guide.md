# Protocol Migration Guide

Guide for migrating existing code to use the new protocol abstraction framework.

## Overview

The protocol abstraction framework provides a unified interface for working with multiple Timex Datalink protocols. This guide helps you migrate existing Protocol 3 code to the new framework and prepare for multi-protocol support.

## Migration Benefits

- **Multi-protocol support** - Easy addition of new protocols
- **Consistent interface** - Same API across all protocols
- **Auto-detection** - Automatic protocol detection from device info
- **Better organization** - Clear separation of protocol-specific code
- **Enhanced testing** - Standardized testing patterns
- **Future-proof** - Ready for new protocol implementations

## Before Migration

### Old Approach (Protocol 3 Only)

```javascript
// Old way - direct Protocol 3 imports
import Start from './lib/protocol3/start.js';
import Time from './lib/protocol3/time.js';
import Alarm from './lib/protocol3/alarm.js';
import End from './lib/protocol3/end.js';

// Manual component creation
const start = new Start();
const time = new Time({
  zone: 1,
  is24h: false,
  dateFormat: "%_m-%d-%y",
  time: new Date()
});
const end = new End();

// Manual model management
const client = new TimexDatalinkClient({
  models: [start, time, end]
});
```

## After Migration

### New Approach (Multi-protocol)

```javascript
// New way - protocol abstraction
import { TimexDatalinkClient } from './lib/timex-datalink-client.js';

const client = new TimexDatalinkClient({ verbose: true });

// Auto-detect protocol
await client.detectProtocol({ model: 'Timex Datalink 150' });

// Or set manually
client.setProtocol(3);

// Sync with protocol-specific workflow
await client.syncWithProtocol({
  time: {
    zone: 1,
    is24h: false,
    dateFormat: "%_m-%d-%y",
    time: new Date()
  }
});
```

## Step-by-Step Migration

### Step 1: Update Imports

**Before:**
```javascript
import Start from './lib/protocol3/start.js';
import Time from './lib/protocol3/time.js';
import Alarm from './lib/protocol3/alarm.js';
import { TimexDatalinkClient } from './lib/timex-datalink-client.js';
```

**After:**
```javascript
import { TimexDatalinkClient } from './lib/timex-datalink-client.js';
import { ProtocolFactory } from './lib/protocol-factory.js';
import { protocolManager } from './lib/protocol-manager.js';
```

### Step 2: Replace Manual Component Creation

**Before:**
```javascript
const models = [
  new Start(),
  new Time({
    zone: 1,
    is24h: false,
    dateFormat: "%_m-%d-%y",
    time: new Date()
  }),
  new Alarm({
    number: 1,
    time: new Date(),
    enabled: true
  }),
  new End()
];

const client = new TimexDatalinkClient({
  serialDevice: adapter,
  models: models
});
```

**After:**
```javascript
const client = new TimexDatalinkClient({
  serialDevice: adapter
});

// Set protocol
client.setProtocol(3);

// Use protocol-specific sync
await client.syncWithProtocol({
  time: {
    zone: 1,
    is24h: false,
    dateFormat: "%_m-%d-%y",
    time: new Date()
  },
  alarms: [{
    number: 1,
    time: new Date(),
    enabled: true
  }]
});
```

### Step 3: Update Device Detection

**Before:**
```javascript
// Hardcoded Protocol 3 assumption
const client = new TimexDatalinkClient({
  serialDevice: adapter,
  models: protocol3Models
});
```

**After:**
```javascript
const client = new TimexDatalinkClient({
  serialDevice: adapter
});

// Auto-detect protocol
const deviceInfo = {
  model: 'Timex Datalink 150',
  identifier: device.productName
};

const protocol = await client.detectProtocol(deviceInfo);
if (protocol) {
  console.log(`Detected: ${protocol.NAME}`);
} else {
  // Fallback to manual selection
  client.setProtocol(3);
}
```

### Step 4: Update Error Handling

**Before:**
```javascript
try {
  await client.write();
} catch (error) {
  console.error('Write failed:', error);
}
```

**After:**
```javascript
try {
  await client.syncWithProtocol(syncData);
} catch (error) {
  console.error('Sync failed:', error);
  
  // Get protocol recommendations if detection failed
  if (error.message.includes('No protocol')) {
    const recommendations = client.getProtocolRecommendations();
    console.log('Try these protocols:', recommendations);
  }
}
```

## Common Migration Patterns

### Pattern 1: Simple Time Sync

**Before:**
```javascript
const timeModel = new Time({
  zone: 1,
  is24h: false,
  dateFormat: "%_m-%d-%y",
  time: new Date()
});

const client = new TimexDatalinkClient({
  models: [new Start(), timeModel, new End()]
});

await client.write();
```

**After:**
```javascript
const client = new TimexDatalinkClient();
client.setProtocol(3);

await client.syncWithProtocol({
  time: {
    zone: 1,
    is24h: false,
    dateFormat: "%_m-%d-%y",
    time: new Date()
  }
});
```

### Pattern 2: Multiple Alarms

**Before:**
```javascript
const alarms = [
  new Alarm({ number: 1, time: alarm1Time, enabled: true }),
  new Alarm({ number: 2, time: alarm2Time, enabled: false })
];

const client = new TimexDatalinkClient({
  models: [new Start(), ...alarms, new End()]
});
```

**After:**
```javascript
const client = new TimexDatalinkClient();
client.setProtocol(3);

await client.syncWithProtocol({
  alarms: [
    { number: 1, time: alarm1Time, enabled: true },
    { number: 2, time: alarm2Time, enabled: false }
  ]
});
```

### Pattern 3: EEPROM Data

**Before:**
```javascript
const eeprom = new Eeprom({
  appointments: appointmentData,
  phoneNumbers: phoneData
});

const client = new TimexDatalinkClient({
  models: [new Start(), eeprom, new End()]
});
```

**After:**
```javascript
const client = new TimexDatalinkClient();
client.setProtocol(3);

await client.syncWithProtocol({
  eeprom: {
    appointments: appointmentData,
    phoneNumbers: phoneData
  }
});
```

## Advanced Migration

### Custom Component Creation

If you need direct component access:

**Before:**
```javascript
const timeComponent = new Time(timeOptions);
const packets = timeComponent.packets();
```

**After:**
```javascript
const protocol = ProtocolFactory.createProtocol(3);
const timeComponent = protocol.createComponent('Time', timeOptions);
const packets = timeComponent.packets();
```

### Protocol-Specific Features

**Before:**
```javascript
// Hardcoded Protocol 3 features
if (supportsSound) {
  models.push(new SoundOptions(soundConfig));
}
```

**After:**
```javascript
const protocolInfo = client.getProtocolInfo();
if (protocolInfo.capabilities.soundOptions) {
  syncData.soundOptions = soundConfig;
}
```

### Manual Workflow Creation

**Before:**
```javascript
const workflow = [
  new Start(),
  new Sync({ length: 300 }),
  new Time(timeData),
  new End()
];
```

**After:**
```javascript
const workflow = ProtocolFactory.createSyncWorkflow(3, {
  sync: { length: 300 },
  time: timeData
});
```

## Testing Migration

### Update Test Structure

**Before:**
```javascript
import Start from '../lib/protocol3/start.js';

describe('Protocol 3 Start', () => {
  it('should generate correct packets', () => {
    const start = new Start();
    const packets = start.packets();
    expect(packets).toEqual(expectedPackets);
  });
});
```

**After:**
```javascript
import { ProtocolFactory } from '../lib/protocol-factory.js';

describe('Protocol 3 Start', () => {
  it('should generate correct packets', () => {
    const protocol = ProtocolFactory.createProtocol(3);
    const start = protocol.createComponent('Start');
    const packets = start.packets();
    expect(packets).toEqual(expectedPackets);
  });
});
```

### Multi-Protocol Tests

```javascript
describe('Multi-Protocol Support', () => {
  const protocols = [1, 3, 4, 6, 7, 9];
  
  protocols.forEach(version => {
    it(`should support Protocol ${version}`, () => {
      const protocol = ProtocolFactory.createProtocol(version);
      expect(protocol.info.version).toBe(version);
      expect(protocol.hasComponent('Start')).toBe(true);
    });
  });
});
```

## Compatibility Layer

For gradual migration, you can create a compatibility layer:

```javascript
// compatibility.js - temporary migration helper
export function createLegacyModels(syncData) {
  const protocol = ProtocolFactory.createProtocol(3);
  const models = [];
  
  models.push(protocol.createComponent('Start'));
  
  if (syncData.time) {
    models.push(protocol.createComponent('Time', syncData.time));
  }
  
  if (syncData.alarms) {
    syncData.alarms.forEach(alarm => {
      models.push(protocol.createComponent('Alarm', alarm));
    });
  }
  
  models.push(protocol.createComponent('End'));
  
  return models;
}

// Usage during migration
const models = createLegacyModels(syncData);
const client = new TimexDatalinkClient({ models });
await client.write();
```

## Migration Checklist

### Code Changes
- [ ] Update imports to use protocol abstraction
- [ ] Replace manual component creation with protocol factory
- [ ] Add protocol detection or manual selection
- [ ] Update sync calls to use `syncWithProtocol()`
- [ ] Update error handling for protocol-specific errors

### Testing Changes
- [ ] Update test imports
- [ ] Add multi-protocol test coverage
- [ ] Test protocol detection logic
- [ ] Verify backward compatibility

### Documentation Changes
- [ ] Update code examples
- [ ] Document protocol selection strategy
- [ ] Update API documentation
- [ ] Add migration notes to README

## Troubleshooting

### Common Issues

1. **"Protocol version X is not registered"**
   - Ensure protocol is imported and registered
   - Check protocol manager initialization

2. **"Component 'Y' is not available"**
   - Verify component is implemented for the protocol
   - Check component name spelling

3. **"No protocol detected"**
   - Provide more specific device information
   - Use manual protocol selection as fallback

4. **Packet generation differences**
   - Verify component options match old implementation
   - Check for protocol-specific validation changes

### Debug Migration

```javascript
// Compare old vs new packet generation
const oldComponent = new OldTime(options);
const oldPackets = oldComponent.packets();

const protocol = ProtocolFactory.createProtocol(3);
const newComponent = protocol.createComponent('Time', options);
const newPackets = newComponent.packets();

console.log('Old packets:', oldPackets);
console.log('New packets:', newPackets);
console.log('Match:', JSON.stringify(oldPackets) === JSON.stringify(newPackets));
```

## Performance Considerations

The new framework adds minimal overhead:

- Protocol detection: ~1-5ms
- Component creation: ~0.1-1ms per component
- Packet generation: Same as before

For performance-critical applications:
- Cache protocol instances
- Use direct component creation when protocol is known
- Disable verbose logging in production

## Future Considerations

After migration, you'll be ready for:

- **New protocols** - Easy addition of Protocol 1, 4, 6, 7, 9
- **Enhanced features** - Auto-detection, recommendations, validation
- **Better testing** - Standardized test patterns
- **Maintenance** - Cleaner, more organized code structure

The migration investment pays off with improved maintainability and extensibility for future protocol support.