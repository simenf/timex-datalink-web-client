/**
 * Integration tests for complete sync workflows
 * 
 * Tests end-to-end synchronization scenarios including error recovery,
 * data validation, and protocol compliance.
 */

import { TimexDatalinkClient } from '../../lib/timex-datalink-client.js';
import { SerialAdapter } from '../../lib/serial-adapter.js';
import Start from '../../lib/protocol3/start.js';
import Sync from '../../lib/protocol3/sync.js';
import Time from '../../lib/protocol3/time.js';
import End from '../../lib/protocol3/end.js';
import Alarm from '../../lib/protocol3/alarm.js';
import { MockSerialPort } from './web-serial-mock.js';

// Test suite for sync workflow integration
const testSyncWorkflows = () => {
  console.log('Testing Sync Workflow Integration...');
  
  let mockPort;
  let serialAdapter;
  let client;
  
  // Setup before each test
  const setup = async () => {
    mockPort = new MockSerialPort();
    
    serialAdapter = new SerialAdapter({
      port: mockPort,
      byteSleep: 1,
      packetSleep: 5,
      verbose: false
    });
    
    // Connect the serial adapter to set up writer/reader
    await serialAdapter.connect();
    
    client = new TimexDatalinkClient({
      serialDevice: serialAdapter,
      models: [],
      byteSleep: 1,
      packetSleep: 5,
      verbose: false
    });
  };
  
  // Cleanup after each test
  const cleanup = async () => {
    if (mockPort && mockPort.isOpen) {
      await mockPort.close();
    }
  };
  
  // Test 1: Minimal sync workflow (Start -> End)
  const testMinimalSync = async () => {
    console.log('Testing minimal sync workflow...');
    
    await setup();
    
    try {
      client.addModel(new Start());
      client.addModel(new End());
      
      mockPort.clearWrittenData();
      await client.write();
      
      const writtenData = mockPort.getWrittenData();
      
      // Should contain start and end packets
      if (!writtenData.includes(0x20)) {
        throw new Error('Start packet missing');
      }
      if (!writtenData.includes(0x21)) {
        throw new Error('End packet missing');
      }
      
      console.log('✓ Minimal sync workflow test passed');
    } catch (error) {
      await cleanup();
      throw error;
    }
    
    await cleanup();
  };
  
  // Test 2: Time synchronization workflow
  const testTimeSyncWorkflow = async () => {
    console.log('Testing time synchronization workflow...');
    
    await setup();
    
    try {
      // Create a complete time sync workflow
      const start = new Start();
      const sync = new Sync({ length: 100 });
      const time1 = new Time({
        zone: 1,
        is24h: false,
        dateFormat: "%_m-%d-%y",
        time: new Date(2015, 9, 21, 19, 28, 32),
        name: "pdt"
      });
      const time2 = new Time({
        zone: 2,
        is24h: true,
        dateFormat: "%y-%m-%d",
        time: new Date(2015, 9, 21, 19, 28, 32),
        name: "utc"
      });
      const end = new End();
      
      [start, sync, time1, time2, end].forEach(model => client.addModel(model));
      
      mockPort.clearWrittenData();
      await client.write();
      
      const writtenData = mockPort.getWrittenData();
      
      // Verify all expected packet types are present
      const expectedPackets = [0x20, 0x78, 0x32, 0x21]; // Start, Sync, Time, End
      for (const packet of expectedPackets) {
        if (!writtenData.includes(packet)) {
          throw new Error(`Missing packet type: 0x${packet.toString(16)}`);
        }
      }
      
      // Should have multiple time packets (zone 1 and zone 2)
      const timePacketCount = writtenData.filter(byte => byte === 0x32).length;
      if (timePacketCount < 2) {
        throw new Error(`Expected at least 2 time packets, found ${timePacketCount}`);
      }
      
      console.log(`✓ Time synchronization workflow test passed - ${timePacketCount} time packets sent`);
    } catch (error) {
      await cleanup();
      throw error;
    }
    
    await cleanup();
  };
  
  // Test 3: Alarm synchronization workflow
  const testAlarmSyncWorkflow = async () => {
    console.log('Testing alarm synchronization workflow...');
    
    await setup();
    
    try {
      const start = new Start();
      const sync = new Sync({ length: 50 });
      
      // Create multiple alarms
      const alarm1 = new Alarm({
        number: 1,
        audible: true,
        time: new Date(2015, 9, 21, 8, 30, 0),
        message: "Wake up"
      });
      
      const alarm2 = new Alarm({
        number: 2,
        audible: false,
        time: new Date(2015, 9, 21, 18, 45, 0),
        message: "Dinner"
      });
      
      const end = new End();
      
      [start, sync, alarm1, alarm2, end].forEach(model => client.addModel(model));
      
      mockPort.clearWrittenData();
      await client.write();
      
      const writtenData = mockPort.getWrittenData();
      
      // Verify alarm packets are present
      if (!writtenData.includes(0x50)) {
        throw new Error('Alarm packet missing');
      }
      
      // Count alarm packets
      const alarmPacketCount = writtenData.filter(byte => byte === 0x50).length;
      if (alarmPacketCount < 2) {
        throw new Error(`Expected at least 2 alarm packets, found ${alarmPacketCount}`);
      }
      
      console.log(`✓ Alarm synchronization workflow test passed - ${alarmPacketCount} alarm packets sent`);
    } catch (error) {
      await cleanup();
      throw error;
    }
    
    await cleanup();
  };
  
  // Test 4: Error recovery workflow
  const testErrorRecoveryWorkflow = async () => {
    console.log('Testing error recovery workflow...');
    
    await setup();
    
    try {
      // Create a workflow with an invalid model that should cause an error
      const start = new Start();
      const invalidTime = new Time({
        zone: 0, // Invalid zone
        is24h: false,
        dateFormat: "%_m-%d-%y",
        time: new Date(2015, 9, 21, 19, 28, 32),
        name: "pdt"
      });
      const end = new End();
      
      client.addModel(start);
      client.addModel(invalidTime);
      client.addModel(end);
      
      // This should fail due to invalid zone
      try {
        await client.write();
        throw new Error('Expected write to fail with invalid time zone');
      } catch (error) {
        if (error.message.includes('Zone 0 is invalid')) {
          console.log('✓ Error recovery workflow test passed - invalid data correctly rejected');
        } else {
          throw error;
        }
      }
    } catch (error) {
      await cleanup();
      throw error;
    }
    
    await cleanup();
  };
  
  // Test 5: Large data workflow
  const testLargeDataWorkflow = async () => {
    console.log('Testing large data workflow...');
    
    await setup();
    
    try {
      const start = new Start();
      const sync = new Sync({ length: 300 }); // Longer sync
      
      // Create multiple time zones
      const times = [];
      for (let zone = 1; zone <= 2; zone++) {
        for (let hour = 0; hour < 24; hour += 6) {
          times.push(new Time({
            zone: zone,
            is24h: hour >= 12,
            dateFormat: "%_m-%d-%y",
            time: new Date(2015, 9, 21, hour, 30, 0),
            name: `tz${zone}`
          }));
        }
      }
      
      const end = new End();
      
      // Add all models
      client.addModel(start);
      client.addModel(sync);
      times.forEach(time => client.addModel(time));
      client.addModel(end);
      
      mockPort.clearWrittenData();
      await client.write();
      
      const writtenData = mockPort.getWrittenData();
      
      // Should have a significant amount of data
      if (writtenData.length < 400) {
        throw new Error(`Expected large amount of data, got ${writtenData.length} bytes`);
      }
      
      // Should have multiple time packets
      const timePacketCount = writtenData.filter(byte => byte === 0x32).length;
      if (timePacketCount < times.length) {
        throw new Error(`Expected ${times.length} time packets, found ${timePacketCount}`);
      }
      
      console.log(`✓ Large data workflow test passed - ${writtenData.length} bytes, ${timePacketCount} time packets`);
    } catch (error) {
      await cleanup();
      throw error;
    }
    
    await cleanup();
  };
  
  // Test 6: Protocol compliance workflow
  const testProtocolComplianceWorkflow = async () => {
    console.log('Testing protocol compliance workflow...');
    
    await setup();
    
    try {
      // Create a workflow that follows strict protocol order
      const start = new Start();
      const sync = new Sync({ length: 200 });
      const time = new Time({
        zone: 1,
        is24h: false,
        dateFormat: "%_m-%d-%y",
        time: new Date(2015, 9, 21, 19, 28, 32),
        name: "pdt"
      });
      const end = new End();
      
      [start, sync, time, end].forEach(model => client.addModel(model));
      
      mockPort.clearWrittenData();
      await client.write();
      
      const writtenData = mockPort.getWrittenData();
      
      // Verify protocol order: Start should come before Sync, Sync before Time, Time before End
      const startIndex = writtenData.indexOf(0x20);
      const syncIndex = writtenData.indexOf(0x78);
      const timeIndex = writtenData.indexOf(0x32);
      const endIndex = writtenData.indexOf(0x21);
      
      if (startIndex === -1 || syncIndex === -1 || timeIndex === -1 || endIndex === -1) {
        throw new Error('Missing required protocol packets');
      }
      
      if (!(startIndex < syncIndex && syncIndex < timeIndex && timeIndex < endIndex)) {
        throw new Error(`Protocol order violation: Start(${startIndex}) -> Sync(${syncIndex}) -> Time(${timeIndex}) -> End(${endIndex})`);
      }
      
      console.log('✓ Protocol compliance workflow test passed - correct packet order maintained');
    } catch (error) {
      await cleanup();
      throw error;
    }
    
    await cleanup();
  };
  
  // Run all tests
  const runAllTests = async () => {
    const tests = [
      { name: 'Minimal Sync', test: testMinimalSync },
      { name: 'Time Synchronization', test: testTimeSyncWorkflow },
      { name: 'Alarm Synchronization', test: testAlarmSyncWorkflow },
      { name: 'Error Recovery', test: testErrorRecoveryWorkflow },
      { name: 'Large Data', test: testLargeDataWorkflow },
      { name: 'Protocol Compliance', test: testProtocolComplianceWorkflow }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const { name, test } of tests) {
      try {
        await test();
        passed++;
      } catch (error) {
        console.log(`❌ ${name} test failed: ${error.message}`);
        failed++;
      }
    }
    
    console.log('\n=== Sync Workflow Test Summary ===');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total:  ${passed + failed}`);
    
    if (failed === 0) {
      console.log('\n🎉 All sync workflow tests passed!');
    } else {
      console.log(`\n💥 ${failed} sync workflow test(s) failed.`);
    }
    
    return failed === 0;
  };
  
  return runAllTests();
};

export default testSyncWorkflows;