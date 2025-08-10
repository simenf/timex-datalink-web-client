/**
 * Tests for Protocol 1 Time packet
 */

import Protocol1Time from '../../lib/protocol1/time.js';

// Test Protocol 1 Time packet generation
function testProtocol1Time() {
  console.log('Testing Protocol 1 Time packet...');
  
  // Test data: January 1, 2024, 12:30:45, Zone 1, 24-hour format
  const testTime = new Date(2024, 0, 1, 12, 30, 45); // Month is 0-based in JS
  const time = new Protocol1Time({
    zone: 1,
    is24h: true,
    time: testTime
  });
  
  const packets = time.packets();
  
  console.log('Time packets:', packets);
  
  // Verify packet structure
  if (packets.length !== 1) {
    throw new Error(`Expected 1 packet, got ${packets.length}`);
  }
  
  const packet = packets[0];
  
  // Verify CRC wrapping (length + data + CRC)
  if (packet.length < 13) { // 1 (length) + 10 (data) + 2 (CRC)
    throw new Error(`Packet too short: ${packet.length}`);
  }
  
  // Verify length byte
  if (packet[0] !== 13) { // 10 (data) + 3 (length + CRC)
    throw new Error(`Expected length 13, got ${packet[0]}`);
  }
  
  // Verify time packet data
  const expectedData = [
    0x30,  // CPACKET_TIME
    1,     // zone
    12,    // hour
    30,    // minute
    1,     // month (1-based)
    1,     // day
    24,    // year % 100
    0,     // wday from Monday (Monday = 0)
    45,    // seconds
    2      // is_24h (2 for 24h, 1 for 12h)
  ];
  
  const actualData = packet.slice(1, 11);
  
  for (let i = 0; i < expectedData.length; i++) {
    if (actualData[i] !== expectedData[i]) {
      throw new Error(`Data mismatch at index ${i}: expected ${expectedData[i]}, got ${actualData[i]}`);
    }
  }
  
  console.log('✓ Protocol 1 Time packet test passed');
}

// Test Protocol 1 Time validation
function testProtocol1TimeValidation() {
  console.log('Testing Protocol 1 Time validation...');
  
  const testTime = new Date(2024, 0, 1, 12, 30, 45);
  
  // Test invalid zone
  try {
    const time = new Protocol1Time({
      zone: 3, // Invalid zone
      is24h: true,
      time: testTime
    });
    time.packets();
    throw new Error('Should have thrown validation error for invalid zone');
  } catch (error) {
    if (!error.message.includes('Validation failed')) {
      throw error;
    }
  }
  
  // Test valid zones
  for (const zone of [1, 2]) {
    const time = new Protocol1Time({
      zone: zone,
      is24h: true,
      time: testTime
    });
    const packets = time.packets();
    if (packets.length !== 1) {
      throw new Error(`Zone ${zone} should be valid`);
    }
  }
  
  console.log('✓ Protocol 1 Time validation test passed');
}

// Test Protocol 1 Time helper methods
function testProtocol1TimeHelpers() {
  console.log('Testing Protocol 1 Time helper methods...');
  
  // Test wday conversion (JavaScript Sunday=0 to Monday=0)
  const testCases = [
    { jsDay: 0, expectedWday: 6 }, // Sunday -> 6
    { jsDay: 1, expectedWday: 0 }, // Monday -> 0
    { jsDay: 2, expectedWday: 1 }, // Tuesday -> 1
    { jsDay: 6, expectedWday: 5 }  // Saturday -> 5
  ];
  
  for (const testCase of testCases) {
    // Create a date with the specific day of week
    const date = new Date(2024, 0, 1); // Start with Jan 1, 2024 (Monday)
    date.setDate(date.getDate() + testCase.jsDay - 1); // Adjust to get desired day
    
    const time = new Protocol1Time({
      zone: 1,
      is24h: true,
      time: date
    });
    
    const actualWday = time.wdayFromMonday();
    if (actualWday !== testCase.expectedWday) {
      throw new Error(`Wday conversion failed: JS day ${testCase.jsDay} should convert to ${testCase.expectedWday}, got ${actualWday}`);
    }
  }
  
  // Test is24h value conversion
  const time24h = new Protocol1Time({
    zone: 1,
    is24h: true,
    time: new Date()
  });
  
  const time12h = new Protocol1Time({
    zone: 1,
    is24h: false,
    time: new Date()
  });
  
  if (time24h.is24hValue() !== 2) {
    throw new Error(`24h should return 2, got ${time24h.is24hValue()}`);
  }
  
  if (time12h.is24hValue() !== 1) {
    throw new Error(`12h should return 1, got ${time12h.is24hValue()}`);
  }
  
  console.log('✓ Protocol 1 Time helper methods test passed');
}

// Run tests
try {
  testProtocol1Time();
  testProtocol1TimeValidation();
  testProtocol1TimeHelpers();
  console.log('All Protocol 1 Time tests passed!');
} catch (error) {
  console.error('Protocol 1 Time test failed:', error.message);
  process.exit(1);
}