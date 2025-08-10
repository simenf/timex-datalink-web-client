/**
 * Tests for Protocol3 SoundOptions class
 * 
 * Verifies that the JavaScript implementation produces identical
 * byte output to the Ruby version for various sound configurations.
 */

import SoundOptions from '../../lib/protocol3/sound-options.js';
import CrcPacketsWrapper from '../../lib/helpers/crc-packets-wrapper.js';
import { ValidationError } from '../../lib/helpers/data-validator.js';

// Test suite for Protocol3 SoundOptions
const testSoundOptions = () => {
  console.log('Testing Protocol3 SoundOptions...');
  
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
  
  // Test 1: Default sound options (all enabled)
  const soundOptions1 = new SoundOptions({
    hourlyChime: true,
    buttonBeep: true,
    alarmSound: true
  });
  
  // Expected packet: [0x71, options_byte, 0x00]
  // Bit 0: hourlyChime, Bit 1: buttonBeep, Bit 2: alarmSound
  // All enabled = 0x07 (0b00000111)
  verifyPacket(
    soundOptions1.packets(),
    [0x71, 0x07, 0x00],
    "default sound options (all enabled)"
  );
  
  // Test 2: All sound options disabled
  const soundOptions2 = new SoundOptions({
    hourlyChime: false,
    buttonBeep: false,
    alarmSound: false
  });
  
  verifyPacket(
    soundOptions2.packets(),
    [0x71, 0x00, 0x00],
    "all sound options disabled"
  );
  
  // Test 3: Only hourly chime enabled
  const soundOptions3 = new SoundOptions({
    hourlyChime: true,
    buttonBeep: false,
    alarmSound: false
  });
  
  verifyPacket(
    soundOptions3.packets(),
    [0x71, 0x01, 0x00],
    "only hourly chime enabled"
  );
  
  // Test 4: Only button beep enabled
  const soundOptions4 = new SoundOptions({
    hourlyChime: false,
    buttonBeep: true,
    alarmSound: false
  });
  
  verifyPacket(
    soundOptions4.packets(),
    [0x71, 0x02, 0x00],
    "only button beep enabled"
  );
  
  // Test 5: Only alarm sound enabled
  const soundOptions5 = new SoundOptions({
    hourlyChime: false,
    buttonBeep: false,
    alarmSound: true
  });
  
  verifyPacket(
    soundOptions5.packets(),
    [0x71, 0x04, 0x00],
    "only alarm sound enabled"
  );
  
  // Test 6: Hourly chime and button beep enabled
  const soundOptions6 = new SoundOptions({
    hourlyChime: true,
    buttonBeep: true,
    alarmSound: false
  });
  
  verifyPacket(
    soundOptions6.packets(),
    [0x71, 0x03, 0x00],
    "hourly chime and button beep enabled"
  );
  
  // Test 7: Hourly chime and alarm sound enabled
  const soundOptions7 = new SoundOptions({
    hourlyChime: true,
    buttonBeep: false,
    alarmSound: true
  });
  
  verifyPacket(
    soundOptions7.packets(),
    [0x71, 0x05, 0x00],
    "hourly chime and alarm sound enabled"
  );
  
  // Test 8: Button beep and alarm sound enabled
  const soundOptions8 = new SoundOptions({
    hourlyChime: false,
    buttonBeep: true,
    alarmSound: true
  });
  
  verifyPacket(
    soundOptions8.packets(),
    [0x71, 0x06, 0x00],
    "button beep and alarm sound enabled"
  );
  
  // Test 9: Default constructor (should default to all enabled)
  const soundOptions9 = new SoundOptions();
  
  verifyPacket(
    soundOptions9.packets(),
    [0x71, 0x07, 0x00],
    "default constructor (all enabled)"
  );
  
  // Test constants
  if (SoundOptions.CPACKET_SOUND_OPTIONS[0] !== 0x71) {
    throw new Error(`Expected CPACKET_SOUND_OPTIONS 0x71, got ${SoundOptions.CPACKET_SOUND_OPTIONS[0]}`);
  }
  
  // Test bit masks
  if (SoundOptions.HOURLY_CHIME_MASK !== 0x01) {
    throw new Error(`Expected HOURLY_CHIME_MASK 0x01, got ${SoundOptions.HOURLY_CHIME_MASK}`);
  }
  
  if (SoundOptions.BUTTON_BEEP_MASK !== 0x02) {
    throw new Error(`Expected BUTTON_BEEP_MASK 0x02, got ${SoundOptions.BUTTON_BEEP_MASK}`);
  }
  
  if (SoundOptions.ALARM_SOUND_MASK !== 0x04) {
    throw new Error(`Expected ALARM_SOUND_MASK 0x04, got ${SoundOptions.ALARM_SOUND_MASK}`);
  }
  
  console.log('✓ Constants are correct');
  console.log('✓ All Protocol3 SoundOptions tests passed\n');
};

export default testSoundOptions;