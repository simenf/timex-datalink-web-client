/**
 * Tests for Protocol3 Alarm class
 * 
 * Verifies that the JavaScript implementation produces identical
 * byte output to the Ruby version for various alarm configurations.
 */

import Alarm from '../../lib/protocol3/alarm.js';
import CrcPacketsWrapper from '../../lib/helpers/crc-packets-wrapper.js';
import { ValidationError } from '../../lib/helpers/data-validator.js';

// Test suite for Protocol3 Alarm
const testAlarm = () => {
  console.log('Testing Protocol3 Alarm...');
  
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
  
  // Test 1: Basic alarm - 8:30 AM
  const alarm1 = new Alarm({
    number: 1,
    time: new Date(2015, 9, 21, 8, 30, 0), // 8:30 AM
    enabled: true,
    message: "Wake up"
  });
  
  // Expected packet based on Ruby implementation
  // [0x50, number, 0x00, hour, minute, month, day, year_mod_1995, ...message_chars, enabled]
  verifyPacket(
    alarm1.packets(),
    [0x50, 0x01, 0x00, 0x08, 0x1e, 0x0a, 0x15, 0x14, 0x32, 0x0a, 0x12, 0x0e, 0x24, 0x1e, 0x19, 0x01],
    "basic alarm 8:30 AM"
  );
  
  // Test 2: Alarm 2 - 6:45 PM (18:45)
  const alarm2 = new Alarm({
    number: 2,
    time: new Date(2015, 9, 21, 18, 45, 0),
    enabled: false,
    message: "Dinner"
  });
  
  verifyPacket(
    alarm2.packets(),
    [0x50, 0x02, 0x00, 0x12, 0x2d, 0x0a, 0x15, 0x14, 0x0d, 0x12, 0x17, 0x17, 0x0e, 0x1b, 0x24, 0x00],
    "alarm 2 - 6:45 PM disabled"
  );
  
  // Test 3: Alarm with no message
  const alarm3 = new Alarm({
    number: 3,
    time: new Date(2015, 9, 21, 12, 0, 0),
    enabled: true,
    message: ""
  });
  
  verifyPacket(
    alarm3.packets(),
    [0x50, 0x03, 0x00, 0x0c, 0x00, 0x0a, 0x15, 0x14, 0x24, 0x24, 0x24, 0x24, 0x24, 0x24, 0x24, 0x01],
    "alarm with no message"
  );
  
  // Test 4: Alarm with long message (should be truncated)
  const alarm4 = new Alarm({
    number: 4,
    time: new Date(2015, 9, 21, 15, 15, 0),
    enabled: true,
    message: "This is a very long message that should be truncated"
  });
  
  verifyPacket(
    alarm4.packets(),
    [0x50, 0x04, 0x00, 0x0f, 0x0f, 0x0a, 0x15, 0x14, 0x1d, 0x11, 0x12, 0x1c, 0x24, 0x12, 0x1c, 0x01],
    "alarm with long message (truncated)"
  );
  
  // Test 5: Alarm 5 - maximum alarm number
  const alarm5 = new Alarm({
    number: 5,
    time: new Date(2015, 9, 21, 23, 59, 0),
    enabled: true,
    message: "Late"
  });
  
  verifyPacket(
    alarm5.packets(),
    [0x50, 0x05, 0x00, 0x17, 0x3b, 0x0a, 0x15, 0x14, 0x15, 0x0a, 0x1d, 0x0e, 0x24, 0x24, 0x24, 0x01],
    "alarm 5 - maximum number"
  );
  
  // Test validation errors
  console.log('Testing validation errors...');
  
  // Test invalid alarm number (0)
  try {
    const invalidAlarm1 = new Alarm({
      number: 0,
      time: new Date(2015, 9, 21, 8, 30, 0),
      enabled: true,
      message: "Test"
    });
    invalidAlarm1.packets();
    throw new Error('Expected validation error for alarm number 0');
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw new Error(`Expected ValidationError, got ${error.constructor.name}`);
    }
    if (!error.message.includes('Alarm number 0 is invalid')) {
      throw new Error(`Unexpected error message: ${error.message}`);
    }
    console.log('✓ Alarm number 0 validation error correct');
  }
  
  // Test invalid alarm number (6)
  try {
    const invalidAlarm2 = new Alarm({
      number: 6,
      time: new Date(2015, 9, 21, 8, 30, 0),
      enabled: true,
      message: "Test"
    });
    invalidAlarm2.packets();
    throw new Error('Expected validation error for alarm number 6');
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw new Error(`Expected ValidationError, got ${error.constructor.name}`);
    }
    if (!error.message.includes('Alarm number 6 is invalid')) {
      throw new Error(`Unexpected error message: ${error.message}`);
    }
    console.log('✓ Alarm number 6 validation error correct');
  }
  
  // Test constants
  if (Alarm.CPACKET_ALARM[0] !== 0x50) {
    throw new Error(`Expected CPACKET_ALARM 0x50, got ${Alarm.CPACKET_ALARM[0]}`);
  }
  
  if (Alarm.MESSAGE_LENGTH !== 7) {
    throw new Error(`Expected MESSAGE_LENGTH 7, got ${Alarm.MESSAGE_LENGTH}`);
  }
  
  console.log('✓ Constants are correct');
  console.log('✓ All Protocol3 Alarm tests passed\n');
};

export default testAlarm;