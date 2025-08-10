/**
 * Tests for Protocol3 EEPROM Anniversary class
 * 
 * Verifies that the JavaScript implementation produces identical
 * byte output to the Ruby version for various anniversary configurations.
 */

import Anniversary from '../../../lib/protocol3/eeprom/anniversary.js';
import CrcPacketsWrapper from '../../../lib/helpers/crc-packets-wrapper.js';
import { ValidationError } from '../../../lib/helpers/data-validator.js';

// Test suite for Protocol3 EEPROM Anniversary
const testAnniversary = () => {
  console.log('Testing Protocol3 EEPROM Anniversary...');
  
  // Helper function to verify packet structure
  const verifyPacket = (actualPackets, expectedRawPacket, testName) => {
    console.log(`Testing ${testName}...`);
    
    if (actualPackets.length !== 1) {
      throw new Error(`Expected 1 packet, got ${actualPackets.length}`);
    }
    
    const expectedWrapped = CrcPacketsWrapper.wrapPackets([expectedRawPacket]);
    const expectedPacket = expectedWrapped[0];
    const actualPacket = actualPackets[0];
    
    console.log(`Expected raw: [${expectedRawPacket.join(', ')}]`);
    console.log(`Expected wrapped: [${expectedPacket.join(', ')}]`);
    console.log(`Actual: [${actualPacket.join(', ')}]`);
    
    if (actualPacket.length !== expectedPacket.length) {
      throw new Error(`Expected packet length ${expectedPacket.length}, got ${actualPacket.length}`);
    }
    
    for (let i = 0; i < expectedPacket.length; i++) {
      if (actualPacket[i] !== expectedPacket[i]) {
        throw new Error(`Byte mismatch at index ${i}: expected ${expectedPacket[i]}, got ${actualPacket[i]}`);
      }
    }
    
    console.log(`✓ ${testName} passed`);
  };
  
  // Test 1: Basic anniversary
  const anniversary1 = new Anniversary({
    month: 6,
    day: 15,
    message: "Wedding"
  });
  
  // Expected packet format:
  // [0x91, month, day, ...message_chars_with_terminator]
  verifyPacket(
    anniversary1.packets(),
    [0x91, 0x06, 0x0f, 0x32, 0x0e, 0x0d, 0x0d, 0x12, 0x17, 0x10, 0x00],
    "basic anniversary"
  );
  
  // Test 2: Anniversary with longer message
  const anniversary2 = new Anniversary({
    month: 12,
    day: 25,
    message: "Christmas Day"
  });
  
  verifyPacket(
    anniversary2.packets(),
    [0x91, 0x0c, 0x19, 0x0c, 0x11, 0x1b, 0x12, 0x1c, 0x1d, 0x16, 0x0a, 0x1c, 0x24, 0x0d, 0x0a, 0x22, 0x00],
    "anniversary with longer message"
  );
  
  // Test 3: Anniversary with empty message
  const anniversary3 = new Anniversary({
    month: 1,
    day: 1,
    message: ""
  });
  
  verifyPacket(
    anniversary3.packets(),
    [0x91, 0x01, 0x01, 0x00],
    "anniversary with empty message"
  );
  
  // Test 4: Birthday anniversary
  const anniversary4 = new Anniversary({
    month: 3,
    day: 14,
    message: "Pi Day"
  });
  
  verifyPacket(
    anniversary4.packets(),
    [0x91, 0x03, 0x0e, 0x19, 0x12, 0x24, 0x0d, 0x0a, 0x22, 0x00],
    "Pi Day anniversary"
  );
  
  // Test 5: Valentine's Day
  const anniversary5 = new Anniversary({
    month: 2,
    day: 14,
    message: "Valentine's Day"
  });
  
  verifyPacket(
    anniversary5.packets(),
    [0x91, 0x02, 0x0e, 0x1f, 0x0a, 0x15, 0x0e, 0x17, 0x1d, 0x12, 0x17, 0x0e, 0x27, 0x1c, 0x24, 0x0d, 0x0a, 0x22, 0x00],
    "Valentine's Day anniversary"
  );
  
  // Test 6: New Year's Eve
  const anniversary6 = new Anniversary({
    month: 12,
    day: 31,
    message: "New Year"
  });
  
  verifyPacket(
    anniversary6.packets(),
    [0x91, 0x0c, 0x1f, 0x17, 0x0e, 0x32, 0x24, 0x22, 0x0e, 0x0a, 0x1b, 0x00],
    "New Year's Eve anniversary"
  );
  
  // Test 7: Anniversary with special characters
  const anniversary7 = new Anniversary({
    month: 7,
    day: 4,
    message: "July 4th!"
  });
  
  verifyPacket(
    anniversary7.packets(),
    [0x91, 0x07, 0x04, 0x13, 0x1e, 0x15, 0x22, 0x24, 0x04, 0x1d, 0x11, 0x21, 0x00],
    "anniversary with special characters"
  );
  
  // Test validation errors
  console.log('Testing validation errors...');
  
  // Test invalid month (0)
  try {
    const invalidAnniversary1 = new Anniversary({
      month: 0,
      day: 15,
      message: "Test"
    });
    invalidAnniversary1.packets();
    throw new Error('Expected validation error for month 0');
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw new Error(`Expected ValidationError, got ${error.constructor.name}`);
    }
    if (!error.message.includes('Month 0 is invalid')) {
      throw new Error(`Unexpected error message: ${error.message}`);
    }
    console.log('✓ Month 0 validation error correct');
  }
  
  // Test invalid month (13)
  try {
    const invalidAnniversary2 = new Anniversary({
      month: 13,
      day: 15,
      message: "Test"
    });
    invalidAnniversary2.packets();
    throw new Error('Expected validation error for month 13');
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw new Error(`Expected ValidationError, got ${error.constructor.name}`);
    }
    if (!error.message.includes('Month 13 is invalid')) {
      throw new Error(`Unexpected error message: ${error.message}`);
    }
    console.log('✓ Month 13 validation error correct');
  }
  
  // Test invalid day (0)
  try {
    const invalidAnniversary3 = new Anniversary({
      month: 6,
      day: 0,
      message: "Test"
    });
    invalidAnniversary3.packets();
    throw new Error('Expected validation error for day 0');
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw new Error(`Expected ValidationError, got ${error.constructor.name}`);
    }
    if (!error.message.includes('Day 0 is invalid')) {
      throw new Error(`Unexpected error message: ${error.message}`);
    }
    console.log('✓ Day 0 validation error correct');
  }
  
  // Test invalid day (32)
  try {
    const invalidAnniversary4 = new Anniversary({
      month: 6,
      day: 32,
      message: "Test"
    });
    invalidAnniversary4.packets();
    throw new Error('Expected validation error for day 32');
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw new Error(`Expected ValidationError, got ${error.constructor.name}`);
    }
    if (!error.message.includes('Day 32 is invalid')) {
      throw new Error(`Unexpected error message: ${error.message}`);
    }
    console.log('✓ Day 32 validation error correct');
  }
  
  // Test constants
  if (Anniversary.CPACKET_ANNIVERSARY[0] !== 0x91) {
    throw new Error(`Expected CPACKET_ANNIVERSARY 0x91, got ${Anniversary.CPACKET_ANNIVERSARY[0]}`);
  }
  
  if (Anniversary.MESSAGE_LENGTH !== 31) {
    throw new Error(`Expected MESSAGE_LENGTH 31, got ${Anniversary.MESSAGE_LENGTH}`);
  }
  
  console.log('✓ Constants are correct');
  console.log('✓ All Protocol3 EEPROM Anniversary tests passed\n');
};

export default testAnniversary;