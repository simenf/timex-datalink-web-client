/**
 * End-to-end test runner
 * 
 * Runs all end-to-end tests for the web application.
 */

import testWebApp from './e2e/web-app.test.js';

console.log('🧪 Running End-to-End Tests\n');
console.log('===========================\n');

const runAllE2ETests = async () => {
  const tests = [
    { name: 'Web Application', test: testWebApp }
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
  
  console.log('\n===========================');
  console.log('📊 End-to-End Test Summary');
  console.log('===========================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total:  ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All end-to-end tests passed!');
    process.exit(0);
  } else {
    console.log(`\n💥 ${failed} end-to-end test suite(s) failed.`);
    process.exit(1);
  }
};

// Run the tests
runAllE2ETests().catch(error => {
  console.error('Fatal error running end-to-end tests:', error);
  process.exit(1);
});