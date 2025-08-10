/**
 * Tests for Protocol3 Start class
 * 
 * Verifies that the JavaScript implementation produces identical
 * byte output to the Ruby version.
 */

import Start from '../../lib/protocol3/start.js';
import CrcPacketsWrapper from '../../lib/helpers/crc-packets-wrapper.js';

// Test suite for Protocol3 Start
const testStart = () => {
  console.log('Testing Protocol3 Start...');
  
  const start = new Start();
  const packets = start.packets();
  
  // Expected: CRC-wrapped [0x20, 0x00, 0x00, 0x03]
  // Header: [packet.length + 3] = [4 + 3] = [7]
  // Packet: [0x20, 0x00, 0x00, 0x03]
  // Footer: CRC16-ARC of [7, 0x20, 0x00, 0x00, 0x03]
  
  // Calculate expected CRC manually to verify
  const rawPacket = [0x20, 0x00, 0x00, 0x03];
  const expectedHeader = CrcPacketsWrapper.crcHeader(rawPacket);
  const expectedFooter = CrcPacketsWrapper.crcFooter(rawPacket);
  const expectedPacket = [...expectedHeader, ...rawPacket, ...expectedFooter];
  
  console.log('Raw packet:', rawPacket);
  console.log('Expected header:', expectedHeader);
  console.log('Expected footer:', expectedFooter);
  console.log('Expected full packet:', expectedPacket);
  console.log('Actual packets:', packets);
  
  // Verify we get exactly one packet
  if (packets.length !== 1) {
    throw new Error(`Expected 1 packet, got ${packets.length}`);
  }
  
  const actualPacket = packets[0];
  
  // Verify packet structure
  if (actualPacket.length !== expectedPacket.length) {
    throw new Error(`Expected packet length ${expectedPacket.length}, got ${actualPacket.length}`);
  }
  
  // Verify each byte
  for (let i = 0; i < expectedPacket.length; i++) {
    if (actualPacket[i] !== expectedPacket[i]) {
      throw new Error(`Byte mismatch at index ${i}: expected ${expectedPacket[i]}, got ${actualPacket[i]}`);
    }
  }
  
  console.log('✓ Protocol3 Start packets match expected output');
  
  // Test that CPACKET_START constant is correct
  if (Start.CPACKET_START.length !== 4) {
    throw new Error(`Expected CPACKET_START length 4, got ${Start.CPACKET_START.length}`);
  }
  
  const expectedStart = [0x20, 0x00, 0x00, 0x03];
  for (let i = 0; i < expectedStart.length; i++) {
    if (Start.CPACKET_START[i] !== expectedStart[i]) {
      throw new Error(`CPACKET_START mismatch at index ${i}: expected ${expectedStart[i]}, got ${Start.CPACKET_START[i]}`);
    }
  }
  
  console.log('✓ CPACKET_START constant is correct');
  console.log('✓ All Protocol3 Start tests passed\n');
};

export default testStart;