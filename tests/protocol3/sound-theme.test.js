/**
 * Tests for Protocol3 SoundTheme class
 * 
 * Verifies that the JavaScript implementation produces identical
 * byte output to the Ruby version for various sound theme configurations.
 */

import SoundTheme from '../../lib/protocol3/sound-theme.js';
import CrcPacketsWrapper from '../../lib/helpers/crc-packets-wrapper.js';
import { ValidationError } from '../../lib/helpers/data-validator.js';

// Test suite for Protocol3 SoundTheme
const testSoundTheme = () => {
  console.log('Testing Protocol3 SoundTheme...');
  
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
  
  // Test 1: Theme 0 (Sci-Fi)
  const soundTheme1 = new SoundTheme({
    theme: 0
  });
  
  // Expected packet: [0x72, theme_number, 0x00]
  verifyPacket(
    soundTheme1.packets(),
    [0x72, 0x00, 0x00],
    "theme 0 (Sci-Fi)"
  );
  
  // Test 2: Theme 1 (Military)
  const soundTheme2 = new SoundTheme({
    theme: 1
  });
  
  verifyPacket(
    soundTheme2.packets(),
    [0x72, 0x01, 0x00],
    "theme 1 (Military)"
  );
  
  // Test 3: Theme 2 (Campy)
  const soundTheme3 = new SoundTheme({
    theme: 2
  });
  
  verifyPacket(
    soundTheme3.packets(),
    [0x72, 0x02, 0x00],
    "theme 2 (Campy)"
  );
  
  // Test 4: Theme 3 (Biker)
  const soundTheme4 = new SoundTheme({
    theme: 3
  });
  
  verifyPacket(
    soundTheme4.packets(),
    [0x72, 0x03, 0x00],
    "theme 3 (Biker)"
  );
  
  // Test 5: Theme 4 (Commuter)
  const soundTheme5 = new SoundTheme({
    theme: 4
  });
  
  verifyPacket(
    soundTheme5.packets(),
    [0x72, 0x04, 0x00],
    "theme 4 (Commuter)"
  );
  
  // Test 6: Theme 5 (Athlete)
  const soundTheme6 = new SoundTheme({
    theme: 5
  });
  
  verifyPacket(
    soundTheme6.packets(),
    [0x72, 0x05, 0x00],
    "theme 5 (Athlete)"
  );
  
  // Test 7: Theme 6 (Formal)
  const soundTheme7 = new SoundTheme({
    theme: 6
  });
  
  verifyPacket(
    soundTheme7.packets(),
    [0x72, 0x06, 0x00],
    "theme 6 (Formal)"
  );
  
  // Test 8: Theme 7 (Fun)
  const soundTheme8 = new SoundTheme({
    theme: 7
  });
  
  verifyPacket(
    soundTheme8.packets(),
    [0x72, 0x07, 0x00],
    "theme 7 (Fun)"
  );
  
  // Test 9: Default constructor (should default to theme 0)
  const soundTheme9 = new SoundTheme();
  
  verifyPacket(
    soundTheme9.packets(),
    [0x72, 0x00, 0x00],
    "default constructor (theme 0)"
  );
  
  // Test validation errors
  console.log('Testing validation errors...');
  
  // Test invalid theme (-1)
  try {
    const invalidTheme1 = new SoundTheme({
      theme: -1
    });
    invalidTheme1.packets();
    throw new Error('Expected validation error for theme -1');
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw new Error(`Expected ValidationError, got ${error.constructor.name}`);
    }
    if (!error.message.includes('Theme -1 is invalid')) {
      throw new Error(`Unexpected error message: ${error.message}`);
    }
    console.log('✓ Theme -1 validation error correct');
  }
  
  // Test invalid theme (8)
  try {
    const invalidTheme2 = new SoundTheme({
      theme: 8
    });
    invalidTheme2.packets();
    throw new Error('Expected validation error for theme 8');
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw new Error(`Expected ValidationError, got ${error.constructor.name}`);
    }
    if (!error.message.includes('Theme 8 is invalid')) {
      throw new Error(`Unexpected error message: ${error.message}`);
    }
    console.log('✓ Theme 8 validation error correct');
  }
  
  // Test constants
  if (SoundTheme.CPACKET_SOUND_THEME[0] !== 0x72) {
    throw new Error(`Expected CPACKET_SOUND_THEME 0x72, got ${SoundTheme.CPACKET_SOUND_THEME[0]}`);
  }
  
  // Test theme names
  const expectedThemes = [
    'Sci-Fi',
    'Military', 
    'Campy',
    'Biker',
    'Commuter',
    'Athlete',
    'Formal',
    'Fun'
  ];
  
  for (let i = 0; i < expectedThemes.length; i++) {
    if (SoundTheme.THEME_NAMES[i] !== expectedThemes[i]) {
      throw new Error(`Expected THEME_NAMES[${i}] = '${expectedThemes[i]}', got '${SoundTheme.THEME_NAMES[i]}'`);
    }
  }
  
  console.log('✓ Constants are correct');
  console.log('✓ All Protocol3 SoundTheme tests passed\n');
};

export default testSoundTheme;