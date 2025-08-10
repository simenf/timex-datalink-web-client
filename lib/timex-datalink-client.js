// Main Timex Datalink Client class
// JavaScript port of the Ruby TimexDatalinkClient

import { SerialAdapter } from './serial-adapter.js';
import { protocolManager } from './protocol-manager.js';

export class TimexDatalinkClient {
    constructor({
        serialDevice = null,
        models = [],
        byteSleep = 25,
        packetSleep = 250,
        verbose = false,
        protocol = null,
        deviceInfo = {}
    } = {}) {
        // Handle both SerialAdapter instances and raw serial ports
        if (serialDevice instanceof SerialAdapter) {
            this.serialAdapter = serialDevice;
        } else if (serialDevice && typeof serialDevice === 'object' && 'open' in serialDevice) {
            // Create SerialAdapter from raw Web Serial API port
            this.serialAdapter = new SerialAdapter({
                port: serialDevice,
                byteSleep,
                packetSleep,
                verbose
            });
        } else if (serialDevice) {
            // For testing or other adapter types, use as-is
            this.serialAdapter = serialDevice;
        } else {
            this.serialAdapter = null;
        }
        
        this.models = Array.isArray(models) ? models : [];
        this.byteSleep = byteSleep;
        this.packetSleep = packetSleep;
        this.verbose = verbose;
        this.protocol = protocol;
        this.deviceInfo = deviceInfo;
        this.protocolInstance = null;
        
        if (this.verbose) {
            console.log('TimexDatalinkClient initialized with:', {
                hasSerialDevice: !!serialDevice,
                modelCount: this.models.length,
                byteSleep,
                packetSleep
            });
        }
    }
    
    // Compile all model packets into a flat array
    packets() {
        const allPackets = [];
        
        if (this.verbose) {
            console.log(`Compiling packets from ${this.models.length} models`);
        }
        
        for (let i = 0; i < this.models.length; i++) {
            const model = this.models[i];
            
            if (!model) {
                if (this.verbose) {
                    console.warn(`Model at index ${i} is null or undefined`);
                }
                continue;
            }
            
            if (typeof model.packets !== 'function') {
                if (this.verbose) {
                    console.warn(`Model at index ${i} (${model.constructor?.name || 'unknown'}) does not have a packets() method`);
                }
                continue;
            }
            
            try {
                const modelPackets = model.packets();
                
                if (!Array.isArray(modelPackets)) {
                    if (this.verbose) {
                        console.warn(`Model at index ${i} packets() returned non-array:`, typeof modelPackets);
                    }
                    continue;
                }
                
                if (this.verbose) {
                    console.log(`Model ${i} (${model.constructor?.name || 'unknown'}) contributed ${modelPackets.length} packets`);
                }
                
                // Validate that each packet is an array of numbers
                for (let j = 0; j < modelPackets.length; j++) {
                    const packet = modelPackets[j];
                    if (!Array.isArray(packet)) {
                        throw new Error(`Model ${i} packet ${j} is not an array`);
                    }
                    
                    for (let k = 0; k < packet.length; k++) {
                        const byte = packet[k];
                        if (typeof byte !== 'number' || byte < 0 || byte > 255 || !Number.isInteger(byte)) {
                            throw new Error(`Model ${i} packet ${j} byte ${k} is invalid: ${byte}`);
                        }
                    }
                }
                
                allPackets.push(...modelPackets);
                
            } catch (error) {
                const errorMsg = `Failed to get packets from model ${i}: ${error.message}`;
                if (this.verbose) {
                    console.error(errorMsg);
                }
                throw new Error(errorMsg);
            }
        }
        
        if (this.verbose) {
            console.log(`Compiled ${allPackets.length} total packets from ${this.models.length} models`);
        }
        
        return allPackets;
    }
    
    // Write data to the device using SerialAdapter
    async write() {
        if (!this.serialAdapter) {
            throw new Error('No serial adapter configured - cannot write to device');
        }
        
        // Ensure serial adapter is connected
        if (!this.serialAdapter.isPortConnected()) {
            throw new Error('Serial adapter is not connected to device');
        }
        
        // Update serial adapter timing configuration to match client settings
        this.serialAdapter.updateConfig({
            byteSleep: this.byteSleep,
            packetSleep: this.packetSleep,
            verbose: this.verbose
        });
        
        const packets = this.packets();
        
        if (packets.length === 0) {
            if (this.verbose) {
                console.log('No packets to write - no models configured or models returned empty packets');
            }
            return {
                success: true,
                packetsWritten: 0,
                message: 'No packets to write'
            };
        }
        
        if (this.verbose) {
            console.log(`Writing ${packets.length} packets to device`);
            console.log('Packet summary:', packets.map((packet, i) => `${i + 1}: [${packet.slice(0, 8).join(', ')}${packet.length > 8 ? '...' : ''}] (${packet.length} bytes)`));
        }
        
        try {
            await this.serialAdapter.write(packets);
            
            if (this.verbose) {
                console.log('Write operation completed successfully');
            }
            
            return {
                success: true,
                packetsWritten: packets.length,
                message: 'Write operation completed successfully'
            };
            
        } catch (error) {
            const errorMsg = `Write operation failed: ${error.message}`;
            if (this.verbose) {
                console.error(errorMsg);
            }
            throw new Error(errorMsg);
        }
    }
    
    // Read data from the device (bidirectional support)
    async read(timeout = 5000) {
        if (!this.serialAdapter) {
            throw new Error('No serial adapter configured - cannot read from device');
        }
        
        // Ensure serial adapter is connected
        if (!this.serialAdapter.isPortConnected()) {
            throw new Error('Serial adapter is not connected to device');
        }
        
        if (this.verbose) {
            console.log(`Reading data from device with ${timeout}ms timeout`);
        }
        
        try {
            const data = await this.serialAdapter.read(timeout);
            
            if (this.verbose) {
                console.log(`Read ${data ? data.length : 0} bytes from device`);
                if (data && data.length > 0) {
                    console.log('Read data:', data.slice(0, 20).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' ') + (data.length > 20 ? '...' : ''));
                }
            }
            
            return {
                success: true,
                data: data || [],
                bytesRead: data ? data.length : 0,
                message: 'Read operation completed successfully'
            };
            
        } catch (error) {
            const errorMsg = `Read operation failed: ${error.message}`;
            if (this.verbose) {
                console.error(errorMsg);
            }
            throw new Error(errorMsg);
        }
    }
    
    // Read specific number of bytes from device
    async readBytes(expectedBytes, timeout = 5000) {
        if (!this.serialAdapter) {
            throw new Error('No serial adapter configured - cannot read from device');
        }
        
        if (!this.serialAdapter.isPortConnected()) {
            throw new Error('Serial adapter is not connected to device');
        }
        
        if (this.verbose) {
            console.log(`Reading ${expectedBytes} bytes from device with ${timeout}ms timeout`);
        }
        
        try {
            const data = await this.serialAdapter.readBytes(expectedBytes, timeout);
            
            if (this.verbose) {
                console.log(`Read ${data.length}/${expectedBytes} bytes from device`);
                if (data.length > 0) {
                    console.log('Read data:', data.slice(0, 20).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' ') + (data.length > 20 ? '...' : ''));
                }
            }
            
            return {
                success: true,
                data: data,
                bytesRead: data.length,
                expectedBytes: expectedBytes,
                complete: data.length >= expectedBytes,
                message: data.length >= expectedBytes ? 'Read operation completed successfully' : `Read ${data.length}/${expectedBytes} bytes (incomplete)`
            };
            
        } catch (error) {
            const errorMsg = `Read bytes operation failed: ${error.message}`;
            if (this.verbose) {
                console.error(errorMsg);
            }
            throw new Error(errorMsg);
        }
    }
    
    // Add a model to the client
    addModel(model) {
        if (!model) {
            throw new Error('Cannot add null or undefined model');
        }
        
        if (typeof model.packets !== 'function') {
            throw new Error('Model must have a packets() method');
        }
        
        this.models.push(model);
        
        if (this.verbose) {
            console.log(`Added model: ${model.constructor?.name || 'unknown'} (total models: ${this.models.length})`);
        }
        
        return this;
    }
    
    // Add multiple models at once
    addModels(models) {
        if (!Array.isArray(models)) {
            throw new Error('Models must be an array');
        }
        
        for (const model of models) {
            this.addModel(model);
        }
        
        return this;
    }
    
    // Remove a specific model
    removeModel(model) {
        const index = this.models.indexOf(model);
        if (index !== -1) {
            this.models.splice(index, 1);
            
            if (this.verbose) {
                console.log(`Removed model: ${model.constructor?.name || 'unknown'} (remaining models: ${this.models.length})`);
            }
            return true;
        }
        return false;
    }
    
    // Remove all models
    clearModels() {
        const previousCount = this.models.length;
        this.models = [];
        
        if (this.verbose) {
            console.log(`Cleared ${previousCount} models`);
        }
        
        return this;
    }
    
    // Set serial device (can be SerialAdapter or raw port)
    setSerialDevice(serialDevice) {
        if (serialDevice instanceof SerialAdapter) {
            this.serialAdapter = serialDevice;
        } else if (serialDevice && typeof serialDevice === 'object' && 'open' in serialDevice) {
            // Create SerialAdapter from raw Web Serial API port
            this.serialAdapter = new SerialAdapter({
                port: serialDevice,
                byteSleep: this.byteSleep,
                packetSleep: this.packetSleep,
                verbose: this.verbose
            });
        } else if (serialDevice) {
            // For testing or other adapter types, use as-is
            this.serialAdapter = serialDevice;
        } else {
            this.serialAdapter = null;
        }
        
        if (this.verbose) {
            console.log('Serial device updated:', !!this.serialAdapter);
        }
        
        return this;
    }
    
    // Connect to serial device
    async connect(options = {}) {
        if (!this.serialAdapter) {
            throw new Error('No serial adapter configured - cannot connect');
        }
        
        if (this.verbose) {
            console.log('Connecting to serial device...');
        }
        
        try {
            await this.serialAdapter.connect(options);
            
            if (this.verbose) {
                console.log('Connected to serial device successfully');
            }
            
            return true;
        } catch (error) {
            const errorMsg = `Failed to connect to serial device: ${error.message}`;
            if (this.verbose) {
                console.error(errorMsg);
            }
            throw new Error(errorMsg);
        }
    }
    
    // Disconnect from serial device
    async disconnect() {
        if (!this.serialAdapter) {
            if (this.verbose) {
                console.log('No serial adapter to disconnect');
            }
            return;
        }
        
        if (this.verbose) {
            console.log('Disconnecting from serial device...');
        }
        
        try {
            await this.serialAdapter.disconnect();
            
            if (this.verbose) {
                console.log('Disconnected from serial device');
            }
        } catch (error) {
            const errorMsg = `Error during disconnect: ${error.message}`;
            if (this.verbose) {
                console.error(errorMsg);
            }
            throw new Error(errorMsg);
        }
    }
    
    // Check if connected to device
    isConnected() {
        return this.serialAdapter ? this.serialAdapter.isPortConnected() : false;
    }
    
    // Update timing configuration
    updateConfig({ byteSleep, packetSleep, verbose }) {
        if (byteSleep !== undefined) {
            this.byteSleep = Math.max(0, byteSleep);
        }
        if (packetSleep !== undefined) {
            this.packetSleep = Math.max(0, packetSleep);
        }
        if (verbose !== undefined) {
            this.verbose = Boolean(verbose);
        }
        
        // Update serial adapter config if it exists
        if (this.serialAdapter) {
            this.serialAdapter.updateConfig({
                byteSleep: this.byteSleep,
                packetSleep: this.packetSleep,
                verbose: this.verbose
            });
        }
        
        if (this.verbose) {
            console.log('Configuration updated:', this.getConfig());
        }
        
        return this;
    }
    
    // Get current configuration
    getConfig() {
        return {
            byteSleep: this.byteSleep,
            packetSleep: this.packetSleep,
            verbose: this.verbose,
            modelCount: this.models.length,
            hasSerialAdapter: !!this.serialAdapter,
            isConnected: this.isConnected(),
            serialAdapterConfig: this.serialAdapter ? this.serialAdapter.getConfig() : null
        };
    }
    
    // Get model information
    getModels() {
        return this.models.map((model, index) => ({
            index,
            name: model.constructor?.name || 'unknown',
            hasPacketsMethod: typeof model.packets === 'function',
            model: model
        }));
    }
    
    // Validate current configuration
    validate() {
        const errors = [];
        
        if (!this.serialAdapter) {
            errors.push('No serial adapter configured');
        } else if (!this.serialAdapter.isPortConnected()) {
            errors.push('Serial adapter is not connected');
        }
        
        if (this.models.length === 0) {
            errors.push('No models configured');
        }
        
        // Validate each model
        for (let i = 0; i < this.models.length; i++) {
            const model = this.models[i];
            if (!model) {
                errors.push(`Model at index ${i} is null or undefined`);
            } else if (typeof model.packets !== 'function') {
                errors.push(`Model at index ${i} does not have a packets() method`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    // Comprehensive bidirectional sync operation
    async sync(options = {}) {
        const {
            writeData = true,
            readData = false,
            expectedReadBytes = 0,
            readTimeout = 5000,
            writeRetries = 2,
            readRetries = 2,
            validateBeforeSync = true,
            conflictResolution = 'client-wins' // 'client-wins', 'device-wins', 'manual'
        } = options;
        
        if (this.verbose) {
            console.log('Starting bidirectional sync operation with options:', {
                writeData,
                readData,
                expectedReadBytes,
                readTimeout,
                writeRetries,
                readRetries,
                conflictResolution
            });
        }
        
        // Validate configuration before sync
        if (validateBeforeSync) {
            const validation = this.validate();
            if (!validation.isValid) {
                throw new Error(`Sync validation failed: ${validation.errors.join(', ')}`);
            }
        }
        
        const syncResult = {
            success: false,
            writeResult: null,
            readResult: null,
            conflicts: [],
            errors: [],
            startTime: Date.now(),
            endTime: null,
            duration: null
        };
        
        try {
            // Phase 1: Write data to device (if requested)
            if (writeData) {
                if (this.verbose) {
                    console.log('Sync Phase 1: Writing data to device');
                }
                
                try {
                    syncResult.writeResult = await this.writeWithRetry(writeRetries);
                    
                    if (this.verbose) {
                        console.log('Write phase completed successfully');
                    }
                } catch (error) {
                    syncResult.errors.push(`Write phase failed: ${error.message}`);
                    if (this.verbose) {
                        console.error('Write phase failed:', error.message);
                    }
                    throw error;
                }
            }
            
            // Phase 2: Read data from device (if requested)
            if (readData && expectedReadBytes > 0) {
                if (this.verbose) {
                    console.log('Sync Phase 2: Reading data from device');
                }
                
                try {
                    syncResult.readResult = await this.readBytesWithRetry(expectedReadBytes, readTimeout, readRetries);
                    
                    if (this.verbose) {
                        console.log('Read phase completed successfully');
                    }
                } catch (error) {
                    syncResult.errors.push(`Read phase failed: ${error.message}`);
                    if (this.verbose) {
                        console.error('Read phase failed:', error.message);
                    }
                    throw error;
                }
            }
            
            // Phase 3: Conflict detection and resolution (if both read and write occurred)
            if (writeData && readData && syncResult.writeResult && syncResult.readResult) {
                if (this.verbose) {
                    console.log('Sync Phase 3: Conflict detection and resolution');
                }
                
                const conflicts = this.detectSyncConflicts(syncResult.writeResult, syncResult.readResult);
                syncResult.conflicts = conflicts;
                
                if (conflicts.length > 0) {
                    if (this.verbose) {
                        console.log(`Detected ${conflicts.length} sync conflicts`);
                    }
                    
                    const resolution = await this.resolveSyncConflicts(conflicts, conflictResolution);
                    syncResult.conflictResolution = resolution;
                    
                    if (this.verbose) {
                        console.log('Conflict resolution completed:', resolution.strategy);
                    }
                }
            }
            
            syncResult.success = true;
            syncResult.endTime = Date.now();
            syncResult.duration = syncResult.endTime - syncResult.startTime;
            
            if (this.verbose) {
                console.log(`Sync operation completed successfully in ${syncResult.duration}ms`);
            }
            
            return syncResult;
            
        } catch (error) {
            syncResult.success = false;
            syncResult.endTime = Date.now();
            syncResult.duration = syncResult.endTime - syncResult.startTime;
            syncResult.errors.push(error.message);
            
            if (this.verbose) {
                console.error(`Sync operation failed after ${syncResult.duration}ms:`, error.message);
            }
            
            throw new Error(`Sync operation failed: ${error.message}`);
        }
    }
    
    // Write with automatic retry
    async writeWithRetry(maxRetries = 2) {
        if (!this.serialAdapter || !this.serialAdapter.writeWithRetry) {
            // Fallback to regular write if adapter doesn't support retry
            return await this.write();
        }
        
        const packets = this.packets();
        
        if (packets.length === 0) {
            return {
                success: true,
                packetsWritten: 0,
                message: 'No packets to write'
            };
        }
        
        if (this.verbose) {
            console.log(`Writing ${packets.length} packets with up to ${maxRetries} retries`);
        }
        
        try {
            await this.serialAdapter.writeWithRetry(packets, maxRetries);
            
            return {
                success: true,
                packetsWritten: packets.length,
                message: 'Write operation completed successfully'
            };
        } catch (error) {
            throw new Error(`Write with retry failed: ${error.message}`);
        }
    }
    
    // Read bytes with automatic retry
    async readBytesWithRetry(expectedBytes, timeout = 5000, maxRetries = 2) {
        if (!this.serialAdapter || !this.serialAdapter.readWithRetry) {
            // Fallback to regular read if adapter doesn't support retry
            return await this.readBytes(expectedBytes, timeout);
        }
        
        if (this.verbose) {
            console.log(`Reading ${expectedBytes} bytes with up to ${maxRetries} retries`);
        }
        
        try {
            const data = await this.serialAdapter.readWithRetry(timeout, maxRetries);
            
            return {
                success: true,
                data: data.slice(0, expectedBytes),
                bytesRead: Math.min(data.length, expectedBytes),
                expectedBytes: expectedBytes,
                complete: data.length >= expectedBytes,
                message: data.length >= expectedBytes ? 'Read operation completed successfully' : `Read ${data.length}/${expectedBytes} bytes (incomplete)`
            };
        } catch (error) {
            throw new Error(`Read with retry failed: ${error.message}`);
        }
    }
    
    // Detect sync conflicts between written and read data
    detectSyncConflicts(writeResult, readResult) {
        const conflicts = [];
        
        if (!writeResult || !readResult) {
            return conflicts;
        }
        
        // Basic conflict detection - this would be expanded based on protocol specifics
        if (writeResult.packetsWritten > 0 && readResult.bytesRead === 0) {
            conflicts.push({
                type: 'no-response',
                description: 'Data was written but no response received from device',
                severity: 'warning',
                writeData: writeResult,
                readData: readResult
            });
        }
        
        if (readResult.bytesRead > 0 && !readResult.complete) {
            conflicts.push({
                type: 'incomplete-read',
                description: `Expected ${readResult.expectedBytes} bytes but only received ${readResult.bytesRead}`,
                severity: 'warning',
                writeData: writeResult,
                readData: readResult
            });
        }
        
        // Additional conflict detection logic would go here based on protocol requirements
        
        return conflicts;
    }
    
    // Resolve sync conflicts based on strategy
    async resolveSyncConflicts(conflicts, strategy = 'client-wins') {
        const resolution = {
            strategy: strategy,
            resolvedConflicts: [],
            unresolvedConflicts: [],
            actions: []
        };
        
        for (const conflict of conflicts) {
            try {
                switch (strategy) {
                    case 'client-wins':
                        // Client data takes precedence
                        resolution.actions.push({
                            type: 'client-wins',
                            conflict: conflict,
                            action: 'Use client data, ignore device conflicts'
                        });
                        resolution.resolvedConflicts.push(conflict);
                        break;
                        
                    case 'device-wins':
                        // Device data takes precedence
                        resolution.actions.push({
                            type: 'device-wins',
                            conflict: conflict,
                            action: 'Use device data, override client data'
                        });
                        resolution.resolvedConflicts.push(conflict);
                        break;
                        
                    case 'manual':
                        // Manual resolution required
                        resolution.unresolvedConflicts.push(conflict);
                        break;
                        
                    default:
                        resolution.unresolvedConflicts.push(conflict);
                        break;
                }
            } catch (error) {
                resolution.unresolvedConflicts.push({
                    ...conflict,
                    resolutionError: error.message
                });
            }
        }
        
        if (this.verbose) {
            console.log(`Conflict resolution: ${resolution.resolvedConflicts.length} resolved, ${resolution.unresolvedConflicts.length} unresolved`);
        }
        
        return resolution;
    }
    
    // Protocol Management Methods
    
    /**
     * Detect protocol for connected device
     */
    async detectProtocol(deviceInfo = {}) {
        const combinedDeviceInfo = { ...this.deviceInfo, ...deviceInfo };
        
        try {
            const detectedProtocol = await protocolManager.detectProtocol(this.serialAdapter, combinedDeviceInfo);
            
            if (detectedProtocol) {
                this.protocol = detectedProtocol.VERSION;
                this.deviceInfo = combinedDeviceInfo;
                this.protocolInstance = protocolManager.createProtocol(detectedProtocol);
                
                if (this.verbose) {
                    console.log(`Protocol detected: ${detectedProtocol.NAME} (version ${detectedProtocol.VERSION})`);
                }
                
                return detectedProtocol;
            }
            
            return null;
        } catch (error) {
            if (this.verbose) {
                console.error('Protocol detection failed:', error.message);
            }
            throw error;
        }
    }
    
    /**
     * Set protocol manually
     */
    setProtocol(protocolVersion, deviceInfo = {}) {
        try {
            this.protocol = protocolVersion;
            this.deviceInfo = { ...this.deviceInfo, ...deviceInfo };
            this.protocolInstance = protocolManager.createProtocol(protocolVersion);
            
            if (this.verbose) {
                console.log(`Protocol set manually: version ${protocolVersion}`);
            }
            
            return this.protocolInstance;
        } catch (error) {
            if (this.verbose) {
                console.error('Failed to set protocol:', error.message);
            }
            throw error;
        }
    }
    
    /**
     * Get current protocol information
     */
    getProtocolInfo() {
        if (!this.protocolInstance) {
            return null;
        }
        
        return {
            ...this.protocolInstance.info,
            deviceInfo: this.deviceInfo
        };
    }
    
    /**
     * Get available protocols
     */
    getAvailableProtocols() {
        return protocolManager.getAvailableProtocols();
    }
    
    /**
     * Get protocol recommendations for current device
     */
    getProtocolRecommendations() {
        return protocolManager.getProtocolRecommendations(this.deviceInfo);
    }
    
    /**
     * Create protocol-specific sync workflow
     */
    createProtocolSyncWorkflow(syncData = {}) {
        if (!this.protocol) {
            throw new Error('No protocol set. Call detectProtocol() or setProtocol() first.');
        }
        
        return protocolManager.createSyncWorkflow(this.protocol, syncData);
    }
    
    /**
     * Sync using protocol-specific workflow
     */
    async syncWithProtocol(syncData = {}, options = {}) {
        if (!this.protocol) {
            throw new Error('No protocol set. Call detectProtocol() or setProtocol() first.');
        }
        
        const workflow = this.createProtocolSyncWorkflow(syncData);
        
        // Replace current models with workflow components
        const originalModels = this.models;
        this.models = workflow;
        
        try {
            const result = await this.sync(options);
            return result;
        } finally {
            // Restore original models
            this.models = originalModels;
        }
    }

    // Get comprehensive sync status
    getSyncStatus() {
        const status = {
            timestamp: Date.now(),
            clientReady: false,
            deviceConnected: false,
            modelsConfigured: false,
            canWrite: false,
            canRead: false,
            lastSyncTime: null,
            errors: []
        };
        
        try {
            // Check client configuration
            const validation = this.validate();
            status.clientReady = validation.isValid;
            if (!validation.isValid) {
                status.errors.push(...validation.errors);
            }
            
            // Check device connection
            status.deviceConnected = this.isConnected();
            if (!status.deviceConnected) {
                status.errors.push('Device not connected');
            }
            
            // Check models
            status.modelsConfigured = this.models.length > 0;
            if (!status.modelsConfigured) {
                status.errors.push('No models configured');
            }
            
            // Determine capabilities
            status.canWrite = status.clientReady && status.deviceConnected && status.modelsConfigured;
            status.canRead = status.deviceConnected && this.serialAdapter && typeof this.serialAdapter.read === 'function';
            
            // Additional status information
            status.modelCount = this.models.length;
            status.config = this.getConfig();
            status.protocol = this.getProtocolInfo();
            status.protocolRecommendations = this.deviceInfo ? this.getProtocolRecommendations() : [];
            
        } catch (error) {
            status.errors.push(`Status check failed: ${error.message}`);
        }
        
        return status;
    }
}