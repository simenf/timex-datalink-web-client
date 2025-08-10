/**
 * Test runner for Protocol3 Sync
 */

import testSync from './protocol3/sync.test.js';

try {
  testSync();
  console.log('All tests passed!');
} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
}