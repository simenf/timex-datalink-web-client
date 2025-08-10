/**
 * Integration test runner
 * 
 * Runs all integration tests for device communication and sync workflows.
 */

import testDeviceCommunication from './integration/device-communication.test.js';
import testSyncWorkflows from './integration/sync-workflows.test.js';

console.log('🧪 Running Integration Tests\n');
console.log('============================\n');

const runAllIntegrationTests = async () => {
  const tests = [
    { name: 'Device Communication', test: testDeviceCommunication },
    { name: 'Sync Workflows', test: testSyncWorkflows }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const { name, test } of tests) {
    try {
      console.log(`\n--- Testing ${name} ---`);
      const success = await test();
      if (success) {
        console.log(`✅ ${name} - All tests passed`);
        passed++;
      } else {
        console.log(`❌ ${name} - Some tests failed`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${name} - Tests failed: ${error.message}`);
      console.error(error.stack);
      failed++;
    }
  }
  
  console.log('\n============================');
  console.log('📊 Integration Test Summary');
  console.log('============================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total:  ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All integration tests passed!');
    process.exit(0);
  } else {
    console.log(`\n💥 ${failed} integration test suite(s) failed.`);
    process.exit(1);
  }
};

// Run the tests
runAllIntegrationTests().catch(error => {
  console.error('Fatal error running integration tests:', error);
  process.exit(1);
});