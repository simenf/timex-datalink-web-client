/**
 * Tests for Protocol3 Sync class
 * 
 * Verifies that the JavaScript implementation produces identical
 * byte output to the Ruby version for different sync lengths.
 */

import Sync from '../../lib/protocol3/sync.js';

// Test suite for Protocol3 Sync
const testSync = () => {
  console.log('Testing Protocol3 Sync...');
  
  // Test default length (300)
  console.log('Testing default length (300)...');
  const syncDefault = new Sync();
  const packetsDefault = syncDefault.packets();
  
  // Should have exactly one packet
  if (packetsDefault.length !== 1) {
    throw new Error(`Expected 1 packet, got ${packetsDefault.length}`);
  }
  
  const packetDefault = packetsDefault[0];
  const expectedLengthDefault = 1 + 300 + 40; // ping + sync1 + sync2
  
  if (packetDefault.length !== expectedLengthDefault) {
    throw new Error(`Expected packet length ${expectedLengthDefault}, got ${packetDefault.length}`);
  }
  
  // Verify structure: [0x78] + [0x55] * 300 + [0xaa] * 40
  if (packetDefault[0] !== 0x78) {
    throw new Error(`Expected ping byte 0x78, got ${packetDefault[0]}`);
  }
  
  // Check sync1 bytes (positions 1-300)
  for (let i = 1; i <= 300; i++) {
    if (packetDefault[i] !== 0x55) {
      throw new Error(`Expected sync1 byte 0x55 at position ${i}, got ${packetDefault[i]}`);
    }
  }
  
  // Check sync2 bytes (positions 301-340)
  for (let i = 301; i <= 340; i++) {
    if (packetDefault[i] !== 0xaa) {
      throw new Error(`Expected sync2 byte 0xaa at position ${i}, got ${packetDefault[i]}`);
    }
  }
  
  console.log('✓ Default length (300) test passed');
  
  // Test custom length (200)
  console.log('Testing custom length (200)...');
  const sync200 = new Sync({ length: 200 });
  const packets200 = sync200.packets();
  
  if (packets200.length !== 1) {
    throw new Error(`Expected 1 packet, got ${packets200.length}`);
  }
  
  const packet200 = packets200[0];
  const expectedLength200 = 1 + 200 + 40; // ping + sync1 + sync2
  
  if (packet200.length !== expectedLength200) {
    throw new Error(`Expected packet length ${expectedLength200}, got ${packet200.length}`);
  }
  
  // Verify structure: [0x78] + [0x55] * 200 + [0xaa] * 40
  if (packet200[0] !== 0x78) {
    throw new Error(`Expected ping byte 0x78, got ${packet200[0]}`);
  }
  
  // Check sync1 bytes (positions 1-200)
  for (let i = 1; i <= 200; i++) {
    if (packet200[i] !== 0x55) {
      throw new Error(`Expected sync1 byte 0x55 at position ${i}, got ${packet200[i]}`);
    }
  }
  
  // Check sync2 bytes (positions 201-240)
  for (let i = 201; i <= 240; i++) {
    if (packet200[i] !== 0xaa) {
      throw new Error(`Expected sync2 byte 0xaa at position ${i}, got ${packet200[i]}`);
    }
  }
  
  console.log('✓ Custom length (200) test passed');
  
  // Test custom length (350) - matches Ruby test
  console.log('Testing custom length (350)...');
  const sync350 = new Sync({ length: 350 });
  const packets350 = sync350.packets();
  
  if (packets350.length !== 1) {
    throw new Error(`Expected 1 packet, got ${packets350.length}`);
  }
  
  const packet350 = packets350[0];
  const expectedLength350 = 1 + 350 + 40; // ping + sync1 + sync2
  
  if (packet350.length !== expectedLength350) {
    throw new Error(`Expected packet length ${expectedLength350}, got ${packet350.length}`);
  }
  
  // Verify structure: [0x78] + [0x55] * 350 + [0xaa] * 40
  if (packet350[0] !== 0x78) {
    throw new Error(`Expected ping byte 0x78, got ${packet350[0]}`);
  }
  
  // Check sync1 bytes (positions 1-350)
  for (let i = 1; i <= 350; i++) {
    if (packet350[i] !== 0x55) {
      throw new Error(`Expected sync1 byte 0x55 at position ${i}, got ${packet350[i]}`);
    }
  }
  
  // Check sync2 bytes (positions 351-390)
  for (let i = 351; i <= 390; i++) {
    if (packet350[i] !== 0xaa) {
      throw new Error(`Expected sync2 byte 0xaa at position ${i}, got ${packet350[i]}`);
    }
  }
  
  console.log('✓ Custom length (350) test passed');
  
  // Test constants
  if (Sync.PING_BYTE[0] !== 0x78) {
    throw new Error(`Expected PING_BYTE 0x78, got ${Sync.PING_BYTE[0]}`);
  }
  
  if (Sync.SYNC_1_BYTE[0] !== 0x55) {
    throw new Error(`Expected SYNC_1_BYTE 0x55, got ${Sync.SYNC_1_BYTE[0]}`);
  }
  
  if (Sync.SYNC_2_BYTE[0] !== 0xaa) {
    throw new Error(`Expected SYNC_2_BYTE 0xaa, got ${Sync.SYNC_2_BYTE[0]}`);
  }
  
  if (Sync.SYNC_2_LENGTH !== 40) {
    throw new Error(`Expected SYNC_2_LENGTH 40, got ${Sync.SYNC_2_LENGTH}`);
  }
  
  console.log('✓ Constants are correct');
  console.log('✓ All Protocol3 Sync tests passed\n');
};

export default testSync;