/**
 * Tests for Data Validation Framework
 * Verifies compatibility with ActiveModel validation patterns
 */

import { DataValidator, ValidationError, range } from '../../lib/helpers/data-validator.js';

function runTests() {
  console.log('Running Data Validator tests...\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Basic inclusion validation
  console.log('Test 1: Basic inclusion validation');
  try {
    const validator = new DataValidator();
    validator.validateInclusion('zone', {
      in: range(1, 2),
      message: '%{value} is invalid!  Valid zones are 1..2.'
    });

    // Valid case
    validator.validate({ zone: 1 });
    validator.validate({ zone: 2 });
    console.log('✅ Valid values passed');

    // Invalid case
    try {
      validator.validate({ zone: 0 });
      console.log('❌ Should have thrown validation error');
      failed++;
    } catch (error) {
      if (error instanceof ValidationError && error.message.includes('0 is invalid!  Valid zones are 1..2.')) {
        console.log('✅ Invalid value correctly rejected');
        passed++;
      } else {
        console.log(`❌ Wrong error message: ${error.message}`);
        failed++;
      }
    }
  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
    failed++;
  }

  // Test 2: Array inclusion validation
  console.log('\nTest 2: Array inclusion validation');
  try {
    const validator = new DataValidator();
    validator.validateInclusion('priority', {
      in: [1, 2, 3, 4, 5],
      allowNull: true,
      message: 'Priority %{value} is invalid!  Valid priorities are 1..5 or nil.'
    });

    // Valid cases
    validator.validate({ priority: 3 });
    validator.validate({ priority: null });
    validator.validate({ priority: undefined });
    console.log('✅ Valid values and null passed');

    // Invalid case
    try {
      validator.validate({ priority: 0 });
      console.log('❌ Should have thrown validation error');
      failed++;
    } catch (error) {
      if (error instanceof ValidationError && error.message.includes('Priority 0 is invalid!')) {
        console.log('✅ Invalid priority correctly rejected');
        passed++;
      } else {
        console.log(`❌ Wrong error message: ${error.message}`);
        failed++;
      }
    }
  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
    failed++;
  }

  // Test 3: Conditional validation
  console.log('\nTest 3: Conditional validation');
  try {
    const validator = new DataValidator();
    validator.validateInclusion('day', {
      in: range(1, 31),
      if: (obj) => obj.month === null,
      message: 'Day %{value} is invalid!  Valid days are 1..31 and nil.'
    });

    // Should validate when month is null
    validator.validate({ day: 15, month: null });
    console.log('✅ Conditional validation when condition is true');

    // Should not validate when month is not null
    validator.validate({ day: 50, month: 5 }); // This should pass because condition is false
    console.log('✅ Conditional validation skipped when condition is false');
    passed++;
  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
    failed++;
  }

  // Test 4: Function-based valid values
  console.log('\nTest 4: Function-based valid values');
  try {
    const VALID_DAYS_IN_MONTH = {
      1: range(1, 31), 2: range(1, 29), 3: range(1, 31), 4: range(1, 30),
      5: range(1, 31), 6: range(1, 30), 7: range(1, 31), 8: range(1, 31),
      9: range(1, 30), 10: range(1, 31), 11: range(1, 30), 12: range(1, 31)
    };

    const validator = new DataValidator();
    validator.validateInclusion('day', {
      in: (obj) => VALID_DAYS_IN_MONTH[obj.month],
      if: (obj) => obj.day && obj.month,
      message: 'Day %{value} is invalid for month %{month}!'
    });

    // Valid case
    validator.validate({ day: 15, month: 2 });
    console.log('✅ Function-based validation passed for valid day');

    // Invalid case - February 30th
    try {
      validator.validate({ day: 30, month: 2 });
      console.log('❌ Should have thrown validation error for Feb 30th');
      failed++;
    } catch (error) {
      if (error instanceof ValidationError) {
        console.log('✅ Function-based validation correctly rejected Feb 30th');
        passed++;
      } else {
        console.log(`❌ Wrong error type: ${error.constructor.name}`);
        failed++;
      }
    }
  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
    failed++;
  }

  // Test 5: Comparison validation
  console.log('\nTest 5: Comparison validation');
  try {
    const validator = new DataValidator();
    validator.validateComparison('time', {
      greaterThanOrEqualTo: 'deviceTime',
      message: '%{value} must be greater or equal to device time!'
    });

    // Valid case
    const now = new Date();
    const future = new Date(now.getTime() + 1000);
    validator.validate({ time: future, deviceTime: now });
    console.log('✅ Comparison validation passed for future time');

    // Invalid case
    try {
      const past = new Date(now.getTime() - 1000);
      validator.validate({ time: past, deviceTime: now });
      console.log('❌ Should have thrown validation error for past time');
      failed++;
    } catch (error) {
      if (error instanceof ValidationError && error.message.includes('must be greater or equal to device time')) {
        console.log('✅ Comparison validation correctly rejected past time');
        passed++;
      } else {
        console.log(`❌ Wrong error message: ${error.message}`);
        failed++;
      }
    }
  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
    failed++;
  }

  // Test 6: Multiple validations
  console.log('\nTest 6: Multiple validations');
  try {
    const validator = new DataValidator();
    validator.validateInclusion('zone', {
      in: range(1, 2),
      message: 'Zone %{value} is invalid!  Valid zones are 1..2.'
    });
    validator.validateInclusion('number', {
      in: range(1, 5),
      message: 'Number value %{value} is invalid!  Valid number values are 1..5.'
    });

    // Valid case
    validator.validate({ zone: 1, number: 3 });
    console.log('✅ Multiple validations passed');

    // Invalid case - multiple errors
    try {
      validator.validate({ zone: 0, number: 6 });
      console.log('❌ Should have thrown validation error');
      failed++;
    } catch (error) {
      if (error instanceof ValidationError && 
          error.message.includes('Zone 0 is invalid') && 
          error.message.includes('Number value 6 is invalid')) {
        console.log('✅ Multiple validation errors correctly combined');
        passed++;
      } else {
        console.log(`❌ Wrong error message: ${error.message}`);
        failed++;
      }
    }
  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
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