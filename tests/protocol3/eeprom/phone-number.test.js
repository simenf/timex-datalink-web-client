/**
 * Tests for Protocol3 EEPROM PhoneNumber class
 * 
 * Verifies that the JavaScript implementation produces identical
 * byte output to the Ruby version for various phone number configurations.
 */

import PhoneNumber from '../../../lib/protocol3/eeprom/phone-number.js';
import CrcPacketsWrapper from '../../../lib/helpers/crc-packets-wrapper.js';
import { ValidationError } from '../../../lib/helpers/data-validator.js';

// Test suite for Protocol3 EEPROM PhoneNumber
const testPhoneNumber = () => {
  console.log('Testing Protocol3 EEPROM PhoneNumber...');
  
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
  
  // Test 1: Basic phone number
  const phoneNumber1 = new PhoneNumber({
    name: "John",
    number: "555-1234"
  });
  
  // Expected packet format:
  // [0x93, ...name_chars_with_terminator, ...phone_chars]
  verifyPacket(
    phoneNumber1.packets(),
    [0x93, 0x13, 0x18, 0x11, 0x17, 0x00, 0x55, 0x55, 0x55, 0x2d, 0x31, 0x32, 0x33, 0x34],
    "basic phone number"
  );
  
  // Test 2: Phone number with longer name
  const phoneNumber2 = new PhoneNumber({
    name: "Emergency",
    number: "911"
  });
  
  verifyPacket(
    phoneNumber2.packets(),
    [0x93, 0x0e, 0x16, 0x0e, 0x1b, 0x10, 0x0e, 0x17, 0x0c, 0x22, 0x00, 0x39, 0x31, 0x31, 0x00],
    "phone number with longer name"
  );
  
  // Test 3: Phone number with area code
  const phoneNumber3 = new PhoneNumber({
    name: "Mom",
    number: "(555) 123-4567"
  });
  
  verifyPacket(
    phoneNumber3.packets(),
    [0x93, 0x16, 0x18, 0x16, 0x00, 0x28, 0x35, 0x35, 0x35, 0x29, 0x20, 0x31, 0x32, 0x33, 0x2d, 0x34, 0x35, 0x36, 0x37],
    "phone number with area code"
  );
  
  // Test 4: Phone number with extension
  const phoneNumber4 = new PhoneNumber({
    name: "Work",
    number: "555-1234 x123"
  });
  
  verifyPacket(
    phoneNumber4.packets(),
    [0x93, 0x32, 0x18, 0x1b, 0x14, 0x00, 0x35, 0x35, 0x35, 0x2d, 0x31, 0x32, 0x33, 0x34, 0x20, 0x78, 0x31, 0x32, 0x33],
    "phone number with extension"
  );
  
  // Test 5: International phone number
  const phoneNumber5 = new PhoneNumber({
    name: "UK Office",
    number: "+44 20 7946 0958"
  });
  
  verifyPacket(
    phoneNumber5.packets(),
    [0x93, 0x1e, 0x14, 0x24, 0x18, 0x0f, 0x0f, 0x12, 0x0c, 0x0e, 0x00, 0x2b, 0x34, 0x34, 0x20, 0x32, 0x30, 0x20, 0x37, 0x39, 0x34, 0x36, 0x20, 0x30, 0x39, 0x35, 0x38],
    "international phone number"
  );
  
  // Test 6: Phone number with empty name
  const phoneNumber6 = new PhoneNumber({
    name: "",
    number: "555-0000"
  });
  
  verifyPacket(
    phoneNumber6.packets(),
    [0x93, 0x00, 0x35, 0x35, 0x35, 0x2d, 0x30, 0x30, 0x30, 0x30],
    "phone number with empty name"
  );
  
  // Test 7: Phone number with special characters
  const phoneNumber7 = new PhoneNumber({
    name: "Dr. Smith",
    number: "555.123.4567"
  });
  
  verifyPacket(
    phoneNumber7.packets(),
    [0x93, 0x0d, 0x1b, 0x2e, 0x24, 0x1c, 0x16, 0x12, 0x1d, 0x11, 0x00, 0x35, 0x35, 0x35, 0x2e, 0x31, 0x32, 0x33, 0x2e, 0x34, 0x35, 0x36, 0x37],
    "phone number with special characters"
  );
  
  // Test 8: Very long name (should be truncated)
  const phoneNumber8 = new PhoneNumber({
    name: "This is a very long name that should be truncated",
    number: "555-9999"
  });
  
  // Name should be truncated to fit within the available space
  verifyPacket(
    phoneNumber8.packets(),
    [0x93, 0x1d, 0x11, 0x12, 0x1c, 0x24, 0x12, 0x1c, 0x24, 0x0a, 0x24, 0x1f, 0x0e, 0x1b, 0x22, 0x24, 0x15, 0x18, 0x17, 0x10, 0x24, 0x17, 0x0a, 0x16, 0x0e, 0x24, 0x1d, 0x11, 0x0a, 0x1d, 0x00, 0x35, 0x35, 0x35, 0x2d, 0x39, 0x39, 0x39, 0x39],
    "very long name (truncated)"
  );
  
  // Test constants
  if (PhoneNumber.CPACKET_PHONE[0] !== 0x93) {
    throw new Error(`Expected CPACKET_PHONE 0x93, got ${PhoneNumber.CPACKET_PHONE[0]}`);
  }
  
  if (PhoneNumber.NAME_LENGTH !== 31) {
    throw new Error(`Expected NAME_LENGTH 31, got ${PhoneNumber.NAME_LENGTH}`);
  }
  
  if (PhoneNumber.PHONE_LENGTH !== 31) {
    throw new Error(`Expected PHONE_LENGTH 31, got ${PhoneNumber.PHONE_LENGTH}`);
  }
  
  console.log('✓ Constants are correct');
  console.log('✓ All Protocol3 EEPROM PhoneNumber tests passed\n');
};

export default testPhoneNumber;