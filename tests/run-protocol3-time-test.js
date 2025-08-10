/**
 * Test runner for Protocol3 Time
 */

import testTime from './protocol3/time.test.js';

try {
  testTime();
  console.log('All tests passed!');
} catch (error) {
  console.error('Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}