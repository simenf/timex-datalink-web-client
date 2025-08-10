// Test suite for SerialAdapter
// Note: These tests require manual interaction for device selection

import { SerialAdapter } from '../lib/serial-adapter.js';

// Mock Web Serial API for automated testing
class MockSerialPort {
    constructor() {
        this.isOpen = false;
        this.readCount = 0;
        this.maxReads = 3; // Limit reads to prevent infinite loop
        
        this.writable = {
            getWriter: () => ({
                write: async (data) => {
                    console.log('Mock write:', Array.from(data));
                },
                releaseLock: () => {}
            })
        };
        this.readable = {
            getReader: () => ({
                read: async () => {
                    this.readCount++;
                    if (this.readCount <= this.maxReads) {
                        return { value: new Uint8Array([0x01, 0x02]), done: false };
                    } else {
                        return { value: null, done: true };
                    }
                },
                releaseLock: () => {}
            })
        };
    }
    
    async open(options) {
        this.isOpen = true;
        this.readCount = 0; // Reset read count on open
        console.log('Mock port opened with options:', options);
    }
    
    async close() {
        this.isOpen = false;
        console.log('Mock port closed');
    }
    
    getInfo() {
        return { usbVendorId: 0x1234, usbProductId: 0x5678 };
    }
}

// Test basic SerialAdapter functionality
export async function testSerialAdapter() {
    console.log('Testing SerialAdapter...');
    
    // Test 1: Constructor
    const adapter = new SerialAdapter({
        port: new MockSerialPort(),
        byteSleep: 10,
        packetSleep: 100,
        verbose: true
    });
    
    console.log('✓ Constructor works');
    
    // Test 2: Configuration
    const config = adapter.getConfig();
    console.log('Configuration:', config);
    console.log('✓ Configuration retrieval works');
    
    // Test 3: Connection
    try {
        await adapter.connect();
        console.log('✓ Connection works');
    } catch (error) {
        console.error('✗ Connection failed:', error.message);
        return false;
    }
    
    // Test 4: Write operation
    try {
        const testPackets = [
            [0x20, 0x00, 0x00, 0x03],
            [0x78, 0x55, 0xAA]
        ];
        await adapter.write(testPackets);
        console.log('✓ Write operation works');
    } catch (error) {
        console.error('✗ Write failed:', error.message);
        return false;
    }
    
    // Test 5: Read operation
    try {
        const data = await adapter.read(1000);
        console.log('Read data:', data);
        console.log('✓ Read operation works');
    } catch (error) {
        console.error('✗ Read failed:', error.message);
        return false;
    }
    
    // Test 6: Sync operation
    try {
        const result = await adapter.sync(
            [[0x20, 0x00, 0x00, 0x03]], 
            4, 
            { readTimeout: 1000 }
        );
        console.log('Sync result:', result);
        console.log('✓ Sync operation works');
    } catch (error) {
        console.error('✗ Sync failed:', error.message);
        return false;
    }
    
    // Test 7: Disconnect
    try {
        await adapter.disconnect();
        console.log('✓ Disconnect works');
    } catch (error) {
        console.error('✗ Disconnect failed:', error.message);
        return false;
    }
    
    console.log('All SerialAdapter tests passed!');
    return true;
}

// Test Web Serial API support detection
export function testWebSerialSupport() {
    console.log('Testing Web Serial API support...');
    
    const isSupported = SerialAdapter.isSupported();
    console.log('Web Serial API supported:', isSupported);
    
    if (!isSupported) {
        console.log('Note: Web Serial API is not supported in this browser');
        console.log('Supported browsers: Chrome 89+, Edge 89+');
        console.log('Firefox: Available behind experimental flag');
        console.log('Safari: Not supported');
    }
    
    return isSupported;
}

// Manual test for device discovery (requires user interaction)
export async function testDeviceDiscovery() {
    console.log('Testing device discovery...');
    
    if (!SerialAdapter.isSupported()) {
        console.log('Web Serial API not supported, skipping device discovery test');
        return false;
    }
    
    try {
        console.log('Note: This test requires user interaction to select a device');
        
        // Test getting existing devices
        const existingDevices = await SerialAdapter.getDevices();
        console.log(`Found ${existingDevices.length} previously authorized devices`);
        
        // Uncomment the following lines to test device request (requires user interaction)
        /*
        console.log('Requesting device selection from user...');
        const adapter = await SerialAdapter.requestDevice();
        console.log('Device selected successfully');
        
        const info = await adapter.getPortInfo();
        console.log('Device info:', info);
        */
        
        console.log('✓ Device discovery test completed');
        return true;
        
    } catch (error) {
        console.error('✗ Device discovery failed:', error.message);
        return false;
    }
}

// Run all tests
export async function runAllTests() {
    console.log('=== SerialAdapter Test Suite ===');
    
    const supportTest = testWebSerialSupport();
    const adapterTest = await testSerialAdapter();
    const discoveryTest = await testDeviceDiscovery();
    
    console.log('\n=== Test Results ===');
    console.log('Web Serial Support:', supportTest ? '✓' : '✗');
    console.log('SerialAdapter Functionality:', adapterTest ? '✓' : '✗');
    console.log('Device Discovery:', discoveryTest ? '✓' : '✗');
    
    return supportTest && adapterTest && discoveryTest;
}

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined') {
    window.testSerialAdapter = {
        runAllTests,
        testSerialAdapter,
        testWebSerialSupport,
        testDeviceDiscovery
    };
}