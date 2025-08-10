import CrcPacketsWrapper from '../../lib/helpers/crc-packets-wrapper.js';

/**
 * Test suite for CRC16-ARC implementation
 * 
 * These tests verify that our JavaScript implementation produces
 * identical results to the Ruby CRC gem's crc16_arc method.
 */

// Test data from Ruby implementation
const testCases = [
  {
    description: 'Protocol 3 Start packet',
    packet: [0x20, 0x00, 0x00, 0x03],
    expectedHeader: [7],
    expectedCrc: 510, // 0x1fe
    expectedFooter: [254, 1], // LSB, MSB
    expectedWrapped: [7, 0x20, 0x00, 0x00, 0x03, 254, 1]
  },
  {
    description: 'Protocol End packet',
    packet: [0x21],
    expectedHeader: [4],
    expectedCrc: 55490, // 0xd8c2
    expectedFooter: [194, 216], // LSB, MSB
    expectedWrapped: [4, 0x21, 194, 216]
  },
  {
    description: 'Empty packet',
    packet: [],
    expectedHeader: [3],
    expectedCrc: 320, // CRC of [3] is 0x140
    expectedFooter: [64, 1], // LSB, MSB
    expectedWrapped: [3, 64, 1]
  },
  {
    description: 'Sound options packet',
    packet: [0x32, 0x00],
    expectedHeader: [5],
    expectedCrc: 24837, // 0x6105
    expectedFooter: [5, 97], // LSB, MSB
    expectedWrapped: [5, 0x32, 0x00, 5, 97]
  },
  {
    description: 'Protocol 3 sound options packet',
    packet: [0x71, 0x00, 0x00],
    expectedHeader: [6],
    expectedCrc: 37712, // 0x9350
    expectedFooter: [80, 147], // LSB, MSB
    expectedWrapped: [6, 0x71, 0x00, 0x00, 80, 147]
  }
];

// Basic CRC16-ARC algorithm tests
const crcTestCases = [
  { data: [0x00], expected: 0 },
  { data: [0x01], expected: 49345 }, // 0xc0c1
  { data: [0xFF], expected: 16448 }, // 0x4040
  { data: [7, 32, 0, 0, 3], expected: 510 }, // 0x1fe - header + start packet
  { data: [4, 33], expected: 55490 }, // 0xd8c2 - header + end packet
  { data: [5, 50, 0], expected: 24837 }, // 0x6105 - sound options
  { data: [6, 113, 0, 0], expected: 37712 }, // 0x9350 - protocol 3 sound options
  { data: [18, 80, 1, 0, 0, 0, 0, 10, 21, 10, 27, 22, 36, 1, 36, 0], expected: 56259 } // 0xdbc3 - alarm
];

function runTests() {
  console.log('Running CRC16-ARC Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test basic CRC16-ARC algorithm
  console.log('=== Basic CRC16-ARC Algorithm Tests ===');
  crcTestCases.forEach((testCase, index) => {
    const result = CrcPacketsWrapper.crc16Arc(testCase.data);
    const success = result === testCase.expected;
    
    console.log(`Test ${index + 1}: CRC of [${testCase.data.join(', ')}]`);
    console.log(`  Expected: ${testCase.expected} (0x${testCase.expected.toString(16)})`);
    console.log(`  Got:      ${result} (0x${result.toString(16)})`);
    console.log(`  Status:   ${success ? 'PASS' : 'FAIL'}\n`);
    
    if (success) passed++;
    else failed++;
  });
  
  // Test packet wrapping functionality
  console.log('=== Packet Wrapping Tests ===');
  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.description}`);
    
    // Test header generation
    const header = CrcPacketsWrapper.crcHeader(testCase.packet);
    const headerMatch = JSON.stringify(header) === JSON.stringify(testCase.expectedHeader);
    console.log(`  Header: ${headerMatch ? 'PASS' : 'FAIL'} - Expected [${testCase.expectedHeader}], Got [${header}]`);
    
    // Test CRC calculation
    const headerAndPacket = [...testCase.expectedHeader, ...testCase.packet];
    const crc = CrcPacketsWrapper.crc16Arc(headerAndPacket);
    const crcMatch = crc === testCase.expectedCrc;
    console.log(`  CRC: ${crcMatch ? 'PASS' : 'FAIL'} - Expected ${testCase.expectedCrc}, Got ${crc}`);
    
    // Test footer generation
    const footer = CrcPacketsWrapper.crcFooter(testCase.packet);
    const footerMatch = JSON.stringify(footer) === JSON.stringify(testCase.expectedFooter);
    console.log(`  Footer: ${footerMatch ? 'PASS' : 'FAIL'} - Expected [${testCase.expectedFooter}], Got [${footer}]`);
    
    // Test complete wrapping
    const wrapped = CrcPacketsWrapper.wrapPackets([testCase.packet])[0];
    const wrappedMatch = JSON.stringify(wrapped) === JSON.stringify(testCase.expectedWrapped);
    console.log(`  Wrapped: ${wrappedMatch ? 'PASS' : 'FAIL'} - Expected [${testCase.expectedWrapped}], Got [${wrapped}]`);
    
    const allMatch = headerMatch && crcMatch && footerMatch && wrappedMatch;
    console.log(`  Overall: ${allMatch ? 'PASS' : 'FAIL'}\n`);
    
    if (allMatch) passed++;
    else failed++;
  });
  
  // Test multiple packet wrapping
  console.log('=== Multiple Packet Wrapping Test ===');
  const multiplePackets = [
    [0x20, 0x00, 0x00, 0x03], // Start
    [0x21] // End
  ];
  const expectedMultiple = [
    [7, 0x20, 0x00, 0x00, 0x03, 254, 1],
    [4, 0x21, 194, 216]
  ];
  
  const wrappedMultiple = CrcPacketsWrapper.wrapPackets(multiplePackets);
  const multipleMatch = JSON.stringify(wrappedMultiple) === JSON.stringify(expectedMultiple);
  console.log(`Multiple packets: ${multipleMatch ? 'PASS' : 'FAIL'}`);
  console.log(`  Expected: ${JSON.stringify(expectedMultiple)}`);
  console.log(`  Got:      ${JSON.stringify(wrappedMultiple)}\n`);
  
  if (multipleMatch) passed++;
  else failed++;
  
  // Summary
  console.log('=== Test Summary ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! CRC implementation matches Ruby version.');
  } else {
    console.log(`\n❌ ${failed} test(s) failed. Implementation needs adjustment.`);
  }
  
  return failed === 0;
}

// Export for use in test runner
export { runTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}