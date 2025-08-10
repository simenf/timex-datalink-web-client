/**
 * Tests for Protocol3 EEPROM Appointment class
 * 
 * Verifies that the JavaScript implementation produces identical
 * byte output to the Ruby version for various appointment configurations.
 */

import Appointment from '../../../lib/protocol3/eeprom/appointment.js';
import CrcPacketsWrapper from '../../../lib/helpers/crc-packets-wrapper.js';
import { ValidationError } from '../../../lib/helpers/data-validator.js';

// Test suite for Protocol3 EEPROM Appointment
const testAppointment = () => {
  console.log('Testing Protocol3 EEPROM Appointment...');
  
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
  
  // Test 1: Basic appointment
  const appointment1 = new Appointment({
    time: new Date(2015, 9, 21, 14, 30, 0), // 2:30 PM
    message: "Meeting"
  });
  
  // Expected packet format:
  // [0x90, hour, minute, month, day, year_mod_1995, ...message_chars_with_terminator]
  verifyPacket(
    appointment1.packets(),
    [0x90, 0x0e, 0x1e, 0x0a, 0x15, 0x14, 0x16, 0x0e, 0x0e, 0x1d, 0x12, 0x17, 0x10, 0x00],
    "basic appointment"
  );
  
  // Test 2: Appointment with longer message
  const appointment2 = new Appointment({
    time: new Date(2015, 9, 21, 9, 0, 0), // 9:00 AM
    message: "Doctor appointment"
  });
  
  verifyPacket(
    appointment2.packets(),
    [0x90, 0x09, 0x00, 0x0a, 0x15, 0x14, 0x0d, 0x18, 0x0c, 0x1d, 0x18, 0x1b, 0x24, 0x0a, 0x19, 0x19, 0x18, 0x12, 0x17, 0x1d, 0x16, 0x0e, 0x17, 0x1d, 0x00],
    "appointment with longer message"
  );
  
  // Test 3: Appointment with empty message
  const appointment3 = new Appointment({
    time: new Date(2015, 9, 21, 12, 0, 0), // 12:00 PM
    message: ""
  });
  
  verifyPacket(
    appointment3.packets(),
    [0x90, 0x0c, 0x00, 0x0a, 0x15, 0x14, 0x00],
    "appointment with empty message"
  );
  
  // Test 4: Late night appointment
  const appointment4 = new Appointment({
    time: new Date(2015, 9, 21, 23, 45, 0), // 11:45 PM
    message: "Late call"
  });
  
  verifyPacket(
    appointment4.packets(),
    [0x90, 0x17, 0x2d, 0x0a, 0x15, 0x14, 0x15, 0x0a, 0x1d, 0x0e, 0x24, 0x0c, 0x0a, 0x15, 0x15, 0x00],
    "late night appointment"
  );
  
  // Test 5: Early morning appointment
  const appointment5 = new Appointment({
    time: new Date(2015, 9, 21, 6, 15, 0), // 6:15 AM
    message: "Gym"
  });
  
  verifyPacket(
    appointment5.packets(),
    [0x90, 0x06, 0x0f, 0x0a, 0x15, 0x14, 0x10, 0x22, 0x16, 0x00],
    "early morning appointment"
  );
  
  // Test 6: Appointment with special characters in message
  const appointment6 = new Appointment({
    time: new Date(2015, 9, 21, 16, 30, 0), // 4:30 PM
    message: "Pick up @ store!"
  });
  
  verifyPacket(
    appointment6.packets(),
    [0x90, 0x10, 0x1e, 0x0a, 0x15, 0x14, 0x19, 0x12, 0x0c, 0x14, 0x24, 0x1e, 0x19, 0x24, 0x40, 0x24, 0x1c, 0x1d, 0x18, 0x1b, 0x0e, 0x21, 0x00],
    "appointment with special characters"
  );
  
  // Test 7: Different year
  const appointment7 = new Appointment({
    time: new Date(2020, 11, 25, 10, 30, 0), // Christmas 2020
    message: "Christmas"
  });
  
  verifyPacket(
    appointment7.packets(),
    [0x90, 0x0a, 0x1e, 0x0c, 0x19, 0x19, 0x0c, 0x11, 0x1b, 0x12, 0x1c, 0x1d, 0x16, 0x0a, 0x1c, 0x00],
    "different year (2020)"
  );
  
  // Test constants
  if (Appointment.CPACKET_APPOINTMENT[0] !== 0x90) {
    throw new Error(`Expected CPACKET_APPOINTMENT 0x90, got ${Appointment.CPACKET_APPOINTMENT[0]}`);
  }
  
  if (Appointment.MESSAGE_LENGTH !== 31) {
    throw new Error(`Expected MESSAGE_LENGTH 31, got ${Appointment.MESSAGE_LENGTH}`);
  }
  
  console.log('✓ Constants are correct');
  console.log('✓ All Protocol3 EEPROM Appointment tests passed\n');
};

export default testAppointment;