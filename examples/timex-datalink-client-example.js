/**
 * TimexDatalinkClient Usage Example
 * 
 * This example demonstrates how to use the TimexDatalinkClient class
 * for both writing data to and reading data from a Timex Datalink device.
 */

import { TimexDatalinkClient } from '../lib/timex-datalink-client.js';
import { SerialAdapter } from '../lib/serial-adapter.js';
import Start from '../lib/protocol3/start.js';
import Sync from '../lib/protocol3/sync.js';
import Time from '../lib/protocol3/time.js';
import End from '../lib/protocol3/end.js';

// Example: Basic write operation
async function basicWriteExample() {
    console.log('\n=== Basic Write Example ===');
    
    try {
        // Create client without device (for demonstration)
        const client = new TimexDatalinkClient({
            verbose: true,
            byteSleep: 25,
            packetSleep: 250
        });
        
        // Add Protocol 3 models for a complete sync sequence
        client.addModel(new Start());
        client.addModel(new Sync({ length: 300 }));
        client.addModel(new Time({
            zone: 1,
            is24h: false,
            dateFormat: "%_m-%d-%y",
            time: new Date(),
            name: "EST"
        }));
        client.addModel(new End());
        
        // Show compiled packets (without actually writing)
        const packets = client.packets();
        console.log(`Compiled ${packets.length} packets for transmission`);
        
        // Show configuration
        console.log('Client configuration:', client.getConfig());
        
        // Show sync status
        console.log('Sync status:', client.getSyncStatus());
        
    } catch (error) {
        console.error('Basic write example failed:', error.message);
    }
}

// Example: Device discovery and connection
async function deviceConnectionExample() {
    console.log('\n=== Device Connection Example ===');
    
    try {
        // Check if Web Serial API is supported
        if (!SerialAdapter.isSupported()) {
            console.log('Web Serial API is not supported in this environment');
            return;
        }
        
        console.log('Web Serial API is supported');
        
        // In a real browser environment, you would:
        // 1. Request device access from user
        // const adapter = await SerialAdapter.requestDevice();
        
        // 2. Or discover previously authorized devices
        // const adapters = await SerialAdapter.getDevices();
        
        // 3. Create client with the adapter
        // const client = new TimexDatalinkClient({
        //     serialDevice: adapter,
        //     verbose: true
        // });
        
        // 4. Connect to device
        // await client.connect();
        
        // 5. Add models and perform sync
        // client.addModel(new Start());
        // await client.write();
        
        console.log('Device connection example completed (simulated)');
        
    } catch (error) {
        console.error('Device connection example failed:', error.message);
    }
}

// Example: Bidirectional sync with conflict resolution
async function bidirectionalSyncExample() {
    console.log('\n=== Bidirectional Sync Example ===');
    
    try {
        // Create mock adapter for demonstration
        class MockAdapter {
            constructor() {
                this.connected = true;
            }
            
            isPortConnected() { return this.connected; }
            updateConfig() {}
            getConfig() { return { verbose: true }; }
            
            async write(packets) {
                console.log(`Mock: Writing ${packets.length} packets`);
            }
            
            async writeWithRetry(packets) {
                return await this.write(packets);
            }
            
            async read() {
                // Simulate device response
                return [0x01, 0x02, 0x03, 0x04, 0x05];
            }
            
            async readWithRetry() {
                return await this.read();
            }
        }
        
        const client = new TimexDatalinkClient({
            serialDevice: new MockAdapter(),
            verbose: true
        });
        
        // Add a simple model
        client.addModel(new Start());
        
        // Perform bidirectional sync
        const syncResult = await client.sync({
            writeData: true,
            readData: true,
            expectedReadBytes: 5,
            conflictResolution: 'client-wins'
        });
        
        console.log('Sync completed successfully:', {
            success: syncResult.success,
            duration: syncResult.duration + 'ms',
            conflicts: syncResult.conflicts.length,
            writeSuccess: syncResult.writeResult?.success,
            readSuccess: syncResult.readResult?.success
        });
        
    } catch (error) {
        console.error('Bidirectional sync example failed:', error.message);
    }
}

// Example: Error handling and validation
async function errorHandlingExample() {
    console.log('\n=== Error Handling Example ===');
    
    try {
        // Create client with invalid configuration
        const client = new TimexDatalinkClient();
        
        // Validate configuration
        const validation = client.validate();
        console.log('Validation result:', validation);
        
        if (!validation.isValid) {
            console.log('Configuration errors found:');
            validation.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }
        
        // Try to write without proper setup
        try {
            await client.write();
        } catch (error) {
            console.log('Expected error caught:', error.message);
        }
        
        // Show how to fix the configuration
        console.log('\nFixing configuration...');
        
        // Add mock adapter
        client.setSerialDevice({
            isPortConnected: () => true,
            updateConfig: () => {},
            write: async () => {}
        });
        
        // Add model
        client.addModel(new Start());
        
        // Validate again
        const newValidation = client.validate();
        console.log('New validation result:', newValidation);
        
    } catch (error) {
        console.error('Error handling example failed:', error.message);
    }
}

// Run all examples
async function runExamples() {
    console.log('TimexDatalinkClient Examples');
    console.log('============================');
    
    await basicWriteExample();
    await deviceConnectionExample();
    await bidirectionalSyncExample();
    await errorHandlingExample();
    
    console.log('\n=== Examples Complete ===');
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runExamples().catch(console.error);
}

export { runExamples };