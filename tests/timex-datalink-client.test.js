/**
 * Tests for TimexDatalinkClient class
 * Verifies the main client functionality including constructor, packet compilation, and write method
 */

import { TimexDatalinkClient } from '../lib/timex-datalink-client.js';
import { SerialAdapter } from '../lib/serial-adapter.js';

// Mock model for testing
class MockModel {
    constructor(packets = [[1, 2, 3]]) {
        this.testPackets = packets;
    }
    
    packets() {
        return this.testPackets;
    }
}

// Mock SerialAdapter for testing
class MockSerialAdapter {
    constructor() {
        this.connected = false;
        this.writtenPackets = [];
        this.config = {
            byteSleep: 25,
            packetSleep: 250,
            verbose: false
        };
    }
    
    isPortConnected() {
        return this.connected;
    }
    
    updateConfig(config) {
        Object.assign(this.config, config);
    }
    
    getConfig() {
        return { ...this.config };
    }
    
    async write(packets) {
        if (!this.connected) {
            throw new Error('Not connected');
        }
        this.writtenPackets = packets;
    }
    
    async read(timeout = 5000) {
        if (!this.connected) {
            throw new Error('Not connected');
        }
        return [1, 2, 3, 4, 5]; // Default mock data
    }
    
    async readBytes(expectedBytes, timeout = 5000) {
        if (!this.connected) {
            throw new Error('Not connected');
        }
        return [1, 2, 3, 4, 5].slice(0, expectedBytes);
    }
    
    async writeWithRetry(packets, maxRetries = 2) {
        return await this.write(packets);
    }
    
    async readWithRetry(timeout = 5000, maxRetries = 2) {
        return await this.read(timeout);
    }
    
    async connect() {
        this.connected = true;
    }
    
    async disconnect() {
        this.connected = false;
    }
}

// Test runner
function runTests() {
    console.log('Running TimexDatalinkClient tests...\n');
    
    let passed = 0;
    let failed = 0;
    
    function test(name, testFn) {
        try {
            testFn();
            console.log(`✓ ${name}`);
            passed++;
        } catch (error) {
            console.error(`✗ ${name}: ${error.message}`);
            failed++;
        }
    }
    
    function assertEqual(actual, expected, message = '') {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}. ${message}`);
        }
    }
    
    function assertTrue(condition, message = '') {
        if (!condition) {
            throw new Error(`Expected true, got false. ${message}`);
        }
    }
    
    function assertFalse(condition, message = '') {
        if (condition) {
            throw new Error(`Expected false, got true. ${message}`);
        }
    }
    
    // Constructor tests
    test('Constructor with default options', () => {
        const client = new TimexDatalinkClient();
        assertEqual(client.models, []);
        assertEqual(client.byteSleep, 25);
        assertEqual(client.packetSleep, 250);
        assertFalse(client.verbose);
        assertEqual(client.serialAdapter, null);
    });
    
    test('Constructor with custom options', () => {
        const mockAdapter = new MockSerialAdapter();
        const models = [new MockModel()];
        
        const client = new TimexDatalinkClient({
            serialDevice: mockAdapter,
            models: models,
            byteSleep: 50,
            packetSleep: 500,
            verbose: true
        });
        
        assertEqual(client.models, models);
        assertEqual(client.byteSleep, 50);
        assertEqual(client.packetSleep, 500);
        assertTrue(client.verbose);
        assertEqual(client.serialAdapter, mockAdapter);
    });
    
    test('Constructor with raw serial port creates SerialAdapter', () => {
        const mockPort = { 
            type: 'mock-port',
            open: async () => {},  // Mock Web Serial API port
            close: async () => {},
            getInfo: () => ({})
        };
        const client = new TimexDatalinkClient({
            serialDevice: mockPort,
            byteSleep: 30,
            verbose: true
        });
        
        assertTrue(client.serialAdapter instanceof SerialAdapter);
        assertEqual(client.byteSleep, 30);
        assertTrue(client.verbose);
    });
    
    // Model management tests
    test('addModel adds model correctly', () => {
        const client = new TimexDatalinkClient();
        const model = new MockModel();
        
        client.addModel(model);
        assertEqual(client.models.length, 1);
        assertEqual(client.models[0], model);
    });
    
    test('addModel throws error for invalid model', () => {
        const client = new TimexDatalinkClient();
        
        try {
            client.addModel(null);
            throw new Error('Should have thrown');
        } catch (error) {
            assertTrue(error.message.includes('Cannot add null'));
        }
        
        try {
            client.addModel({});
            throw new Error('Should have thrown');
        } catch (error) {
            assertTrue(error.message.includes('packets() method'));
        }
    });
    
    test('addModels adds multiple models', () => {
        const client = new TimexDatalinkClient();
        const models = [new MockModel(), new MockModel()];
        
        client.addModels(models);
        assertEqual(client.models.length, 2);
    });
    
    test('removeModel removes specific model', () => {
        const client = new TimexDatalinkClient();
        const model1 = new MockModel();
        const model2 = new MockModel();
        
        client.addModel(model1);
        client.addModel(model2);
        assertEqual(client.models.length, 2);
        
        assertTrue(client.removeModel(model1));
        assertEqual(client.models.length, 1);
        assertEqual(client.models[0], model2);
        
        assertFalse(client.removeModel(model1)); // Already removed
    });
    
    test('clearModels removes all models', () => {
        const client = new TimexDatalinkClient();
        client.addModel(new MockModel());
        client.addModel(new MockModel());
        assertEqual(client.models.length, 2);
        
        client.clearModels();
        assertEqual(client.models.length, 0);
    });
    
    // Packet compilation tests
    test('packets() compiles model packets correctly', () => {
        const client = new TimexDatalinkClient();
        const model1 = new MockModel([[1, 2, 3], [4, 5, 6]]);
        const model2 = new MockModel([[7, 8, 9]]);
        
        client.addModel(model1);
        client.addModel(model2);
        
        const packets = client.packets();
        assertEqual(packets, [[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
    });
    
    test('packets() handles empty models', () => {
        const client = new TimexDatalinkClient();
        const packets = client.packets();
        assertEqual(packets, []);
    });
    
    test('packets() validates packet data', () => {
        const client = new TimexDatalinkClient();
        const invalidModel = new MockModel([['invalid']]);
        client.addModel(invalidModel);
        
        try {
            client.packets();
            throw new Error('Should have thrown');
        } catch (error) {
            assertTrue(error.message.includes('invalid'));
        }
    });
    
    // Serial adapter management tests
    test('setSerialDevice updates adapter', () => {
        const client = new TimexDatalinkClient();
        const mockAdapter = new MockSerialAdapter();
        
        client.setSerialDevice(mockAdapter);
        assertEqual(client.serialAdapter, mockAdapter);
        
        client.setSerialDevice(null);
        assertEqual(client.serialAdapter, null);
    });
    
    test('isConnected returns correct status', () => {
        const client = new TimexDatalinkClient();
        assertFalse(client.isConnected());
        
        const mockAdapter = new MockSerialAdapter();
        client.setSerialDevice(mockAdapter);
        assertFalse(client.isConnected());
        
        mockAdapter.connected = true;
        assertTrue(client.isConnected());
    });
    
    // Configuration tests
    test('updateConfig updates settings', () => {
        const client = new TimexDatalinkClient();
        
        client.updateConfig({
            byteSleep: 100,
            packetSleep: 1000,
            verbose: true
        });
        
        assertEqual(client.byteSleep, 100);
        assertEqual(client.packetSleep, 1000);
        assertTrue(client.verbose);
    });
    
    test('getConfig returns current configuration', () => {
        const client = new TimexDatalinkClient({
            byteSleep: 50,
            verbose: true
        });
        
        const config = client.getConfig();
        assertEqual(config.byteSleep, 50);
        assertTrue(config.verbose);
        assertEqual(config.modelCount, 0);
        assertFalse(config.isConnected);
    });
    
    // Validation tests
    test('validate identifies configuration issues', () => {
        const client = new TimexDatalinkClient();
        
        const validation = client.validate();
        assertFalse(validation.isValid);
        assertTrue(validation.errors.some(e => e.includes('No serial adapter')));
        assertTrue(validation.errors.some(e => e.includes('No models')));
    });
    
    test('validate passes for valid configuration', () => {
        const client = new TimexDatalinkClient();
        const mockAdapter = new MockSerialAdapter();
        mockAdapter.connected = true;
        
        client.setSerialDevice(mockAdapter);
        client.addModel(new MockModel());
        
        const validation = client.validate();
        assertTrue(validation.isValid);
        assertEqual(validation.errors.length, 0);
    });
    
    // Write operation tests
    test('write throws error without serial adapter', async () => {
        const client = new TimexDatalinkClient();
        client.addModel(new MockModel());
        
        try {
            await client.write();
            throw new Error('Should have thrown');
        } catch (error) {
            assertTrue(error.message.includes('No serial adapter'));
        }
    });
    
    test('write throws error when not connected', async () => {
        const client = new TimexDatalinkClient();
        const mockAdapter = new MockSerialAdapter();
        client.setSerialDevice(mockAdapter);
        client.addModel(new MockModel());
        
        try {
            await client.write();
            throw new Error('Should have thrown');
        } catch (error) {
            assertTrue(error.message.includes('not connected'));
        }
    });
    
    test('write succeeds with valid configuration', async () => {
        const client = new TimexDatalinkClient();
        const mockAdapter = new MockSerialAdapter();
        mockAdapter.connected = true;
        
        client.setSerialDevice(mockAdapter);
        client.addModel(new MockModel([[1, 2, 3]]));
        
        const result = await client.write();
        assertTrue(result.success);
        assertEqual(result.packetsWritten, 1);
        assertEqual(mockAdapter.writtenPackets, [[1, 2, 3]]);
    });
    
    test('write handles empty packets gracefully', async () => {
        const client = new TimexDatalinkClient();
        const mockAdapter = new MockSerialAdapter();
        mockAdapter.connected = true;
        
        client.setSerialDevice(mockAdapter);
        // No models added
        
        const result = await client.write();
        assertTrue(result.success);
        assertEqual(result.packetsWritten, 0);
        assertTrue(result.message.includes('No packets'));
    });
    
    // Bidirectional sync tests
    test('read throws error without serial adapter', async () => {
        const client = new TimexDatalinkClient();
        
        try {
            await client.read();
            throw new Error('Should have thrown');
        } catch (error) {
            assertTrue(error.message.includes('No serial adapter'));
        }
    });
    
    test('read throws error when not connected', async () => {
        const client = new TimexDatalinkClient();
        const mockAdapter = new MockSerialAdapter();
        client.setSerialDevice(mockAdapter);
        
        try {
            await client.read();
            throw new Error('Should have thrown');
        } catch (error) {
            assertTrue(error.message.includes('not connected'));
        }
    });
    
    test('read succeeds with valid configuration', async () => {
        const client = new TimexDatalinkClient();
        const mockAdapter = new MockSerialAdapter();
        mockAdapter.connected = true;
        mockAdapter.read = async () => [1, 2, 3, 4, 5];
        
        client.setSerialDevice(mockAdapter);
        
        const result = await client.read();
        assertTrue(result.success);
        assertEqual(result.data, [1, 2, 3, 4, 5]);
        assertEqual(result.bytesRead, 5);
    });
    
    test('readBytes reads specific number of bytes', async () => {
        const client = new TimexDatalinkClient();
        const mockAdapter = new MockSerialAdapter();
        mockAdapter.connected = true;
        mockAdapter.readBytes = async (expectedBytes) => [1, 2, 3].slice(0, expectedBytes);
        
        client.setSerialDevice(mockAdapter);
        
        const result = await client.readBytes(2);
        assertTrue(result.success);
        assertEqual(result.data, [1, 2]);
        assertEqual(result.bytesRead, 2);
        assertEqual(result.expectedBytes, 2);
        assertTrue(result.complete);
    });
    
    test('sync performs bidirectional communication', async () => {
        const client = new TimexDatalinkClient();
        const mockAdapter = new MockSerialAdapter();
        mockAdapter.connected = true;
        mockAdapter.writeWithRetry = async (packets) => { mockAdapter.writtenPackets = packets; };
        mockAdapter.readWithRetry = async () => [1, 2, 3, 4, 5];
        
        client.setSerialDevice(mockAdapter);
        client.addModel(new MockModel([[1, 2, 3]]));
        
        const result = await client.sync({
            writeData: true,
            readData: true,
            expectedReadBytes: 5
        });
        
        assertTrue(result.success);
        assertTrue(result.writeResult.success);
        assertTrue(result.readResult.success);
        assertEqual(result.conflicts.length, 0);
    });
    
    test('getSyncStatus returns comprehensive status', () => {
        const client = new TimexDatalinkClient();
        const mockAdapter = new MockSerialAdapter();
        mockAdapter.connected = true;
        
        client.setSerialDevice(mockAdapter);
        client.addModel(new MockModel());
        
        const status = client.getSyncStatus();
        assertTrue(status.clientReady);
        assertTrue(status.deviceConnected);
        assertTrue(status.modelsConfigured);
        assertTrue(status.canWrite);
        assertTrue(status.canRead);
        assertEqual(status.modelCount, 1);
    });
    
    test('detectSyncConflicts identifies issues', () => {
        const client = new TimexDatalinkClient();
        
        const writeResult = { packetsWritten: 1 };
        const readResult = { bytesRead: 0, expectedBytes: 5, complete: false };
        
        const conflicts = client.detectSyncConflicts(writeResult, readResult);
        assertTrue(conflicts.length > 0);
        assertTrue(conflicts.some(c => c.type === 'no-response'));
    });
    
    // Summary
    console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('✓ All tests passed!');
        return true;
    } else {
        console.log('✗ Some tests failed!');
        return false;
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests();
}

export { runTests };