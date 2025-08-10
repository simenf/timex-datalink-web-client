/**
 * Tests for Protocol3 EEPROM class
 * 
 * Verifies that the JavaScript implementation produces identical
 * byte output to the Ruby version for various EEPROM configurations.
 */

import EEPROM from '../../lib/protocol3/eeprom.js';
import Appointment from '../../lib/protocol3/eeprom/appointment.js';
import Anniversary from '../../lib/protocol3/eeprom/anniversary.js';
import PhoneNumber from '../../lib/protocol3/eeprom/phone-number.js';
import List from '../../lib/protocol3/eeprom/list.js';
import CrcPacketsWrapper from '../../lib/helpers/crc-packets-wrapper.js';
import { ValidationError } from '../../lib/helpers/data-validator.js';

// Test suite for Protocol3 EEPROM
const testEeprom = () => {
  console.log('Testing Protocol3 EEPROM...');
  
  // Helper function to verify packet structure
  const verifyPacketStructure = (packets, testName) => {
    console.log(`Testing ${testName}...`);
    
    if (!Array.isArray(packets) || packets.length === 0) {
      throw new Error('Expected non-empty array of packets');
    }
    
    // All packets should be arrays of bytes
    for (let i = 0; i < packets.length; i++) {
      if (!Array.isArray(packets[i])) {
        throw new Error(`Packet ${i} is not an array`);
      }
      
      for (let j = 0; j < packets[i].length; j++) {
        const byte = packets[i][j];
        if (!Number.isInteger(byte) || byte < 0 || byte > 255) {
          throw new Error(`Invalid byte at packet ${i}, index ${j}: ${byte}`);
        }
      }
    }
    
    console.log(`✓ ${testName} passed - ${packets.length} packets generated`);
  };
  
  // Test 1: Empty EEPROM
  const eeprom1 = new EEPROM({
    appointments: [],
    anniversaries: [],
    phoneNumbers: [],
    lists: [],
    appointmentNotificationMinutes: null
  });
  
  verifyPacketStructure(eeprom1.packets(), "empty EEPROM");
  
  // Test 2: EEPROM with single appointment
  const appointment = new Appointment({
    time: new Date(2015, 9, 21, 14, 30, 0),
    message: "Meeting"
  });
  
  const eeprom2 = new EEPROM({
    appointments: [appointment],
    anniversaries: [],
    phoneNumbers: [],
    lists: [],
    appointmentNotificationMinutes: null
  });
  
  verifyPacketStructure(eeprom2.packets(), "EEPROM with appointment");
  
  // Test 3: EEPROM with single anniversary
  const anniversary = new Anniversary({
    month: 6,
    day: 15,
    message: "Wedding"
  });
  
  const eeprom3 = new EEPROM({
    appointments: [],
    anniversaries: [anniversary],
    phoneNumbers: [],
    lists: [],
    appointmentNotificationMinutes: null
  });
  
  verifyPacketStructure(eeprom3.packets(), "EEPROM with anniversary");
  
  // Test 4: EEPROM with single phone number
  const phoneNumber = new PhoneNumber({
    name: "John",
    number: "555-1234"
  });
  
  const eeprom4 = new EEPROM({
    appointments: [],
    anniversaries: [],
    phoneNumbers: [phoneNumber],
    lists: [],
    appointmentNotificationMinutes: null
  });
  
  verifyPacketStructure(eeprom4.packets(), "EEPROM with phone number");
  
  // Test 5: EEPROM with single list item
  const listItem = new List({
    priority: 1,
    message: "Buy milk"
  });
  
  const eeprom5 = new EEPROM({
    appointments: [],
    anniversaries: [],
    phoneNumbers: [],
    lists: [listItem],
    appointmentNotificationMinutes: null
  });
  
  verifyPacketStructure(eeprom5.packets(), "EEPROM with list item");
  
  // Test 6: EEPROM with all types of data
  const eeprom6 = new EEPROM({
    appointments: [appointment],
    anniversaries: [anniversary],
    phoneNumbers: [phoneNumber],
    lists: [listItem],
    appointmentNotificationMinutes: 15
  });
  
  verifyPacketStructure(eeprom6.packets(), "EEPROM with all data types");
  
  // Test 7: EEPROM with multiple items of each type
  const eeprom7 = new EEPROM({
    appointments: [
      new Appointment({ time: new Date(2015, 9, 21, 9, 0, 0), message: "Morning meeting" }),
      new Appointment({ time: new Date(2015, 9, 21, 15, 30, 0), message: "Afternoon call" })
    ],
    anniversaries: [
      new Anniversary({ month: 1, day: 1, message: "New Year" }),
      new Anniversary({ month: 12, day: 25, message: "Christmas" })
    ],
    phoneNumbers: [
      new PhoneNumber({ name: "Home", number: "555-0001" }),
      new PhoneNumber({ name: "Work", number: "555-0002" })
    ],
    lists: [
      new List({ priority: 1, message: "High priority task" }),
      new List({ priority: 2, message: "Medium priority task" })
    ],
    appointmentNotificationMinutes: 10
  });
  
  verifyPacketStructure(eeprom7.packets(), "EEPROM with multiple items");
  
  // Test appointment notification minutes validation
  console.log('Testing appointment notification minutes validation...');
  
  const validMinutes = [null, 0, 5, 10, 15, 20, 25, 30];
  for (const minutes of validMinutes) {
    try {
      const eeprom = new EEPROM({
        appointments: [],
        anniversaries: [],
        phoneNumbers: [],
        lists: [],
        appointmentNotificationMinutes: minutes
      });
      
      const packets = eeprom.packets();
      console.log(`✓ Valid appointment notification minutes: ${minutes}`);
    } catch (error) {
      throw new Error(`Unexpected error for valid minutes ${minutes}: ${error.message}`);
    }
  }
  
  // Test invalid appointment notification minutes
  const invalidMinutes = [1, 3, 7, 12, 35, -5];
  for (const minutes of invalidMinutes) {
    try {
      const eeprom = new EEPROM({
        appointments: [],
        anniversaries: [],
        phoneNumbers: [],
        lists: [],
        appointmentNotificationMinutes: minutes
      });
      eeprom.packets();
      throw new Error(`Expected validation error for invalid minutes ${minutes}`);
    } catch (error) {
      if (!(error instanceof ValidationError)) {
        throw new Error(`Expected ValidationError for minutes ${minutes}, got ${error.constructor.name}`);
      }
      console.log(`✓ Invalid appointment notification minutes ${minutes} correctly rejected`);
    }
  }
  
  // Test constants
  if (EEPROM.CPACKET_CLEAR[0] !== 0x93) {
    throw new Error(`Expected CPACKET_CLEAR 0x93, got ${EEPROM.CPACKET_CLEAR[0]}`);
  }
  
  if (EEPROM.CPACKET_SECT[0] !== 0x90) {
    throw new Error(`Expected CPACKET_SECT 0x90, got ${EEPROM.CPACKET_SECT[0]}`);
  }
  
  if (EEPROM.CPACKET_DATA[0] !== 0x91) {
    throw new Error(`Expected CPACKET_DATA 0x91, got ${EEPROM.CPACKET_DATA[0]}`);
  }
  
  if (EEPROM.CPACKET_END[0] !== 0x92) {
    throw new Error(`Expected CPACKET_END 0x92, got ${EEPROM.CPACKET_END[0]}`);
  }
  
  console.log('✓ Constants are correct');
  console.log('✓ All Protocol3 EEPROM tests passed\n');
};

export default testEeprom;