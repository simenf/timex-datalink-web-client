// Serial Adapter for Web Serial API communication
// JavaScript port of the Ruby NotebookAdapter

export class SerialAdapter {
    constructor({
        port = null,
        byteSleep = 25,
        packetSleep = 250,
        verbose = false
    } = {}) {
        this.port = port;
        this.byteSleep = byteSleep;
        this.packetSleep = packetSleep;
        this.verbose = verbose;
        this.writer = null;
        this.reader = null;
        this.isConnected = false;
    }
    
    // Static method to check Web Serial API support
    static isSupported() {
        return 'serial' in navigator;
    }
    
    // Static method to request device access from user
    static async requestDevice(filters = []) {
        if (!SerialAdapter.isSupported()) {
            throw new Error('Web Serial API is not supported in this browser');
        }
        
        try {
            const port = await navigator.serial.requestPort({ filters });
            return new SerialAdapter({ port });
        } catch (error) {
            if (error.name === 'NotFoundError') {
                throw new Error('No device selected by user');
            }
            throw new Error(`Failed to request device: ${error.message}`);
        }
    }
    
    // Static method to get previously authorized devices
    static async getDevices() {
        if (!SerialAdapter.isSupported()) {
            throw new Error('Web Serial API is not supported in this browser');
        }
        
        try {
            const ports = await navigator.serial.getPorts();
            return ports.map(port => new SerialAdapter({ port }));
        } catch (error) {
            throw new Error(`Failed to get devices: ${error.message}`);
        }
    }
    
    // Static method to create adapter with device discovery
    static async discover(options = {}) {
        const { verbose = false, filters = [] } = options;
        
        if (verbose) {
            console.log('Starting device discovery...');
        }
        
        // First try to get previously authorized devices
        const existingDevices = await SerialAdapter.getDevices();
        
        if (existingDevices.length > 0) {
            if (verbose) {
                console.log(`Found ${existingDevices.length} previously authorized device(s)`);
            }
            // Return the first available device
            const adapter = existingDevices[0];
            adapter.verbose = verbose;
            return adapter;
        }
        
        // If no existing devices, request user to select one
        if (verbose) {
            console.log('No previously authorized devices found, requesting user selection...');
        }
        
        const adapter = await SerialAdapter.requestDevice(filters);
        adapter.verbose = verbose;
        return adapter;
    }
    
    // Connect to the serial port
    async connect(options = {}) {
        if (!this.port) {
            throw new Error('No serial port provided');
        }
        
        if (this.isConnected) {
            if (this.verbose) {
                console.log('Already connected to serial port');
            }
            return;
        }
        
        const connectionOptions = {
            baudRate: 9600,
            dataBits: 8,
            stopBits: 1,
            parity: 'none',
            flowControl: 'none',
            ...options
        };
        
        try {
            if (this.verbose) {
                console.log('Connecting to serial port with options:', connectionOptions);
            }
            
            // Open the serial port with appropriate settings
            await this.port.open(connectionOptions);
            
            // Get writer and reader streams
            this.writer = this.port.writable.getWriter();
            this.reader = this.port.readable.getReader();
            
            this.isConnected = true;
            
            if (this.verbose) {
                console.log('Serial port connected successfully');
                console.log(`Port info:`, await this.getPortInfo());
            }
            
        } catch (error) {
            this.isConnected = false;
            this.writer = null;
            this.reader = null;
            
            // Provide more specific error messages
            if (error.name === 'InvalidStateError') {
                throw new Error('Serial port is already open or in use by another application');
            } else if (error.name === 'NetworkError') {
                throw new Error('Failed to open serial port - device may be disconnected');
            } else if (error.name === 'NotFoundError') {
                throw new Error('Serial port device not found - device may be disconnected');
            } else {
                throw new Error(`Failed to connect to serial port: ${error.message}`);
            }
        }
    }
    
    // Disconnect from the serial port
    async disconnect() {
        try {
            if (this.writer) {
                this.writer.releaseLock();
                this.writer = null;
            }
            
            if (this.reader) {
                this.reader.releaseLock();
                this.reader = null;
            }
            
            if (this.port && this.isConnected) {
                await this.port.close();
            }
            
            this.isConnected = false;
            
            if (this.verbose) {
                console.log('Serial port disconnected');
            }
            
        } catch (error) {
            console.error('Error during disconnect:', error);
            throw error;
        }
    }
    
    // Write packets to the device
    async write(packets) {
        if (!this.isConnected || !this.writer) {
            throw new Error('Serial port not connected');
        }
        
        if (!Array.isArray(packets)) {
            throw new Error('Packets must be an array');
        }
        
        if (packets.length === 0) {
            if (this.verbose) {
                console.log('No packets to write');
            }
            return;
        }
        
        if (this.verbose) {
            console.log(`Writing ${packets.length} packets`);
        }
        
        try {
            for (let i = 0; i < packets.length; i++) {
                const packet = packets[i];
                
                if (!Array.isArray(packet)) {
                    throw new Error(`Packet ${i} is not an array`);
                }
                
                if (packet.length === 0) {
                    if (this.verbose) {
                        console.log(`Skipping empty packet ${i + 1}`);
                    }
                    continue;
                }
                
                if (this.verbose) {
                    console.log(`Writing packet ${i + 1}/${packets.length}: [${packet.join(', ')}]`);
                }
                
                // Write each byte in the packet
                for (let j = 0; j < packet.length; j++) {
                    const byte = packet[j];
                    
                    if (typeof byte !== 'number' || byte < 0 || byte > 255 || !Number.isInteger(byte)) {
                        throw new Error(`Invalid byte value at packet ${i}, position ${j}: ${byte}`);
                    }
                    
                    try {
                        await this.writer.write(new Uint8Array([byte]));
                    } catch (error) {
                        if (error.name === 'NetworkError') {
                            throw new Error(`Device disconnected while writing packet ${i + 1}`);
                        }
                        throw new Error(`Write failed at packet ${i + 1}, byte ${j + 1}: ${error.message}`);
                    }
                    
                    // Sleep between bytes if configured
                    if (this.byteSleep > 0) {
                        await this.sleep(this.byteSleep);
                    }
                }
                
                // Sleep between packets if configured
                if (this.packetSleep > 0 && i < packets.length - 1) {
                    await this.sleep(this.packetSleep);
                }
            }
            
            if (this.verbose) {
                console.log('All packets written successfully');
            }
            
        } catch (error) {
            // If we encounter an error, mark as disconnected
            if (error.message.includes('Device disconnected')) {
                this.isConnected = false;
            }
            throw error;
        }
    }
    
    // Read data from the device
    async read(timeout = 5000) {
        if (!this.isConnected || !this.reader) {
            throw new Error('Serial port not connected');
        }
        
        const data = [];
        const startTime = Date.now();
        
        if (this.verbose) {
            console.log(`Starting read operation with ${timeout}ms timeout`);
        }
        
        try {
            while (Date.now() - startTime < timeout) {
                const { value, done } = await Promise.race([
                    this.reader.read(),
                    new Promise(resolve => setTimeout(() => resolve({ done: true }), 100))
                ]);
                
                if (done) {
                    if (this.verbose && data.length === 0) {
                        console.log('Read operation completed with no data');
                    }
                    break;
                }
                
                if (value && value.length > 0) {
                    data.push(...Array.from(value));
                    
                    if (this.verbose) {
                        console.log(`Read ${value.length} bytes: [${Array.from(value).join(', ')}]`);
                    }
                }
            }
        } catch (error) {
            if (this.verbose) {
                console.error('Read error:', error);
            }
            
            // Handle specific error types
            if (error.name === 'NetworkError') {
                this.isConnected = false;
                throw new Error('Device disconnected during read operation');
            } else if (error.name === 'InvalidStateError') {
                throw new Error('Serial port is in an invalid state for reading');
            } else {
                throw new Error(`Read operation failed: ${error.message}`);
            }
        }
        
        if (this.verbose) {
            console.log(`Read completed: ${data.length} total bytes`);
        }
        
        return data;
    }
    
    // Read data with specific byte count expectation
    async readBytes(expectedBytes, timeout = 5000) {
        const data = [];
        const startTime = Date.now();
        
        if (this.verbose) {
            console.log(`Reading ${expectedBytes} bytes with ${timeout}ms timeout`);
        }
        
        while (data.length < expectedBytes && Date.now() - startTime < timeout) {
            const chunk = await this.read(Math.min(1000, timeout - (Date.now() - startTime)));
            data.push(...chunk);
            
            if (chunk.length === 0) {
                // No more data available
                break;
            }
        }
        
        if (data.length < expectedBytes) {
            if (this.verbose) {
                console.warn(`Expected ${expectedBytes} bytes but only received ${data.length}`);
            }
        }
        
        return data.slice(0, expectedBytes);
    }
    
    // Check if connected
    isPortConnected() {
        return this.isConnected && this.port && this.writer && this.reader;
    }
    
    // Monitor connection status
    async checkConnection() {
        if (!this.port) {
            return false;
        }
        
        try {
            // Try to get port info to verify connection
            const info = this.port.getInfo();
            
            // Check if streams are still available
            const hasStreams = this.writer && this.reader && 
                              this.port.writable && this.port.readable;
            
            const connected = this.isConnected && hasStreams;
            
            if (this.isConnected !== connected) {
                this.isConnected = connected;
                if (this.verbose) {
                    console.log(`Connection status changed: ${connected ? 'connected' : 'disconnected'}`);
                }
            }
            
            return connected;
        } catch (error) {
            if (this.verbose) {
                console.log('Connection check failed:', error.message);
            }
            this.isConnected = false;
            return false;
        }
    }
    
    // Add event listener for port disconnect
    addDisconnectListener(callback) {
        if (!this.port) {
            throw new Error('No port available for disconnect listener');
        }
        
        // Listen for port disconnect events
        navigator.serial.addEventListener('disconnect', (event) => {
            if (event.target === this.port) {
                this.isConnected = false;
                this.writer = null;
                this.reader = null;
                
                if (this.verbose) {
                    console.log('Device disconnected');
                }
                
                if (callback) {
                    callback(event);
                }
            }
        });
    }
    
    // Add event listener for port connect
    static addConnectListener(callback) {
        if (!SerialAdapter.isSupported()) {
            throw new Error('Web Serial API not supported');
        }
        
        navigator.serial.addEventListener('connect', callback);
    }
    
    // Get port information
    async getPortInfo() {
        if (!this.port) {
            return null;
        }
        
        const info = this.port.getInfo();
        return {
            usbVendorId: info.usbVendorId,
            usbProductId: info.usbProductId,
            connected: this.isConnected
        };
    }
    
    // Sleep utility function
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Get current configuration
    getConfig() {
        return {
            byteSleep: this.byteSleep,
            packetSleep: this.packetSleep,
            verbose: this.verbose,
            isConnected: this.isConnected
        };
    }
    
    // Update configuration
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
        
        if (this.verbose) {
            console.log('Configuration updated:', this.getConfig());
        }
    }
    
    // Attempt to reconnect
    async reconnect(maxAttempts = 3, delay = 1000) {
        if (this.verbose) {
            console.log(`Attempting to reconnect (max ${maxAttempts} attempts)`);
        }
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                if (this.verbose) {
                    console.log(`Reconnection attempt ${attempt}/${maxAttempts}`);
                }
                
                // First disconnect cleanly
                await this.disconnect();
                
                // Wait before reconnecting
                await this.sleep(delay);
                
                // Attempt to reconnect
                await this.connect();
                
                if (this.verbose) {
                    console.log('Reconnection successful');
                }
                
                return true;
                
            } catch (error) {
                if (this.verbose) {
                    console.log(`Reconnection attempt ${attempt} failed:`, error.message);
                }
                
                if (attempt === maxAttempts) {
                    throw new Error(`Failed to reconnect after ${maxAttempts} attempts: ${error.message}`);
                }
                
                // Wait longer between attempts
                await this.sleep(delay * attempt);
            }
        }
        
        return false;
    }
    
    // Write with automatic retry on failure
    async writeWithRetry(packets, maxRetries = 2) {
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                await this.write(packets);
                return; // Success
                
            } catch (error) {
                lastError = error;
                
                if (this.verbose) {
                    console.log(`Write attempt ${attempt + 1} failed:`, error.message);
                }
                
                // If device disconnected, try to reconnect
                if (error.message.includes('disconnected') || error.message.includes('not connected')) {
                    if (attempt < maxRetries) {
                        try {
                            await this.reconnect(1, 500);
                        } catch (reconnectError) {
                            if (this.verbose) {
                                console.log('Reconnection failed:', reconnectError.message);
                            }
                        }
                    }
                } else if (attempt < maxRetries) {
                    // For other errors, just wait a bit before retrying
                    await this.sleep(100);
                }
            }
        }
        
        throw new Error(`Write failed after ${maxRetries + 1} attempts: ${lastError.message}`);
    }
    
    // Read with automatic retry on failure
    async readWithRetry(timeout = 5000, maxRetries = 2) {
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await this.read(timeout);
                
            } catch (error) {
                lastError = error;
                
                if (this.verbose) {
                    console.log(`Read attempt ${attempt + 1} failed:`, error.message);
                }
                
                // If device disconnected, try to reconnect
                if (error.message.includes('disconnected') || error.message.includes('not connected')) {
                    if (attempt < maxRetries) {
                        try {
                            await this.reconnect(1, 500);
                        } catch (reconnectError) {
                            if (this.verbose) {
                                console.log('Reconnection failed:', reconnectError.message);
                            }
                        }
                    }
                } else if (attempt < maxRetries) {
                    // For other errors, just wait a bit before retrying
                    await this.sleep(100);
                }
            }
        }
        
        throw new Error(`Read failed after ${maxRetries + 1} attempts: ${lastError.message}`);
    }
    
    // Comprehensive sync operation with bidirectional communication
    async sync(writePackets = [], expectReadBytes = 0, options = {}) {
        const {
            writeRetries = 2,
            readRetries = 2,
            readTimeout = 5000,
            validateConnection = true
        } = options;
        
        if (validateConnection && !await this.checkConnection()) {
            throw new Error('Device not connected for sync operation');
        }
        
        const result = {
            writeSuccess: false,
            readSuccess: false,
            writtenPackets: 0,
            readData: [],
            errors: []
        };
        
        try {
            // Write phase
            if (writePackets.length > 0) {
                if (this.verbose) {
                    console.log(`Sync: Writing ${writePackets.length} packets`);
                }
                
                await this.writeWithRetry(writePackets, writeRetries);
                result.writeSuccess = true;
                result.writtenPackets = writePackets.length;
            }
            
            // Read phase
            if (expectReadBytes > 0) {
                if (this.verbose) {
                    console.log(`Sync: Reading ${expectReadBytes} bytes`);
                }
                
                result.readData = await this.readBytes(expectReadBytes, readTimeout);
                result.readSuccess = result.readData.length > 0;
            }
            
        } catch (error) {
            result.errors.push(error.message);
            throw error;
        }
        
        if (this.verbose) {
            console.log('Sync operation completed:', result);
        }
        
        return result;
    }
}