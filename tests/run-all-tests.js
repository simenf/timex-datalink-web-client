/**
 * Master test runner for all test suites
 * 
 * Runs unit tests, integration tests, and end-to-end tests.
 */

import { runAllTests as runUnitTests } from './test-suite.js';

console.log('🧪 Running Complete Test Suite\n');
console.log('==============================\n');

const runAllTestSuites = async () => {
  console.log('This will run all test suites in sequence:\n');
  console.log('1. Unit Tests (helpers, protocol components, core library)');
  console.log('2. Integration Tests (device communication, sync workflows)');
  console.log('3. End-to-End Tests (web application)\n');
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  // Run unit tests
  console.log('=== UNIT TESTS ===\n');
  try {
    const unitResults = await runUnitTests();
    console.log('\n✅ Unit tests completed\n');
    totalPassed++;
  } catch (error) {
    console.log('\n❌ Unit tests failed\n');
    totalFailed++;
  }
  
  // Run integration tests
  console.log('=== INTEGRATION TESTS ===\n');
  try {
    const { default: testDeviceCommunication } = await import('./integration/device-communication.test.js');
    const { default: testSyncWorkflows } = await import('./integration/sync-workflows.test.js');
    
    console.log('--- Device Communication ---');
    const deviceSuccess = await testDeviceCommunication();
    
    console.log('\n--- Sync Workflows ---');
    const syncSuccess = await testSyncWorkflows();
    
    if (deviceSuccess && syncSuccess) {
      console.log('\n✅ Integration tests completed\n');
      totalPassed++;
    } else {
      console.log('\n❌ Some integration tests failed\n');
      totalFailed++;
    }
  } catch (error) {
    console.log('\n❌ Integration tests failed\n');
    totalFailed++;
  }
  
  // Run end-to-end tests
  console.log('=== END-TO-END TESTS ===\n');
  try {
    const { default: testWebApp } = await import('./e2e/web-app.test.js');
    const e2eSuccess = await testWebApp();
    
    if (e2eSuccess) {
      console.log('\n✅ End-to-end tests completed\n');
      totalPassed++;
    } else {
      console.log('\n❌ End-to-end tests failed\n');
      totalFailed++;
    }
  } catch (error) {
    console.log('\n❌ End-to-end tests failed\n');
    totalFailed++;
  }
  
  // Final summary
  console.log('==============================');
  console.log('📊 FINAL TEST SUMMARY');
  console.log('==============================');
  console.log(`✅ Test Suites Passed: ${totalPassed}`);
  console.log(`❌ Test Suites Failed: ${totalFailed}`);
  console.log(`📈 Total Test Suites:  ${totalPassed + totalFailed}`);
  
  if (totalFailed === 0) {
    console.log('\n🎉 ALL TEST SUITES PASSED!');
    console.log('\nThe Timex Datalink Web Client implementation is working correctly:');
    console.log('• All protocol components generate byte-for-byte compatible output');
    console.log('• Device communication workflows function properly');
    console.log('• Web application UI components render and behave correctly');
    console.log('• Error handling and validation work as expected');
    console.log('\nThe comprehensive testing suite provides confidence in the implementation.');
    process.exit(0);
  } else {
    console.log(`\n💥 ${totalFailed} test suite(s) failed.`);
    console.log('\nPlease review the failures above and fix any issues before deployment.');
    process.exit(1);
  }
};

// Run all test suites
runAllTestSuites().catch(error => {
  console.error('Fatal error running test suites:', error);
  process.exit(1);
});