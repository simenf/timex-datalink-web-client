/**
 * Test runner for Protocol3 End
 */

import testEnd from './protocol3/end.test.js';

try {
  testEnd();
  console.log('All tests passed!');
} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
}