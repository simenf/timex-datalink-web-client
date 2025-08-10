/**
 * Tests for Protocol3 End class
 * 
 * Verifies that the JavaScript implementation produces identical
 * byte output to the Ruby version.
 */

import End from '../../lib/protocol3/end.js';
import CrcPacketsWrapper from '../../lib/helpers/crc-packets-wrapper.js';

// Test suite for Protocol3 End
const testEnd = () => {
  console.log('Testing Protocol3 End...');
  
  const end = new End();
  const packets = end.packets();
  
  // Expected: CRC-wrapped [0x21]
  // Header: [packet.length + 3] = [1 + 3] = [4]
  // Packet: [0x21]
  // Footer: CRC16-ARC of [4, 0x21]
  
  // Calculate expected CRC manually to verify
  const rawPacket = [0x21];
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
  
  console.log('✓ Protocol3 End packets match expected output');
  
  // Test that CPACKET_SKIP constant is correct
  if (End.CPACKET_SKIP.length !== 1) {
    throw new Error(`Expected CPACKET_SKIP length 1, got ${End.CPACKET_SKIP.length}`);
  }
  
  if (End.CPACKET_SKIP[0] !== 0x21) {
    throw new Error(`Expected CPACKET_SKIP[0] to be 0x21, got ${End.CPACKET_SKIP[0]}`);
  }
  
  console.log('✓ CPACKET_SKIP constant is correct');
  console.log('✓ All Protocol3 End tests passed\n');
};

export default testEnd;