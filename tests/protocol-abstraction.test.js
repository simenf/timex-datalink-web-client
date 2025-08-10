/**
 * Protocol Abstraction Framework Tests
 * 
 * Tests for the protocol abstraction framework including protocol detection,
 * registration, and component creation.
 */

import { ProtocolBase, ProtocolComponentBase } from '../lib/protocol-base.js';
import { ProtocolRegistry, protocolRegistry } from '../lib/protocol-registry.js';
import { ProtocolFactory } from '../lib/protocol-factory.js';
import { ProtocolManager, protocolManager } from '../lib/protocol-manager.js';
import { Protocol3 } from '../lib/protocol3-implementation.js';
import { Protocol1, Protocol4, Protocol6, Protocol7, Protocol9 } from '../lib/protocol-templates.js';

// Test Protocol Base Classes
function testProtocolBase() {
    console.log('Testing Protocol Base Classes...');
    
    // Test that base classes throw errors for unimplemented methods
    try {
        ProtocolBase.VERSION;
        console.error('❌ ProtocolBase.VERSION should throw error');
    } catch (error) {
        console.log('✅ ProtocolBase.VERSION throws error as expected');
    }
    
    try {
        const component = new ProtocolComponentBase();
        component.packets();
        console.error('❌ ProtocolComponentBase.packets() should throw error');
    } catch (error) {
        console.log('✅ ProtocolComponentBase.packets() throws error as expected');
    }
}

// Test Protocol Registry
function testProtocolRegistry() {
    console.log('\nTesting Protocol Registry...');
    
    // Create a test registry
    const testRegistry = new ProtocolRegistry();
    
    // Test registration
    try {
        testRegistry.register(Protocol3);
        console.log('✅ Protocol 3 registered successfully');
    } catch (error) {
        console.error('❌ Failed to register Protocol 3:', error.message);
    }
    
    // Test duplicate registration
    try {
        testRegistry.register(Protocol3);
        console.error('❌ Duplicate registration should throw error');
    } catch (error) {
        console.log('✅ Duplicate registration throws error as expected');
    }
    
    // Test protocol retrieval
    const retrievedProtocol = testRegistry.getProtocol(3);
    if (retrievedProtocol === Protocol3) {
        console.log('✅ Protocol retrieval works correctly');
    } else {
        console.error('❌ Protocol retrieval failed');
    }
    
    // Test device compatibility
    const compatibleProtocols = testRegistry.getProtocolsForDevice('Timex Datalink 150');
    if (compatibleProtocols.length > 0 && compatibleProtocols[0] === Protocol3) {
        console.log('✅ Device compatibility detection works');
    } else {
        console.error('❌ Device compatibility detection failed');
    }
    
    // Test protocol detection
    const deviceInfo = {
        model: 'Timex Datalink 150',
        protocol: 3
    };
    
    const detectedProtocol = testRegistry.detectProtocol(deviceInfo);
    if (detectedProtocol === Protocol3) {
        console.log('✅ Protocol detection works correctly');
    } else {
        console.error('❌ Protocol detection failed');
    }
}

// Test Protocol Factory
function testProtocolFactory() {
    console.log('\nTesting Protocol Factory...');
    
    // Ensure Protocol 3 is registered
    try {
        protocolRegistry.register(Protocol3);
    } catch (error) {
        // Already registered, ignore
    }
    
    // Test protocol creation
    try {
        const protocol = ProtocolFactory.createProtocol(3);
        if (protocol && protocol.info.version === 3) {
            console.log('✅ Protocol creation works correctly');
        } else {
            console.error('❌ Protocol creation failed');
        }
    } catch (error) {
        console.error('❌ Protocol creation error:', error.message);
    }
    
    // Test component creation
    try {
        const protocol = ProtocolFactory.createProtocol(3);
        const startComponent = protocol.createComponent('Start');
        
        if (startComponent && typeof startComponent.packets === 'function') {
            console.log('✅ Component creation works correctly');
        } else {
            console.error('❌ Component creation failed');
        }
    } catch (error) {
        console.error('❌ Component creation error:', error.message);
    }
    
    // Test sync workflow creation
    try {
        const syncData = {
            time: {
                zone: 1,
                is24h: false,
                dateFormat: "%_m-%d-%y",
                time: new Date()
            }
        };
        
        const workflow = ProtocolFactory.createSyncWorkflow(3, syncData);
        if (Array.isArray(workflow) && workflow.length > 0) {
            console.log('✅ Sync workflow creation works correctly');
        } else {
            console.error('❌ Sync workflow creation failed');
        }
    } catch (error) {
        console.error('❌ Sync workflow creation error:', error.message);
    }
}

// Test Protocol Manager
function testProtocolManager() {
    console.log('\nTesting Protocol Manager...');
    
    // Test manager initialization
    const testManager = new ProtocolManager({ verbose: false });
    const stats = testManager.getStats();
    
    if (stats.protocolCount > 0) {
        console.log('✅ Protocol Manager initialized with protocols');
    } else {
        console.error('❌ Protocol Manager has no protocols');
    }
    
    // Test protocol recommendations
    const deviceInfo = {
        model: 'Timex Datalink 150',
        identifier: 'Timex USB Device'
    };
    
    const recommendations = testManager.getProtocolRecommendations(deviceInfo);
    if (recommendations.length > 0) {
        console.log('✅ Protocol recommendations work correctly');
        console.log(`   Best recommendation: ${recommendations[0].name} (${recommendations[0].confidence}% confidence)`);
    } else {
        console.error('❌ Protocol recommendations failed');
    }
    
    // Test validation
    const validation = testManager.validateSetup();
    if (validation.isValid) {
        console.log('✅ Protocol Manager setup validation passed');
    } else {
        console.error('❌ Protocol Manager setup validation failed:', validation.errors);
    }
}

// Test Protocol 3 Implementation
function testProtocol3Implementation() {
    console.log('\nTesting Protocol 3 Implementation...');
    
    // Test protocol info
    const info = Protocol3.getInfo();
    if (info.version === 3 && info.name === 'Protocol 3') {
        console.log('✅ Protocol 3 info is correct');
    } else {
        console.error('❌ Protocol 3 info is incorrect');
    }
    
    // Test capabilities
    const capabilities = Protocol3.CAPABILITIES;
    if (capabilities.time && capabilities.alarms && capabilities.eeprom) {
        console.log('✅ Protocol 3 capabilities are correct');
    } else {
        console.error('❌ Protocol 3 capabilities are incorrect');
    }
    
    // Test component availability
    const components = Protocol3.getComponents();
    const expectedComponents = ['Start', 'Sync', 'Time', 'Alarm', 'End', 'Eeprom', 'SoundOptions', 'SoundTheme'];
    const hasAllComponents = expectedComponents.every(comp => comp in components);
    
    if (hasAllComponents) {
        console.log('✅ Protocol 3 has all expected components');
    } else {
        console.error('❌ Protocol 3 is missing components');
    }
    
    // Test compatibility detection
    const testDevices = [
        { model: 'Timex Datalink 150', expected: true },
        { protocol: 3, expected: true },
        { model: 'Unknown Device', expected: false }
    ];
    
    let compatibilityTestsPassed = 0;
    for (const test of testDevices) {
        const isCompatible = Protocol3.isCompatible(test);
        if (isCompatible === test.expected) {
            compatibilityTestsPassed++;
        }
    }
    
    if (compatibilityTestsPassed === testDevices.length) {
        console.log('✅ Protocol 3 compatibility detection works correctly');
    } else {
        console.error('❌ Protocol 3 compatibility detection failed');
    }
}

// Test Protocol Templates
function testProtocolTemplates() {
    console.log('\nTesting Protocol Templates...');
    
    const templates = [Protocol1, Protocol4, Protocol6, Protocol7, Protocol9];
    let templatesValid = 0;
    
    for (const ProtocolClass of templates) {
        try {
            const validation = ProtocolClass.validate();
            if (validation.isValid) {
                templatesValid++;
                console.log(`✅ ${ProtocolClass.NAME} template is valid`);
            } else {
                console.error(`❌ ${ProtocolClass.NAME} template validation failed:`, validation.errors);
            }
        } catch (error) {
            console.error(`❌ ${ProtocolClass.NAME} template error:`, error.message);
        }
    }
    
    if (templatesValid === templates.length) {
        console.log('✅ All protocol templates are valid');
    } else {
        console.error(`❌ ${templates.length - templatesValid} protocol templates failed validation`);
    }
}

// Test Integration
function testIntegration() {
    console.log('\nTesting Integration...');
    
    try {
        // Test complete workflow: register -> detect -> create -> use
        const testRegistry = new ProtocolRegistry();
        testRegistry.register(Protocol3);
        
        const deviceInfo = { model: 'Timex Datalink 150' };
        const detectedProtocol = testRegistry.detectProtocol(deviceInfo);
        
        if (detectedProtocol) {
            const protocolInstance = ProtocolFactory.createProtocolFromClass(detectedProtocol);
            const startComponent = protocolInstance.createComponent('Start');
            const packets = startComponent.packets();
            
            if (Array.isArray(packets) && packets.length > 0) {
                console.log('✅ Complete integration workflow works');
            } else {
                console.error('❌ Integration workflow failed at packet generation');
            }
        } else {
            console.error('❌ Integration workflow failed at protocol detection');
        }
    } catch (error) {
        console.error('❌ Integration test error:', error.message);
    }
}

// Run all tests
function runAllTests() {
    console.log('=== Protocol Abstraction Framework Tests ===\n');
    
    testProtocolBase();
    testProtocolRegistry();
    testProtocolFactory();
    testProtocolManager();
    testProtocol3Implementation();
    testProtocolTemplates();
    testIntegration();
    
    console.log('\n=== Tests Completed ===');
}

// Export test functions
export {
    testProtocolBase,
    testProtocolRegistry,
    testProtocolFactory,
    testProtocolManager,
    testProtocol3Implementation,
    testProtocolTemplates,
    testIntegration,
    runAllTests
};

// Run tests if this file is executed directly
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
    runAllTests();
}