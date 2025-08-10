/**
 * Protocol Abstraction Framework Example
 * 
 * Demonstrates how to use the new protocol abstraction framework
 * for multi-protocol support and device detection.
 */

import { TimexDatalinkClient } from '../lib/timex-datalink-client.js';
import { SerialAdapter } from '../lib/serial-adapter.js';
import { protocolManager } from '../lib/protocol-manager.js';
import { ProtocolFactory } from '../lib/protocol-factory.js';

// Example 1: Basic Protocol Detection and Usage
async function basicProtocolExample() {
    console.log('=== Basic Protocol Detection Example ===');
    
    // Create client without specifying protocol
    const client = new TimexDatalinkClient({
        verbose: true
    });
    
    // Get available protocols
    const availableProtocols = client.getAvailableProtocols();
    console.log('Available protocols:', availableProtocols.map(p => `${p.name} (v${p.version})`));
    
    // Simulate device connection (in real usage, this would be actual Web Serial)
    const mockSerialPort = {
        open: () => Promise.resolve(),
        close: () => Promise.resolve(),
        readable: { getReader: () => ({}) },
        writable: { getWriter: () => ({}) }
    };
    
    const serialAdapter = new SerialAdapter({
        port: mockSerialPort,
        verbose: true
    });
    
    client.setSerialDevice(serialAdapter);
    
    // Example device info (would come from actual device detection)
    const deviceInfo = {
        model: 'Timex Datalink 150',
        identifier: 'Timex Datalink USB Device'
    };
    
    // Detect protocol
    try {
        const detectedProtocol = await client.detectProtocol(deviceInfo);
        if (detectedProtocol) {
            console.log(`Detected protocol: ${detectedProtocol.NAME}`);
            console.log('Protocol capabilities:', detectedProtocol.CAPABILITIES);
        }
    } catch (error) {
        console.log('Protocol detection failed (expected in mock environment)');
        
        // Fallback: set protocol manually
        client.setProtocol(3, deviceInfo);
        console.log('Set Protocol 3 manually');
    }
    
    // Get protocol recommendations
    const recommendations = client.getProtocolRecommendations();
    console.log('Protocol recommendations:');
    recommendations.forEach(rec => {
        console.log(`  - ${rec.name}: ${rec.confidence}% confidence`);
        console.log(`    Reasons: ${rec.reasons.join(', ')}`);
    });
}

// Example 2: Creating Protocol-Specific Components
async function protocolComponentExample() {
    console.log('\n=== Protocol Component Creation Example ===');
    
    // Create Protocol 3 instance
    const protocol3 = ProtocolFactory.createProtocol(3);
    console.log('Created Protocol 3 instance');
    console.log('Available components:', protocol3.getAvailableComponents());
    
    // Create specific components
    const startComponent = protocol3.createComponent('Start');
    const timeComponent = protocol3.createComponent('Time', {
        zone: 1,
        is24h: false,
        dateFormat: "%_m-%d-%y",
        time: new Date(),
        name: 'EST'
    });
    
    console.log('Start component packets:', startComponent.packets());
    console.log('Time component created with current time');
    
    // Create sync workflow
    const syncData = {
        time: {
            zone: 1,
            is24h: true,
            dateFormat: "%_m-%d-%y",
            time: new Date(),
            name: 'UTC'
        },
        alarms: [
            {
                number: 1,
                time: new Date(Date.now() + 3600000), // 1 hour from now
                enabled: true,
                message: 'Meeting'
            }
        ]
    };
    
    const workflow = ProtocolFactory.createSyncWorkflow(3, syncData);
    console.log(`Created sync workflow with ${workflow.length} components`);
}

// Example 3: Multi-Protocol Support
async function multiProtocolExample() {
    console.log('\n=== Multi-Protocol Support Example ===');
    
    // Test different device scenarios
    const deviceScenarios = [
        {
            name: 'Timex Datalink 150',
            info: { model: 'Timex Datalink 150', protocol: 3 }
        },
        {
            name: 'Timex Datalink 50',
            info: { model: 'Timex Datalink 50', protocol: 1 }
        },
        {
            name: 'Motorola Beepwear Pro',
            info: { model: 'Motorola Beepwear Pro', protocol: 6 }
        },
        {
            name: 'DSI e-BRAIN',
            info: { model: 'DSI e-BRAIN', protocol: 7 }
        },
        {
            name: 'Timex Ironman Triathlon',
            info: { model: 'Timex Ironman Triathlon', protocol: 9 }
        }
    ];
    
    for (const scenario of deviceScenarios) {
        console.log(`\nTesting device: ${scenario.name}`);
        
        try {
            const protocol = ProtocolFactory.createProtocolFromDevice(scenario.info);
            console.log(`  Compatible protocol: ${protocol.info.name}`);
            console.log(`  Capabilities: ${Object.keys(protocol.info.capabilities).filter(k => protocol.info.capabilities[k]).join(', ')}`);
            
            // Test component availability
            const components = protocol.getAvailableComponents();
            console.log(`  Available components: ${components.join(', ')}`);
            
        } catch (error) {
            console.log(`  Error: ${error.message}`);
        }
    }
}

// Example 4: Protocol Manager Statistics
async function protocolStatsExample() {
    console.log('\n=== Protocol Manager Statistics ===');
    
    const stats = protocolManager.getStats();
    console.log('Protocol Manager Stats:');
    console.log(`  Registered protocols: ${stats.protocolCount}`);
    console.log(`  Supported device models: ${stats.deviceModelCount}`);
    console.log(`  Protocol versions: ${stats.protocolVersions.join(', ')}`);
    
    console.log('\nProtocol Details:');
    stats.protocolInfo.forEach(info => {
        console.log(`  ${info.name} (v${info.version}):`);
        console.log(`    Devices: ${info.supportedDevices.slice(0, 2).join(', ')}${info.supportedDevices.length > 2 ? '...' : ''}`);
        console.log(`    Capabilities: ${Object.keys(info.capabilities).filter(k => info.capabilities[k]).join(', ')}`);
    });
}

// Example 5: Custom Protocol Registration
async function customProtocolExample() {
    console.log('\n=== Custom Protocol Registration Example ===');
    
    // This would be how you'd add a new protocol implementation
    console.log('Custom protocol registration would involve:');
    console.log('1. Creating a class extending ProtocolBase');
    console.log('2. Implementing required methods and properties');
    console.log('3. Creating component classes');
    console.log('4. Registering with protocolManager.registerProtocol()');
    console.log('5. The framework automatically handles detection and usage');
}

// Run all examples
async function runAllExamples() {
    try {
        await basicProtocolExample();
        await protocolComponentExample();
        await multiProtocolExample();
        await protocolStatsExample();
        await customProtocolExample();
        
        console.log('\n=== All Examples Completed ===');
        
    } catch (error) {
        console.error('Example error:', error);
    }
}

// Export for use in other files or run directly
export {
    basicProtocolExample,
    protocolComponentExample,
    multiProtocolExample,
    protocolStatsExample,
    customProtocolExample,
    runAllExamples
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllExamples();
}