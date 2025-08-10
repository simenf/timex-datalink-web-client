/**
 * Integration tests for Protocol 1 complete implementation
 */

import Protocol1 from '../../lib/protocol1.js';
import Protocol1Implementation from '../../lib/protocol1-implementation.js';

// Test Protocol 1 class registration
function testProtocol1Registration() {
  console.log('Testing Protocol 1 class registration...');
  
  // Test static properties
  if (Protocol1.VERSION !== 1) {
    throw new Error(`Expected version 1, got ${Protocol1.VERSION}`);
  }
  
  if (Protocol1.NAME !== 'Protocol 1') {
    throw new Error(`Expected name 'Protocol 1', got '${Protocol1.NAME}'`);
  }
  
  // Test supported devices
  const expectedDevices = [
    'Timex Datalink 50',
    'Timex Datalink 70',
    'Timex Datalink Classic',
    'Protocol 1 Compatible'
  ];
  
  const actualDevices = Protocol1.SUPPORTED_DEVICES;
  if (JSON.stringify(actualDevices) !== JSON.stringify(expectedDevices)) {
    throw new Error(`Device list mismatch: expected ${JSON.stringify(expectedDevices)}, got ${JSON.stringify(actualDevices)}`);
  }
  
  // Test capabilities
  const capabilities = Protocol1.CAPABILITIES;
  if (!capabilities.time || !capabilities.alarms || !capabilities.eeprom) {
    throw new Error('Missing expected capabilities');
  }
  
  if (capabilities.soundOptions || capabilities.wristApps) {
    throw new Error('Protocol 1 should not have sound options or wrist apps');
  }
  
  console.log('✓ Protocol 1 registration test passed');
}

// Test Protocol 1 components
function testProtocol1Components() {
  console.log('Testing Protocol 1 components...');
  
  const components = Protocol1.getComponents();
  
  const expectedComponents = [
    'Start', 'End', 'Sync', 'Time', 'TimeName', 'Alarm', 
    'Eeprom', 'Anniversary', 'Appointment', 'List', 'PhoneNumber'
  ];
  
  for (const componentName of expectedComponents) {
    if (!components[componentName]) {
      throw new Error(`Missing component: ${componentName}`);
    }
    
    // Test that component can be instantiated
    try {
      if (componentName === 'Start' || componentName === 'End') {
        new components[componentName]();
      } else if (componentName === 'Sync') {
        new components[componentName]({ length: 100 });
      } else if (componentName === 'Time') {
        new components[componentName]({ zone: 1, is24h: true, time: new Date() });
      } else if (componentName === 'TimeName') {
        new components[componentName]({ zone: 1, name: 'EST' });
      } else if (componentName === 'Alarm') {
        new components[componentName]({ 
          number: 1, 
          audible: true, 
          time: new Date(), 
          message: 'Test' 
        });
      } else if (componentName === 'Eeprom') {
        new components[componentName]();
      } else if (componentName === 'Anniversary') {
        new components[componentName]({ time: new Date(), anniversary: 'Test' });
      } else if (componentName === 'Appointment') {
        new components[componentName]({ time: new Date(), message: 'Test' });
      } else if (componentName === 'List') {
        new components[componentName]({ listEntry: 'Test', priority: 1 });
      } else if (componentName === 'PhoneNumber') {
        new components[componentName]({ name: 'Test', number: '555-1234' });
      }
    } catch (error) {
      throw new Error(`Failed to instantiate ${componentName}: ${error.message}`);
    }
  }
  
  console.log('✓ Protocol 1 components test passed');
}

// Test Protocol 1 sync sequence creation
function testProtocol1SyncSequence() {
  console.log('Testing Protocol 1 sync sequence creation...');
  
  const testTime = new Date(2024, 0, 1, 12, 30, 45);
  
  // Create a basic sync sequence
  const sequence = Protocol1.createSyncSequence({
    time: testTime,
    zone: 1,
    is24h: true,
    zoneName: 'EST'
  });
  
  // Should have Start, Sync, Time, TimeName, End
  if (sequence.length !== 5) {
    throw new Error(`Expected 5 components in basic sequence, got ${sequence.length}`);
  }
  
  // Test with alarms and EEPROM data
  const components = Protocol1.getComponents();
  const alarm = new components.Alarm({
    number: 1,
    audible: true,
    time: new Date(2024, 0, 1, 7, 0, 0),
    message: 'Wake up!'
  });
  
  const appointment = new components.Appointment({
    time: new Date(2024, 0, 1, 14, 30, 0),
    message: 'Meeting'
  });
  
  const fullSequence = Protocol1.createSyncSequence({
    time: testTime,
    zone: 1,
    is24h: true,
    alarms: [alarm],
    appointments: [appointment]
  });
  
  // Should have Start, Sync, Time, Alarm, Eeprom, End
  if (fullSequence.length !== 6) {
    throw new Error(`Expected 6 components in full sequence, got ${fullSequence.length}`);
  }
  
  // Test that all components can generate packets
  for (const component of fullSequence) {
    const packets = component.packets();
    if (!Array.isArray(packets) || packets.length === 0) {
      throw new Error(`Component ${component.constructor.name} failed to generate packets`);
    }
  }
  
  console.log('✓ Protocol 1 sync sequence test passed');
}

// Test Protocol 1 validation
function testProtocol1Validation() {
  console.log('Testing Protocol 1 validation...');
  
  const validation = Protocol1.validate();
  if (!validation.isValid) {
    throw new Error(`Protocol 1 validation failed: ${validation.errors.join(', ')}`);
  }
  
  console.log('✓ Protocol 1 validation test passed');
}

// Test Protocol 1 compatibility detection
function testProtocol1Compatibility() {
  console.log('Testing Protocol 1 compatibility detection...');
  
  // Test explicit protocol version
  if (!Protocol1.isCompatible({ protocol: 1 })) {
    throw new Error('Should be compatible with protocol: 1');
  }
  
  // Test device model compatibility
  if (!Protocol1.isCompatible({ model: 'Timex Datalink 50' })) {
    throw new Error('Should be compatible with Timex Datalink 50');
  }
  
  if (!Protocol1.isCompatible({ model: 'Timex Datalink 70' })) {
    throw new Error('Should be compatible with Timex Datalink 70');
  }
  
  // Test incompatible cases
  if (Protocol1.isCompatible({ protocol: 3 })) {
    throw new Error('Should not be compatible with protocol: 3');
  }
  
  if (Protocol1.isCompatible({ model: 'Timex Datalink 150' })) {
    throw new Error('Should not be compatible with Timex Datalink 150');
  }
  
  console.log('✓ Protocol 1 compatibility test passed');
}

// Test Protocol 1 implementation class
function testProtocol1ImplementationClass() {
  console.log('Testing Protocol 1 implementation class...');
  
  const impl = new Protocol1Implementation();
  
  if (impl.protocolNumber !== 1) {
    throw new Error(`Expected protocol number 1, got ${impl.protocolNumber}`);
  }
  
  if (impl.name !== 'Protocol 1') {
    throw new Error(`Expected name 'Protocol 1', got '${impl.name}'`);
  }
  
  // Test component creation methods
  const start = impl.createStart();
  const packets = start.packets();
  if (!Array.isArray(packets) || packets.length === 0) {
    throw new Error('Failed to create start component');
  }
  
  // Test feature support
  const features = impl.getSupportedFeatures();
  if (!features.time || !features.alarms || !features.appointments) {
    throw new Error('Missing expected features');
  }
  
  if (features.soundOptions || features.wristApp) {
    throw new Error('Should not support sound options or wrist apps');
  }
  
  console.log('✓ Protocol 1 implementation class test passed');
}

// Run all tests
try {
  testProtocol1Registration();
  testProtocol1Components();
  testProtocol1SyncSequence();
  testProtocol1Validation();
  testProtocol1Compatibility();
  testProtocol1ImplementationClass();
  console.log('All Protocol 1 integration tests passed!');
} catch (error) {
  console.error('Protocol 1 integration test failed:', error.message);
  process.exit(1);
}