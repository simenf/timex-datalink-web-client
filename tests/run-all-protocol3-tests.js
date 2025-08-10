/**
 * Comprehensive test runner for all Protocol3 components
 */

import testStart from './protocol3/start.test.js';
import testSync from './protocol3/sync.test.js';
import testTime from './protocol3/time.test.js';
import testEnd from './protocol3/end.test.js';
import testAlarm from './protocol3/alarm.test.js';
import testEeprom from './protocol3/eeprom.test.js';
import testSoundOptions from './protocol3/sound-options.test.js';
import testSoundTheme from './protocol3/sound-theme.test.js';

// EEPROM sub-component tests
import testAppointment from './protocol3/eeprom/appointment.test.js';
import testAnniversary from './protocol3/eeprom/anniversary.test.js';
import testPhoneNumber from './protocol3/eeprom/phone-number.test.js';
import testList from './protocol3/eeprom/list.test.js';

console.log('🧪 Running All Protocol 3 Tests\n');
console.log('================================\n');

const tests = [
  { name: 'Protocol3.Start', test: testStart },
  { name: 'Protocol3.Sync', test: testSync },
  { name: 'Protocol3.Time', test: testTime },
  { name: 'Protocol3.End', test: testEnd },
  { name: 'Protocol3.Alarm', test: testAlarm },
  { name: 'Protocol3.EEPROM', test: testEeprom },
  { name: 'Protocol3.SoundOptions', test: testSoundOptions },
  { name: 'Protocol3.SoundTheme', test: testSoundTheme },
  { name: 'Protocol3.EEPROM.Appointment', test: testAppointment },
  { name: 'Protocol3.EEPROM.Anniversary', test: testAnniversary },
  { name: 'Protocol3.EEPROM.PhoneNumber', test: testPhoneNumber },
  { name: 'Protocol3.EEPROM.List', test: testList }
];

let passed = 0;
let failed = 0;

for (const { name, test } of tests) {
  try {
    console.log(`\n--- Testing ${name} ---`);
    test();
    console.log(`✅ ${name} - All tests passed`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name} - Tests failed: ${error.message}`);
    console.error(error.stack);
    failed++;
  }
}

console.log('\n================================');
console.log('📊 Test Summary');
console.log('================================');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Total:  ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 All Protocol 3 tests passed!');
  process.exit(0);
} else {
  console.log(`\n💥 ${failed} test suite(s) failed.`);
  process.exit(1);
}