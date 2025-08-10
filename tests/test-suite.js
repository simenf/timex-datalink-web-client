/**
 * Comprehensive test suite for the Timex Datalink Client
 * Includes unit tests for all components and integration tests
 */

import { TimexDatalinkClient } from '../lib/timex-datalink-client.js';
import { SerialAdapter } from '../lib/serial-adapter.js';
import { runTests as runCrcTests } from './helpers/crc-packets-wrapper.test.js';
import { runTests as runCharacterEncodersTests } from './helpers/character-encoders.test.js';
import { runTests as runDataValidatorTests } from './helpers/data-validator.test.js';

// Protocol 3 component tests
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

// Simple test framework
class TestFramework {
    constructor() {
        this.results = {};
    }
    
    suite(name, testFn) {
        this.results[name] = [];
        this.currentSuite = name;
        testFn();
    }
    
    test(name, testFn) {
        try {
            testFn();
            this.results[this.currentSuite].push({
                name,
                passed: true,
                error: null
            });
        } catch (error) {
            this.results[this.currentSuite].push({
                name,
                passed: false,
                error: error.message
            });
        }
    }
    
    assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message} Expected: ${expected}, Actual: ${actual}`);
        }
    }
    
    assertTrue(value, message = '') {
        if (!value) {
            throw new Error(`${message} Expected truthy value, got: ${value}`);
        }
    }
    
    assertFalse(value, message = '') {
        if (value) {
            throw new Error(`${message} Expected falsy value, got: ${value}`);
        }
    }
    
    assertThrows(fn, message = '') {
        try {
            fn();
            throw new Error(`${message} Expected function to throw, but it didn't`);
        } catch (error) {
            // Expected behavior
        }
    }
}

// Test suites
export async function runAllTests() {
    console.log('🧪 Running Comprehensive Test Suite\n');
    console.log('===================================\n');
    
    const framework = new TestFramework();
    let totalPassed = 0;
    let totalFailed = 0;
    
    // Helper component tests
    console.log('--- Helper Components ---');
    
    const helperTests = [
        { name: 'CRC Packets Wrapper', test: runCrcTests },
        { name: 'Character Encoders', test: runCharacterEncodersTests },
        { name: 'Data Validator', test: runDataValidatorTests }
    ];
    
    for (const { name, test } of helperTests) {
        try {
            console.log(`\nTesting ${name}...`);
            const success = test();
            if (success) {
                console.log(`✅ ${name} - All tests passed`);
                totalPassed++;
            } else {
                console.log(`❌ ${name} - Some tests failed`);
                totalFailed++;
            }
        } catch (error) {
            console.log(`❌ ${name} - Tests failed: ${error.message}`);
            totalFailed++;
        }
    }
    
    // Protocol 3 component tests
    console.log('\n--- Protocol 3 Components ---');
    
    const protocol3Tests = [
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
    
    for (const { name, test } of protocol3Tests) {
        try {
            console.log(`\nTesting ${name}...`);
            test();
            console.log(`✅ ${name} - All tests passed`);
            totalPassed++;
        } catch (error) {
            console.log(`❌ ${name} - Tests failed: ${error.message}`);
            totalFailed++;
        }
    }
    
    // Core library tests
    console.log('\n--- Core Library Components ---');
    
    // TimexDatalinkClient tests
    framework.suite('TimexDatalinkClient', () => {
        framework.test('constructor with default options', () => {
            const client = new TimexDatalinkClient();
            
            framework.assertEqual(client.serialAdapter, null);
            framework.assertEqual(client.models.length, 0);
            framework.assertEqual(client.byteSleep, 25);
            framework.assertEqual(client.packetSleep, 250);
            framework.assertFalse(client.verbose);
        });
        
        framework.test('constructor with custom options', () => {
            const mockAdapter = { mock: true };
            const client = new TimexDatalinkClient({
                serialAdapter: mockAdapter,
                models: [{ test: true }],
                byteSleep: 50,
                packetSleep: 500,
                verbose: true
            });
            
            framework.assertEqual(client.serialAdapter, mockAdapter);
            framework.assertEqual(client.models.length, 1);
            framework.assertEqual(client.byteSleep, 50);
            framework.assertEqual(client.packetSleep, 500);
            framework.assertTrue(client.verbose);
        });
        
        framework.test('packets() with no models', () => {
            const client = new TimexDatalinkClient();
            const packets = client.packets();
            
            framework.assertTrue(Array.isArray(packets));
            framework.assertEqual(packets.length, 0);
        });
        
        framework.test('packets() with mock models', () => {
            const mockModel = {
                packets: () => [[1, 2, 3], [4, 5, 6]]
            };
            
            const client = new TimexDatalinkClient({
                models: [mockModel]
            });
            
            const packets = client.packets();
            framework.assertEqual(packets.length, 2);
            framework.assertEqual(packets[0][0], 1);
            framework.assertEqual(packets[1][0], 4);
        });
        
        framework.test('addModel() adds model to collection', () => {
            const client = new TimexDatalinkClient();
            const mockModel = { test: true };
            
            client.addModel(mockModel);
            framework.assertEqual(client.models.length, 1);
            framework.assertEqual(client.models[0], mockModel);
        });
        
        framework.test('clearModels() removes all models', () => {
            const client = new TimexDatalinkClient({
                models: [{ test: 1 }, { test: 2 }]
            });
            
            framework.assertEqual(client.models.length, 2);
            client.clearModels();
            framework.assertEqual(client.models.length, 0);
        });
        
        framework.test('getConfig() returns current configuration', () => {
            const client = new TimexDatalinkClient({
                byteSleep: 100,
                verbose: true
            });
            
            const config = client.getConfig();
            framework.assertEqual(config.byteSleep, 100);
            framework.assertTrue(config.verbose);
            framework.assertFalse(config.hasSerialAdapter);
        });
    });
    
    // SerialAdapter tests
    framework.suite('SerialAdapter', () => {
        framework.test('constructor with default options', () => {
            const adapter = new SerialAdapter();
            
            framework.assertEqual(adapter.port, null);
            framework.assertEqual(adapter.byteSleep, 25);
            framework.assertEqual(adapter.packetSleep, 250);
            framework.assertFalse(adapter.verbose);
            framework.assertFalse(adapter.isConnected);
        });
        
        framework.test('constructor with custom options', () => {
            const mockPort = { mock: true };
            const adapter = new SerialAdapter({
                port: mockPort,
                byteSleep: 50,
                packetSleep: 500,
                verbose: true
            });
            
            framework.assertEqual(adapter.port, mockPort);
            framework.assertEqual(adapter.byteSleep, 50);
            framework.assertEqual(adapter.packetSleep, 500);
            framework.assertTrue(adapter.verbose);
        });
        
        framework.test('isPortConnected() returns false when not connected', () => {
            const adapter = new SerialAdapter();
            framework.assertFalse(adapter.isPortConnected());
        });
        
        framework.test('getConfig() returns current configuration', () => {
            const adapter = new SerialAdapter({
                byteSleep: 100,
                verbose: true
            });
            
            const config = adapter.getConfig();
            framework.assertEqual(config.byteSleep, 100);
            framework.assertTrue(config.verbose);
            framework.assertFalse(config.isConnected);
        });
        
        framework.test('sleep() utility function', async () => {
            const adapter = new SerialAdapter();
            const start = Date.now();
            
            await adapter.sleep(50);
            const elapsed = Date.now() - start;
            
            // Allow some tolerance for timing
            framework.assertTrue(elapsed >= 45 && elapsed <= 100);
        });
    });
    
    // Process framework test results
    for (const [suiteName, tests] of Object.entries(framework.results)) {
        console.log(`\nTesting ${suiteName}...`);
        const passed = tests.filter(t => t.passed).length;
        const failed = tests.filter(t => !t.passed).length;
        
        if (failed === 0) {
            console.log(`✅ ${suiteName} - All ${passed} tests passed`);
            totalPassed++;
        } else {
            console.log(`❌ ${suiteName} - ${failed} of ${tests.length} tests failed`);
            tests.filter(t => !t.passed).forEach(t => {
                console.log(`  - ${t.name}: ${t.error}`);
            });
            totalFailed++;
        }
    }
    
    // Final summary
    console.log('\n===================================');
    console.log('📊 Final Test Summary');
    console.log('===================================');
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`📈 Total:  ${totalPassed + totalFailed}`);
    
    if (totalFailed === 0) {
        console.log('\n🎉 All tests passed! The implementation is working correctly.');
    } else {
        console.log(`\n💥 ${totalFailed} test suite(s) failed. Please review the failures above.`);
    }
    
    return framework.results;
}