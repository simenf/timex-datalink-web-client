/**
 * Tests for Protocol3 EEPROM List class
 * 
 * Verifies that the JavaScript implementation produces identical
 * byte output to the Ruby version for various list configurations.
 */

import List from '../../../lib/protocol3/eeprom/list.js';
import CrcPacketsWrapper from '../../../lib/helpers/crc-packets-wrapper.js';
import { ValidationError } from '../../../lib/helpers/data-validator.js';

// Test suite for Protocol3 EEPROM List
const testList = () => {
  console.log('Testing Protocol3 EEPROM List...');
  
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
  
  // Test 1: Basic list with priority 1
  const list1 = new List({
    priority: 1,
    message: "Buy milk"
  });
  
  // Expected packet format:
  // [0x94, priority, ...message_chars_with_terminator]
  verifyPacket(
    list1.packets(),
    [0x94, 0x01, 0x0b, 0x1e, 0x22, 0x24, 0x16, 0x12, 0x15, 0x14, 0x00],
    "basic list with priority 1"
  );
  
  // Test 2: List with priority 2
  const list2 = new List({
    priority: 2,
    message: "Call dentist"
  });
  
  verifyPacket(
    list2.packets(),
    [0x94, 0x02, 0x0c, 0x0a, 0x15, 0x15, 0x24, 0x0d, 0x0e, 0x17, 0x1d, 0x12, 0x1c, 0x1d, 0x00],
    "list with priority 2"
  );
  
  // Test 3: List with priority 3
  const list3 = new List({
    priority: 3,
    message: "Pick up dry cleaning"
  });
  
  verifyPacket(
    list3.packets(),
    [0x94, 0x03, 0x19, 0x12, 0x0c, 0x14, 0x24, 0x1e, 0x19, 0x24, 0x0d, 0x1b, 0x22, 0x24, 0x0c, 0x15, 0x0e, 0x0a, 0x17, 0x12, 0x17, 0x10, 0x00],
    "list with priority 3"
  );
  
  // Test 4: List with priority 4
  const list4 = new List({
    priority: 4,
    message: "Meeting at 3pm"
  });
  
  verifyPacket(
    list4.packets(),
    [0x94, 0x04, 0x16, 0x0e, 0x0e, 0x1d, 0x12, 0x17, 0x10, 0x24, 0x0a, 0x1d, 0x24, 0x03, 0x19, 0x16, 0x00],
    "list with priority 4"
  );
  
  // Test 5: List with priority 5 (maximum)
  const list5 = new List({
    priority: 5,
    message: "Urgent task"
  });
  
  verifyPacket(
    list5.packets(),
    [0x94, 0x05, 0x1e, 0x1b, 0x10, 0x0e, 0x17, 0x1d, 0x24, 0x1d, 0x0a, 0x1c, 0x14, 0x00],
    "list with priority 5 (maximum)"
  );
  
  // Test 6: List with empty message
  const list6 = new List({
    priority: 1,
    message: ""
  });
  
  verifyPacket(
    list6.packets(),
    [0x94, 0x01, 0x00],
    "list with empty message"
  );
  
  // Test 7: List with long message (should be truncated)
  const list7 = new List({
    priority: 2,
    message: "This is a very long message that should be truncated to fit within the available space"
  });
  
  verifyPacket(
    list7.packets(),
    [0x94, 0x02, 0x1d, 0x11, 0x12, 0x1c, 0x24, 0x12, 0x1c, 0x24, 0x0a, 0x24, 0x1f, 0x0e, 0x1b, 0x22, 0x24, 0x15, 0x18, 0x17, 0x10, 0x24, 0x16, 0x0e, 0x1c, 0x1c, 0x0a, 0x10, 0x0e, 0x24, 0x1d, 0x00],
    "list with long message (truncated)"
  );
  
  // Test 8: List with special characters
  const list8 = new List({
    priority: 3,
    message: "Buy: bread, milk & eggs!"
  });
  
  verifyPacket(
    list8.packets(),
    [0x94, 0x03, 0x0b, 0x1e, 0x22, 0x3a, 0x24, 0x0b, 0x1b, 0x0e, 0x0a, 0x0d, 0x2c, 0x24, 0x16, 0x12, 0x15, 0x14, 0x24, 0x26, 0x24, 0x0e, 0x10, 0x10, 0x1c, 0x21, 0x00],
    "list with special characters"
  );
  
  // Test validation errors
  console.log('Testing validation errors...');
  
  // Test invalid priority (0)
  try {
    const invalidList1 = new List({
      priority: 0,
      message: "Test"
    });
    invalidList1.packets();
    throw new Error('Expected validation error for priority 0');
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw new Error(`Expected ValidationError, got ${error.constructor.name}`);
    }
    if (!error.message.includes('Priority 0 is invalid')) {
      throw new Error(`Unexpected error message: ${error.message}`);
    }
    console.log('✓ Priority 0 validation error correct');
  }
  
  // Test invalid priority (6)
  try {
    const invalidList2 = new List({
      priority: 6,
      message: "Test"
    });
    invalidList2.packets();
    throw new Error('Expected validation error for priority 6');
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw new Error(`Expected ValidationError, got ${error.constructor.name}`);
    }
    if (!error.message.includes('Priority 6 is invalid')) {
      throw new Error(`Unexpected error message: ${error.message}`);
    }
    console.log('✓ Priority 6 validation error correct');
  }
  
  // Test constants
  if (List.CPACKET_LIST[0] !== 0x94) {
    throw new Error(`Expected CPACKET_LIST 0x94, got ${List.CPACKET_LIST[0]}`);
  }
  
  if (List.MESSAGE_LENGTH !== 31) {
    throw new Error(`Expected MESSAGE_LENGTH 31, got ${List.MESSAGE_LENGTH}`);
  }
  
  console.log('✓ Constants are correct');
  console.log('✓ All Protocol3 EEPROM List tests passed\n');
};

export default testList;