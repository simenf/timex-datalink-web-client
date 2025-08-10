/**
 * Tests for Protocol 1 Start packet
 */

import Protocol1Start from '../../lib/protocol1/start.js';

// Test Protocol 1 Start packet generation
function testProtocol1Start() {
  console.log('Testing Protocol 1 Start packet...');
  
  const start = new Protocol1Start();
  const packets = start.packets();
  
  console.log('Start packets:', packets);
  
  // Verify packet structure
  if (packets.length !== 1) {
    throw new Error(`Expected 1 packet, got ${packets.length}`);
  }
  
  const packet = packets[0];
  
  // Verify CRC wrapping (length + data + CRC)
  if (packet.length < 7) { // 1 (length) + 4 (data) + 2 (CRC)
    throw new Error(`Packet too short: ${packet.length}`);
  }
  
  // Verify length byte
  if (packet[0] !== 7) { // 4 (data) + 3 (length + CRC)
    throw new Error(`Expected length 7, got ${packet[0]}`);
  }
  
  // Verify start packet data
  const expectedData = [0x20, 0x00, 0x00, 0x01];
  const actualData = packet.slice(1, 5);
  
  for (let i = 0; i < expectedData.length; i++) {
    if (actualData[i] !== expectedData[i]) {
      throw new Error(`Data mismatch at index ${i}: expected ${expectedData[i]}, got ${actualData[i]}`);
    }
  }
  
  console.log('✓ Protocol 1 Start packet test passed');
}

// Test Protocol 1 Start constants
function testProtocol1StartConstants() {
  console.log('Testing Protocol 1 Start constants...');
  
  const expectedStart = [0x20, 0x00, 0x00, 0x01];
  const actualStart = Protocol1Start.CPACKET_START;
  
  if (JSON.stringify(actualStart) !== JSON.stringify(expectedStart)) {
    throw new Error(`CPACKET_START mismatch: expected ${JSON.stringify(expectedStart)}, got ${JSON.stringify(actualStart)}`);
  }
  
  console.log('✓ Protocol 1 Start constants test passed');
}

// Run tests
try {
  testProtocol1StartConstants();
  testProtocol1Start();
  console.log('All Protocol 1 Start tests passed!');
} catch (error) {
  console.error('Protocol 1 Start test failed:', error.message);
  process.exit(1);
}