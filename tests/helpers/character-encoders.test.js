/**
 * Tests for Character Encoders
 * Verifies compatibility with Ruby implementation
 */

import { CharacterEncoders } from '../../lib/helpers/character-encoders.js';

// Test cases based on Ruby implementation output
const testCases = [
  {
    name: 'Basic charsFor - Hello World',
    method: 'charsFor',
    input: 'Hello World',
    options: {},
    expected: [17, 14, 21, 21, 24, 36, 32, 24, 27, 21, 13]
  },
  {
    name: 'charsFor with length limit',
    method: 'charsFor',
    input: 'Hello World',
    options: { length: 5 },
    expected: [17, 14, 21, 21, 24]
  },
  {
    name: 'charsFor with padding',
    method: 'charsFor',
    input: 'Hello World',
    options: { length: 15, pad: true },
    expected: [17, 14, 21, 21, 24, 36, 32, 24, 27, 21, 13, 36, 36, 36, 36]
  },
  {
    name: 'charsFor with invalid characters',
    method: 'charsFor',
    input: 'Hello~World',
    options: {},
    expected: [17, 14, 21, 21, 24, 36, 32, 24, 27, 21, 13] // ~ becomes space (index 36)
  },
  {
    name: 'charsFor with uppercase conversion',
    method: 'charsFor',
    input: 'HELLO',
    options: {},
    expected: [17, 14, 21, 21, 24] // Should convert to lowercase
  },
  {
    name: 'charsFor empty string',
    method: 'charsFor',
    input: '',
    options: {},
    expected: []
  },
  {
    name: 'charsFor with timezone name format',
    method: 'charsFor',
    input: 'PST',
    options: { length: 3, pad: true },
    expected: [25, 28, 29] // p=25, s=28, t=29
  },
  {
    name: 'eepromCharsFor - Hello',
    method: 'eepromCharsFor',
    input: 'Hello',
    options: {},
    expected: [145, 83, 85, 216, 15]
  },
  {
    name: 'eepromCharsFor - Release TIMEXDL.EXE',
    method: 'eepromCharsFor',
    input: 'Release TIMEXDL.EXE',
    options: {},
    expected: [155, 83, 57, 10, 231, 144, 157, 100, 57, 97, 83, 201, 78, 232, 252]
  },
  {
    name: 'eepromCharsFor - empty string',
    method: 'eepromCharsFor',
    input: '',
    options: {},
    expected: [63] // Just the terminator
  },
  {
    name: 'eepromCharsFor - single character',
    method: 'eepromCharsFor',
    input: 'A',
    options: {},
    expected: [175, 0] // 'a' (index 10) + terminator
  },
  {
    name: 'phoneCharsFor - 1234567890',
    method: 'phoneCharsFor',
    input: '1234567890',
    options: {},
    expected: [33, 67, 101, 135, 9]
  },
  {
    name: 'phoneCharsFor - with letters',
    method: 'phoneCharsFor',
    input: '555-CALL',
    options: {},
    expected: [85, 85, 85, 176, 176, 176, 176, 0] // Numbers and letters, padded
  },
  {
    name: 'phoneCharsFor - empty string',
    method: 'phoneCharsFor',
    input: '',
    options: {},
    expected: [0] // All zeros
  },
  {
    name: 'protocol6CharsFor - basic test',
    method: 'protocol6CharsFor',
    input: 'Hello',
    options: {},
    expected: [17, 14, 21, 21, 24] // Should use Protocol 6 character map
  }
];

function runTests() {
  console.log('Running Character Encoders tests...\n');
  
  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    console.log(`Input: "${testCase.input}"`);
    console.log(`Options: ${JSON.stringify(testCase.options)}`);
    
    let result;
    switch (testCase.method) {
      case 'charsFor':
        result = CharacterEncoders.charsFor(testCase.input, testCase.options);
        break;
      case 'eepromCharsFor':
        result = CharacterEncoders.eepromCharsFor(testCase.input, testCase.options.length);
        break;
      case 'phoneCharsFor':
        result = CharacterEncoders.phoneCharsFor(testCase.input);
        break;
      case 'protocol6CharsFor':
        result = CharacterEncoders.protocol6CharsFor(testCase.input, testCase.options);
        break;
      default:
        throw new Error(`Unknown method: ${testCase.method}`);
    }
    
    console.log(`Expected: [${testCase.expected.join(', ')}]`);
    console.log(`Got:      [${result.join(', ')}]`);
    
    const matches = JSON.stringify(result) === JSON.stringify(testCase.expected);
    
    if (matches) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  }

  // Test character map constants
  console.log('Testing character map constants...');
  const expectedChars = "0123456789abcdefghijklmnopqrstuvwxyz !\"#$%&'()*+,-./:\\;=@?_|<>[]";
  const expectedEepromChars = "0123456789abcdefghijklmnopqrstuvwxyz !\"#$%&'()*+,-./:\\;=@?_|<>[";
  const expectedPhoneChars = "0123456789cfhpw ";
  
  const charsMatch = CharacterEncoders.CHARS === expectedChars;
  const eepromCharsMatch = CharacterEncoders.EEPROM_CHARS === expectedEepromChars;
  const phoneCharsMatch = CharacterEncoders.PHONE_CHARS === expectedPhoneChars;
  
  console.log(`CHARS constant: ${charsMatch ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`EEPROM_CHARS constant: ${eepromCharsMatch ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`PHONE_CHARS constant: ${phoneCharsMatch ? '✅ PASS' : '❌ FAIL'}`);
  
  if (charsMatch && eepromCharsMatch && phoneCharsMatch) {
    passed++;
  } else {
    failed++;
  }

  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

export { runTests };