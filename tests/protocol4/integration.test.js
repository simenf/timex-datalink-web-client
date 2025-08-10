/**
 * Integration tests for Protocol 4 complete implementation
 */

import Protocol4 from '../../lib/protocol4.js';

// Test Protocol 4 class registration
function testProtocol4Registration() {
  console.log('Testing Protocol 4 class registration...');
  
  // Test static properties
  if (Protocol4.VERSION !== 4) {
    throw new Error(`Expected version 4, got ${Protocol4.VERSION}`);
  }
  
  if (Protocol4.NAME !== 'Protocol 4') {
    throw new Error(`Expected name 'Protocol 4', got '${Protocol4.NAME}'`);
  }
  
  // Test supported devices
  const expectedDevices = [
    'Timex Datalink Internet Messenger',
    'Timex Datalink USB',
    'Timex Datalink 150s (USB)',
    'Protocol 4 Compatible'
  ];
  
  const actualDevices = Protocol4.SUPPORTED_DEVICES;
  if (JSON.stringify(actualDevices) !== JSON.stringify(expectedDevices)) {
    throw new Error(`Device list mismatch: expected ${JSON.stringify(expectedDevices)}, got ${JSON.stringify(actualDevices)}`);
  }
  
  // Test capabilities
  const capabilities = Protocol4.CAPABILITIES;
  if (!capabilities.time || !capabilities.alarms || !capabilities.eeprom) {
    throw new Error('Missing expected capabilities');
  }
  
  if (!capabilities.soundOptions || !capabilities.soundTheme || !capabilities.wristApps) {
    throw new Error('Protocol 4 should have sound options, sound theme, and wrist apps');
  }
  
  if (!capabilities.bidirectional) {
    throw new Error('Protocol 4 should support bidirectional communication');
  }
  
  console.log('✓ Protocol 4 registration test passed');
}

// Test Protocol 4 components
function testProtocol4Components() {
  console.log('Testing Protocol 4 components...');
  
  const components = Protocol4.getComponents();
  
  const expectedComponents = [
    'Start', 'End', 'Sync', 'Time', 'Alarm', 'SoundOptions', 'SoundTheme',
    'WristApp', 'Eeprom', 'Anniversary', 'Appointment', 'List', 'PhoneNumber'
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
        new components[componentName]({ 
          zone: 1, 
          is24h: true, 
          dateFormat: '%_m-%d-%y',
          time: new Date() 
        });
      } else if (componentName === 'Alarm') {
        new components[componentName]({ 
          number: 1, 
          audible: true, 
          time: new Date(), 
          message: 'Test' 
        });
      } else if (componentName === 'SoundOptions') {
        new components[componentName]({ hourlyChime: true, buttonBeep: false });
      } else if (componentName === 'SoundTheme') {
        new components[componentName]({ soundThemeData: new Uint8Array([1, 2, 3]) });
      } else if (componentName === 'WristApp') {
        new components[componentName]({ wristAppData: new Uint8Array([1, 2, 3]) });
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
  
  console.log('✓ Protocol 4 components test passed');
}

// Test Protocol 4 time packet with date formats
function testProtocol4TimeFormats() {
  console.log('Testing Protocol 4 time formats...');
  
  const components = Protocol4.getComponents();
  const testTime = new Date(2024, 0, 1, 12, 30, 45);
  
  const dateFormats = Object.keys(Protocol4.getConstants().DATE_FORMAT_MAP);
  
  for (const dateFormat of dateFormats) {
    try {
      const time = new components.Time({
        zone: 1,
        is24h: true,
        dateFormat: dateFormat,
        time: testTime
      });
      
      const packets = time.packets();
      if (!Array.isArray(packets) || packets.length === 0) {
        throw new Error(`Failed to generate packets for date format: ${dateFormat}`);
      }
    } catch (error) {
      throw new Error(`Date format ${dateFormat} failed: ${error.message}`);
    }
  }
  
  console.log('✓ Protocol 4 time formats test passed');
}

// Test Protocol 4 sync sequence creation
function testProtocol4SyncSequence() {
  console.log('Testing Protocol 4 sync sequence creation...');
  
  const testTime = new Date(2024, 0, 1, 12, 30, 45);
  
  // Create a basic sync sequence
  const sequence = Protocol4.createSyncSequence({
    time: testTime,
    zone: 1,
    is24h: true,
    dateFormat: '%_m-%d-%y',
    zoneName: 'EST'
  });
  
  // Should have Start, Sync, Time, End
  if (sequence.length !== 4) {
    throw new Error(`Expected 4 components in basic sequence, got ${sequence.length}`);
  }
  
  // Test with sound options and EEPROM data
  const components = Protocol4.getComponents();
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
  
  const fullSequence = Protocol4.createSyncSequence({
    time: testTime,
    zone: 1,
    is24h: true,
    dateFormat: '%_m-%d-%y',
    alarms: [alarm],
    appointments: [appointment],
    soundOptions: { hourlyChime: true, buttonBeep: false }
  });
  
  // Should have Start, Sync, Time, Alarm, SoundOptions, Eeprom, End
  if (fullSequence.length !== 7) {
    throw new Error(`Expected 7 components in full sequence, got ${fullSequence.length}`);
  }
  
  // Test that all components can generate packets
  for (const component of fullSequence) {
    const packets = component.packets();
    if (!Array.isArray(packets) || packets.length === 0) {
      throw new Error(`Component ${component.constructor.name} failed to generate packets`);
    }
  }
  
  console.log('✓ Protocol 4 sync sequence test passed');
}

// Test Protocol 4 validation
function testProtocol4Validation() {
  console.log('Testing Protocol 4 validation...');
  
  const validation = Protocol4.validate();
  if (!validation.isValid) {
    throw new Error(`Protocol 4 validation failed: ${validation.errors.join(', ')}`);
  }
  
  console.log('✓ Protocol 4 validation test passed');
}

// Test Protocol 4 compatibility detection
function testProtocol4Compatibility() {
  console.log('Testing Protocol 4 compatibility detection...');
  
  // Test explicit protocol version
  if (!Protocol4.isCompatible({ protocol: 4 })) {
    throw new Error('Should be compatible with protocol: 4');
  }
  
  // Test device model compatibility
  if (!Protocol4.isCompatible({ model: 'Timex Datalink Internet Messenger' })) {
    throw new Error('Should be compatible with Timex Datalink Internet Messenger');
  }
  
  if (!Protocol4.isCompatible({ model: 'Timex Datalink USB' })) {
    throw new Error('Should be compatible with Timex Datalink USB');
  }
  
  // Test incompatible cases
  if (Protocol4.isCompatible({ protocol: 1 })) {
    throw new Error('Should not be compatible with protocol: 1');
  }
  
  if (Protocol4.isCompatible({ model: 'Timex Datalink 50' })) {
    throw new Error('Should not be compatible with Timex Datalink 50');
  }
  
  console.log('✓ Protocol 4 compatibility test passed');
}

// Run all tests
try {
  testProtocol4Registration();
  testProtocol4Components();
  testProtocol4TimeFormats();
  testProtocol4SyncSequence();
  testProtocol4Validation();
  testProtocol4Compatibility();
  console.log('All Protocol 4 integration tests passed!');
} catch (error) {
  console.error('Protocol 4 integration test failed:', error.message);
  process.exit(1);
}