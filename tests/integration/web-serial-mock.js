/**
 * Mock implementation of Web Serial API for testing
 * 
 * Provides a fake serial port that can simulate device communication
 * without requiring actual hardware or browser Web Serial API support.
 */

class MockSerialPort {
  constructor(options = {}) {
    this.isOpen = false;
    this.readable = null;
    this.writable = null;
    this.writtenData = [];
    this.readData = [];
    this.readIndex = 0;
    this.options = {
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      ...options
    };
    
    // Simulate device responses
    this.deviceResponses = new Map();
    this.setupDefaultResponses();
  }
  
  /**
   * Set up default device responses for common packets
   */
  setupDefaultResponses() {
    // Start packet response (acknowledge)
    this.deviceResponses.set('start', new Uint8Array([0x06])); // ACK
    
    // Sync packet response
    this.deviceResponses.set('sync', new Uint8Array([0x06])); // ACK
    
    // Time packet response
    this.deviceResponses.set('time', new Uint8Array([0x06])); // ACK
    
    // End packet response
    this.deviceResponses.set('end', new Uint8Array([0x06])); // ACK
    
    // Default response for unknown packets
    this.deviceResponses.set('default', new Uint8Array([0x15])); // NAK
  }
  
  /**
   * Mock the open() method
   */
  async open(options = {}) {
    if (this.isOpen) {
      throw new Error('Port is already open');
    }
    
    this.isOpen = true;
    this.options = { ...this.options, ...options };
    
    // Create mock readable and writable streams
    this.readable = new MockReadableStream(this);
    this.writable = new MockWritableStream(this);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  /**
   * Mock the close() method
   */
  async close() {
    if (!this.isOpen) {
      return;
    }
    
    this.isOpen = false;
    this.readable = null;
    this.writable = null;
    
    // Simulate disconnection delay
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  
  /**
   * Get the data that was written to the port
   */
  getWrittenData() {
    return this.writtenData.slice();
  }
  
  /**
   * Clear written data history
   */
  clearWrittenData() {
    this.writtenData = [];
  }
  
  /**
   * Set data to be read from the port
   */
  setReadData(data) {
    this.readData = Array.from(data);
    this.readIndex = 0;
  }
  
  /**
   * Simulate device response based on written data
   */
  simulateDeviceResponse(data) {
    // Analyze the packet to determine appropriate response
    const packet = Array.from(data);
    
    // Check for known packet types
    if (packet.includes(0x20)) { // Start packet
      return this.deviceResponses.get('start');
    } else if (packet.includes(0x78)) { // Sync packet
      return this.deviceResponses.get('sync');
    } else if (packet.includes(0x32)) { // Time packet
      return this.deviceResponses.get('time');
    } else if (packet.includes(0x21)) { // End packet
      return this.deviceResponses.get('end');
    }
    
    return this.deviceResponses.get('default');
  }
}

class MockReadableStream {
  constructor(port) {
    this.port = port;
    this.locked = false;
  }
  
  getReader() {
    if (this.locked) {
      throw new Error('Stream is already locked');
    }
    
    this.locked = true;
    return new MockReader(this.port, this);
  }
}

class MockWritableStream {
  constructor(port) {
    this.port = port;
    this.locked = false;
  }
  
  getWriter() {
    if (this.locked) {
      throw new Error('Stream is already locked');
    }
    
    this.locked = true;
    return new MockWriter(this.port, this);
  }
}

class MockReader {
  constructor(port, stream) {
    this.port = port;
    this.stream = stream;
    this.closed = false;
  }
  
  async read() {
    if (this.closed) {
      return { done: true, value: undefined };
    }
    
    if (this.port.readIndex >= this.port.readData.length) {
      // No more data to read, simulate waiting
      await new Promise(resolve => setTimeout(resolve, 10));
      return { done: false, value: new Uint8Array([]) };
    }
    
    const value = new Uint8Array([this.port.readData[this.port.readIndex]]);
    this.port.readIndex++;
    
    return { done: false, value };
  }
  
  releaseLock() {
    this.stream.locked = false;
  }
  
  async cancel() {
    this.closed = true;
    this.releaseLock();
  }
}

class MockWriter {
  constructor(port, stream) {
    this.port = port;
    this.stream = stream;
    this.closed = false;
  }
  
  async write(data) {
    if (this.closed) {
      throw new Error('Writer is closed');
    }
    
    // Store written data
    this.port.writtenData.push(...Array.from(data));
    
    // Simulate device response
    const response = this.port.simulateDeviceResponse(data);
    if (response && response.length > 0) {
      this.port.setReadData(response);
    }
    
    // Simulate write delay
    await new Promise(resolve => setTimeout(resolve, 1));
  }
  
  releaseLock() {
    this.stream.locked = false;
  }
  
  async close() {
    this.closed = true;
    this.releaseLock();
  }
}

/**
 * Mock Web Serial API
 */
class MockSerial {
  constructor() {
    this.ports = [];
  }
  
  /**
   * Mock requestPort() method
   */
  async requestPort(options = {}) {
    // Simulate user selecting a port
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const port = new MockSerialPort();
    this.ports.push(port);
    return port;
  }
  
  /**
   * Mock getPorts() method
   */
  async getPorts() {
    return this.ports.slice();
  }
  
  /**
   * Add a pre-configured port for testing
   */
  addMockPort(options = {}) {
    const port = new MockSerialPort(options);
    this.ports.push(port);
    return port;
  }
  
  /**
   * Clear all ports
   */
  clearPorts() {
    this.ports = [];
  }
}

// Global mock serial instance
const mockSerial = new MockSerial();

// Store original navigator for restoration
let originalNavigator = null;

/**
 * Install the mock Web Serial API globally
 */
function installMockWebSerial() {
  if (typeof global !== 'undefined') {
    // Node.js environment
    originalNavigator = global.navigator;
    
    // Create a new navigator object with our mock serial
    global.navigator = {
      ...originalNavigator,
      serial: mockSerial
    };
  } else if (typeof window !== 'undefined') {
    // Browser environment
    originalNavigator = window.navigator;
    window.navigator = {
      ...originalNavigator,
      serial: mockSerial
    };
  }
}

/**
 * Uninstall the mock Web Serial API
 */
function uninstallMockWebSerial() {
  if (typeof global !== 'undefined') {
    global.navigator = originalNavigator;
  } else if (typeof window !== 'undefined') {
    window.navigator = originalNavigator;
  }
  originalNavigator = null;
}

export {
  MockSerialPort,
  MockSerial,
  mockSerial,
  installMockWebSerial,
  uninstallMockWebSerial
};