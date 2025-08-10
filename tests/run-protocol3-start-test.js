/**
 * Test runner for Protocol3 Start
 */

import testStart from './protocol3/start.test.js';

try {
  testStart();
  console.log('All tests passed!');
} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
}