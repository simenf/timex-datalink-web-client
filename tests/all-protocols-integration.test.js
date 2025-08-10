/**
 * Integration test for all protocol implementations
 */

import Protocol1 from '../lib/protocol1.js';
import Protocol4 from '../lib/protocol4.js';
import Protocol6 from '../lib/protocol6.js';
import Protocol7 from '../lib/protocol7.js';
import Protocol9 from '../lib/protocol9.js';

// Test all protocols are properly implemented
function testAllProtocolsImplemented() {
  console.log('Testing all protocols are properly implemented...');
  
  const protocols = [
    { class: Protocol1, version: 1, name: 'Protocol 1' },
    { class: Protocol4, version: 4, name: 'Protocol 4' },
    { class: Protocol6, version: 6, name: 'Protocol 6' },
    { class: Protocol7, version: 7, name: 'Protocol 7' },
    { class: Protocol9, version: 9, name: 'Protocol 9' }
  ];
  
  for (const protocol of protocols) {
    // Test basic properties
    if (protocol.class.VERSION !== protocol.version) {
      throw new Error(`${protocol.name} version mismatch: expected ${protocol.version}, got ${protocol.class.VERSION}`);
    }
    
    if (protocol.class.NAME !== protocol.name) {
      throw new Error(`${protocol.name} name mismatch: expected '${protocol.name}', got '${protocol.class.NAME}'`);
    }
    
    // Test validation
    const validation = protocol.class.validate();
    if (!validation.isValid) {
      throw new Error(`${protocol.name} validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Test components
    const components = protocol.class.getComponents();
    if (!components.Start || !components.End) {
      throw new Error(`${protocol.name} missing Start or End components`);
    }
    
    // Test start/end packet generation
    try {
      const start = new components.Start();
      const startPackets = start.packets();
      if (!Array.isArray(startPackets) || startPackets.length === 0) {
        throw new Error(`${protocol.name} Start component failed to generate packets`);
      }
      
      const end = new components.End();
      const endPackets = end.packets();
      if (!Array.isArray(endPackets) || endPackets.length === 0) {
        throw new Error(`${protocol.name} End component failed to generate packets`);
      }
    } catch (error) {
      throw new Error(`${protocol.name} component instantiation failed: ${error.message}`);
    }
    
    console.log(`✓ ${protocol.name} implementation verified`);
  }
  
  console.log('✓ All protocols implementation test passed');
}

// Test protocol capabilities
function testProtocolCapabilities() {
  console.log('Testing protocol capabilities...');
  
  // Protocol 1 capabilities
  const p1Caps = Protocol1.CAPABILITIES;
  if (!p1Caps.time || !p1Caps.alarms || !p1Caps.eeprom) {
    throw new Error('Protocol 1 missing expected capabilities');
  }
  if (p1Caps.soundOptions || p1Caps.wristApps) {
    throw new Error('Protocol 1 should not have sound options or wrist apps');
  }
  
  // Protocol 4 capabilities
  const p4Caps = Protocol4.CAPABILITIES;
  if (!p4Caps.time || !p4Caps.alarms || !p4Caps.soundOptions || !p4Caps.wristApps) {
    throw new Error('Protocol 4 missing expected capabilities');
  }
  if (!p4Caps.bidirectional) {
    throw new Error('Protocol 4 should support bidirectional communication');
  }
  
  // Protocol 6 capabilities
  const p6Caps = Protocol6.CAPABILITIES;
  if (!p6Caps.time || !p6Caps.alarms || !p6Caps.soundOptions) {
    throw new Error('Protocol 6 missing expected capabilities');
  }
  if (p6Caps.maxAlarms !== 8) {
    throw new Error('Protocol 6 should support 8 alarms');
  }
  
  // Protocol 7 capabilities
  const p7Caps = Protocol7.CAPABILITIES;
  if (!p7Caps.eeprom || !p7Caps.calendar || !p7Caps.games || !p7Caps.speech) {
    throw new Error('Protocol 7 missing expected capabilities');
  }
  if (p7Caps.time || p7Caps.alarms) {
    throw new Error('Protocol 7 should not have time or alarms');
  }
  
  // Protocol 9 capabilities
  const p9Caps = Protocol9.CAPABILITIES;
  if (!p9Caps.time || !p9Caps.alarms || !p9Caps.timer) {
    throw new Error('Protocol 9 missing expected capabilities');
  }
  if (p9Caps.maxAlarms !== 10) {
    throw new Error('Protocol 9 should support 10 alarms');
  }
  
  console.log('✓ Protocol capabilities test passed');
}

// Test protocol compatibility detection
function testProtocolCompatibility() {
  console.log('Testing protocol compatibility detection...');
  
  // Test explicit protocol versions
  if (!Protocol1.isCompatible({ protocol: 1 })) {
    throw new Error('Protocol 1 should be compatible with protocol: 1');
  }
  
  if (!Protocol4.isCompatible({ protocol: 4 })) {
    throw new Error('Protocol 4 should be compatible with protocol: 4');
  }
  
  if (!Protocol6.isCompatible({ protocol: 6 })) {
    throw new Error('Protocol 6 should be compatible with protocol: 6');
  }
  
  if (!Protocol7.isCompatible({ protocol: 7 })) {
    throw new Error('Protocol 7 should be compatible with protocol: 7');
  }
  
  if (!Protocol9.isCompatible({ protocol: 9 })) {
    throw new Error('Protocol 9 should be compatible with protocol: 9');
  }
  
  // Test device model compatibility
  if (!Protocol1.isCompatible({ model: 'Timex Datalink 50' })) {
    throw new Error('Protocol 1 should be compatible with Timex Datalink 50');
  }
  
  if (!Protocol4.isCompatible({ model: 'Timex Datalink USB' })) {
    throw new Error('Protocol 4 should be compatible with Timex Datalink USB');
  }
  
  if (!Protocol6.isCompatible({ model: 'Motorola Beepwear Pro' })) {
    throw new Error('Protocol 6 should be compatible with Motorola Beepwear Pro');
  }
  
  if (!Protocol7.isCompatible({ model: 'DSI e-BRAIN' })) {
    throw new Error('Protocol 7 should be compatible with DSI e-BRAIN');
  }
  
  if (!Protocol9.isCompatible({ model: 'Timex Ironman Triathlon' })) {
    throw new Error('Protocol 9 should be compatible with Timex Ironman Triathlon');
  }
  
  console.log('✓ Protocol compatibility test passed');
}

// Test sync sequence creation
function testSyncSequenceCreation() {
  console.log('Testing sync sequence creation...');
  
  // Test Protocol 1 sync sequence
  const p1Sequence = Protocol1.createSyncSequence({
    time: new Date(),
    zone: 1,
    is24h: true
  });
  
  if (p1Sequence.length < 4) { // At least Start, Sync, Time, End
    throw new Error('Protocol 1 sync sequence too short');
  }
  
  // Test Protocol 4 sync sequence
  const p4Sequence = Protocol4.createSyncSequence({
    time: new Date(),
    zone: 1,
    is24h: true,
    dateFormat: '%_m-%d-%y'
  });
  
  if (p4Sequence.length < 4) { // At least Start, Sync, Time, End
    throw new Error('Protocol 4 sync sequence too short');
  }
  
  // Test Protocol 6 sync sequence
  const p6Sequence = Protocol6.createSyncSequence({
    time: new Date(),
    zone: 1,
    is24h: true
  });
  
  if (p6Sequence.length < 4) { // At least Start, Sync, Time, End
    throw new Error('Protocol 6 sync sequence too short');
  }
  
  // Test Protocol 7 sync sequence
  const p7Sequence = Protocol7.createSyncSequence({});
  
  if (p7Sequence.length < 3) { // At least Start, Sync, End
    throw new Error('Protocol 7 sync sequence too short');
  }
  
  // Test Protocol 9 sync sequence
  const p9Sequence = Protocol9.createSyncSequence({
    time: new Date(),
    zone: 1,
    is24h: true
  });
  
  if (p9Sequence.length < 4) { // At least Start, Sync, Time, End
    throw new Error('Protocol 9 sync sequence too short');
  }
  
  console.log('✓ Sync sequence creation test passed');
}

// Run all tests
try {
  testAllProtocolsImplemented();
  testProtocolCapabilities();
  testProtocolCompatibility();
  testSyncSequenceCreation();
  console.log('All protocol integration tests passed!');
  console.log('Successfully ported all protocols from Ruby to JavaScript:');
  console.log('- Protocol 1: Timex Datalink 50, 70');
  console.log('- Protocol 4: Timex Datalink Internet Messenger, USB');
  console.log('- Protocol 6: Motorola Beepwear Pro');
  console.log('- Protocol 7: DSI e-BRAIN');
  console.log('- Protocol 9: Timex Ironman Triathlon');
} catch (error) {
  console.error('Protocol integration test failed:', error.message);
  process.exit(1);
}