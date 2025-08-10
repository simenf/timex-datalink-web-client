/**
 * Tests for Protocol3 Time class
 * 
 * Verifies that the JavaScript implementation produces identical
 * byte output to the Ruby version for various time configurations.
 */

import Time from '../../lib/protocol3/time.js';
import CrcPacketsWrapper from '../../lib/helpers/crc-packets-wrapper.js';
import { ValidationError } from '../../lib/helpers/data-validator.js';

// Test suite for Protocol3 Time
const testTime = () => {
  console.log('Testing Protocol3 Time...');
  
  // Helper function to create a test time: 2015-10-21 19:28:32 (Wednesday)
  const createTestTime = () => new Date(2015, 9, 21, 19, 28, 32); // Month is 0-based in JS
  
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
  
  // Test 1: Basic time packet
  // Expected: [0x32, 0x01, 0x20, 0x13, 0x1c, 0x0a, 0x15, 0x0f, 0x19, 0x0d, 0x1d, 0x02, 0x01, 0x00]
  // The Ruby test uses US/Pacific timezone which produces "pdt" for this date
  const time1 = new Time({
    zone: 1,
    is24h: false,
    dateFormat: "%_m-%d-%y",
    time: createTestTime(),
    name: "pdt" // Explicitly set to match Ruby test expectation
  });
  
  verifyPacket(
    time1.packets(),
    [0x32, 0x01, 0x20, 0x13, 0x1c, 0x0a, 0x15, 0x0f, 0x19, 0x0d, 0x1d, 0x02, 0x01, 0x00],
    "basic time packet"
  );
  
  // Test 2: Zone 2
  const time2 = new Time({
    zone: 2,
    is24h: false,
    dateFormat: "%_m-%d-%y",
    time: createTestTime(),
    name: "pdt" // Explicitly set to match Ruby test expectation
  });
  
  verifyPacket(
    time2.packets(),
    [0x32, 0x02, 0x20, 0x13, 0x1c, 0x0a, 0x15, 0x0f, 0x19, 0x0d, 0x1d, 0x02, 0x01, 0x00],
    "zone 2"
  );
  
  // Test 3: 24h format
  const time3 = new Time({
    zone: 1,
    is24h: true,
    dateFormat: "%_m-%d-%y",
    time: createTestTime(),
    name: "pdt" // Explicitly set to match Ruby test expectation
  });
  
  verifyPacket(
    time3.packets(),
    [0x32, 0x01, 0x20, 0x13, 0x1c, 0x0a, 0x15, 0x0f, 0x19, 0x0d, 0x1d, 0x02, 0x02, 0x00],
    "24h format"
  );
  
  // Test 4: Different date formats
  const dateFormatTests = [
    { format: "%_d-%m-%y", expected: 0x01, name: "day-month-year" },
    { format: "%y-%m-%d", expected: 0x02, name: "year-month-day" },
    { format: "%_m.%d.%y", expected: 0x04, name: "month.day.year" },
    { format: "%_d.%m.%y", expected: 0x05, name: "day.month.year" },
    { format: "%y.%m.%d", expected: 0x06, name: "year.month.day" }
  ];
  
  dateFormatTests.forEach(test => {
    const time = new Time({
      zone: 1,
      is24h: false,
      dateFormat: test.format,
      time: createTestTime(),
      name: "pdt" // Explicitly set to match Ruby test expectation
    });
    
    const expectedPacket = [0x32, 0x01, 0x20, 0x13, 0x1c, 0x0a, 0x15, 0x0f, 0x19, 0x0d, 0x1d, 0x02, 0x01, test.expected];
    verifyPacket(time.packets(), expectedPacket, `date format ${test.name}`);
  });
  
  // Test 5: Different time - 1997-09-19 19:36:55 (Friday)
  // Ruby test uses Pacific/Auckland timezone which produces "nzs" for this date
  const time5 = new Time({
    zone: 1,
    is24h: false,
    dateFormat: "%_m-%d-%y",
    time: new Date(1997, 8, 19, 19, 36, 55), // Month is 0-based
    name: "nzs" // Explicitly set to match Ruby test expectation
  });
  
  verifyPacket(
    time5.packets(),
    [0x32, 0x01, 0x37, 0x13, 0x24, 0x09, 0x13, 0x61, 0x17, 0x23, 0x1c, 0x04, 0x01, 0x00],
    "different time (1997-09-19)"
  );
  
  // Test 6: Custom name "1"
  const time6 = new Time({
    zone: 1,
    is24h: false,
    dateFormat: "%_m-%d-%y",
    time: createTestTime(),
    name: "1"
  });
  
  verifyPacket(
    time6.packets(),
    [0x32, 0x01, 0x20, 0x13, 0x1c, 0x0a, 0x15, 0x0f, 0x01, 0x24, 0x24, 0x02, 0x01, 0x00],
    "custom name '1'"
  );
  
  // Test 7: Custom name with special characters "<>["
  const time7 = new Time({
    zone: 1,
    is24h: false,
    dateFormat: "%_m-%d-%y",
    time: createTestTime(),
    name: "<>["
  });
  
  verifyPacket(
    time7.packets(),
    [0x32, 0x01, 0x20, 0x13, 0x1c, 0x0a, 0x15, 0x0f, 0x3c, 0x3d, 0x3e, 0x02, 0x01, 0x00],
    "custom name with special chars"
  );
  
  // Test 8: Long name (should be truncated to 3 chars)
  const time8 = new Time({
    zone: 1,
    is24h: false,
    dateFormat: "%_m-%d-%y",
    time: createTestTime(),
    name: "Longer than 3 Characters"
  });
  
  verifyPacket(
    time8.packets(),
    [0x32, 0x01, 0x20, 0x13, 0x1c, 0x0a, 0x15, 0x0f, 0x15, 0x18, 0x17, 0x02, 0x01, 0x00],
    "long name (truncated)"
  );
  
  // Test 9: Default timezone name (no name provided)
  // Should default to "tz1" for zone 1
  const time9 = new Time({
    zone: 1,
    is24h: false,
    dateFormat: "%_m-%d-%y",
    time: new Date(1997, 8, 19, 19, 36, 55), // Month is 0-based
    name: null
  });
  
  verifyPacket(
    time9.packets(),
    [0x32, 0x01, 0x37, 0x13, 0x24, 0x09, 0x13, 0x61, 0x1d, 0x23, 0x01, 0x04, 0x01, 0x00],
    "default timezone name (tz1)"
  );
  
  // Test 10: Default timezone name for zone 2
  const time10 = new Time({
    zone: 2,
    is24h: false,
    dateFormat: "%_m-%d-%y",
    time: new Date(1997, 8, 19, 19, 36, 55), // Month is 0-based
    name: null
  });
  
  verifyPacket(
    time10.packets(),
    [0x32, 0x02, 0x37, 0x13, 0x24, 0x09, 0x13, 0x61, 0x1d, 0x23, 0x02, 0x04, 0x01, 0x00],
    "default timezone name for zone 2 (tz2)"
  );
  
  // Test validation errors
  console.log('Testing validation errors...');
  
  // Test invalid zone (0)
  try {
    const invalidTime1 = new Time({
      zone: 0,
      is24h: false,
      dateFormat: "%_m-%d-%y",
      time: createTestTime(),
      name: null
    });
    invalidTime1.packets();
    throw new Error('Expected validation error for zone 0');
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw new Error(`Expected ValidationError, got ${error.constructor.name}`);
    }
    if (!error.message.includes('Zone 0 is invalid')) {
      throw new Error(`Unexpected error message: ${error.message}`);
    }
    console.log('✓ Zone 0 validation error correct');
  }
  
  // Test invalid zone (3)
  try {
    const invalidTime2 = new Time({
      zone: 3,
      is24h: false,
      dateFormat: "%_m-%d-%y",
      time: createTestTime(),
      name: null
    });
    invalidTime2.packets();
    throw new Error('Expected validation error for zone 3');
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw new Error(`Expected ValidationError, got ${error.constructor.name}`);
    }
    if (!error.message.includes('Zone 3 is invalid')) {
      throw new Error(`Unexpected error message: ${error.message}`);
    }
    console.log('✓ Zone 3 validation error correct');
  }
  
  // Test invalid date format
  try {
    const invalidTime3 = new Time({
      zone: 1,
      is24h: false,
      dateFormat: "%y",
      time: createTestTime(),
      name: null
    });
    invalidTime3.packets();
    throw new Error('Expected validation error for invalid date format');
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw new Error(`Expected ValidationError, got ${error.constructor.name}`);
    }
    if (!error.message.includes('Date format %y is invalid')) {
      throw new Error(`Unexpected error message: ${error.message}`);
    }
    console.log('✓ Invalid date format validation error correct');
  }
  
  // Test constants
  if (Time.CPACKET_TIME[0] !== 0x32) {
    throw new Error(`Expected CPACKET_TIME 0x32, got ${Time.CPACKET_TIME[0]}`);
  }
  
  const expectedDateFormats = {
    "%_m-%d-%y": 0,
    "%_d-%m-%y": 1,
    "%y-%m-%d": 2,
    "%_m.%d.%y": 4,
    "%_d.%m.%y": 5,
    "%y.%m.%d": 6
  };
  
  for (const [format, value] of Object.entries(expectedDateFormats)) {
    if (Time.DATE_FORMAT_MAP[format] !== value) {
      throw new Error(`Expected DATE_FORMAT_MAP['${format}'] = ${value}, got ${Time.DATE_FORMAT_MAP[format]}`);
    }
  }
  
  console.log('✓ Constants are correct');
  console.log('✓ All Protocol3 Time tests passed\n');
};

export default testTime;