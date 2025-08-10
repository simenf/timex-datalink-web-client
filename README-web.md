# Timex Datalink Web Client

A JavaScript port of the Ruby Timex Datalink Client library, enabling browser-based communication with vintage Timex Datalink watches using the Web Serial API.

## Project Structure

```
├── web/                    # Web application
│   ├── index.html         # Main HTML page with Windows 98 styling
│   ├── styles/
│   │   └── windows98.css  # Windows 98 retro styling
│   └── js/
│       └── app.js         # Main application entry point
├── lib/                   # Core JavaScript library
│   ├── timex-datalink-client.js  # Main client class
│   └── serial-adapter.js         # Web Serial API adapter
├── tests/                 # Test suite
│   ├── test-runner.html   # Browser-based test runner
│   └── test-suite.js      # Test framework and test cases
└── README-web.md          # This file
```

## Getting Started

### Prerequisites

- Modern web browser with Web Serial API support (Chrome 89+, Edge 89+)
- Timex Datalink compatible device with serial adapter

### Running the Application

1. Serve the files using a local web server (required for ES6 modules):
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8000/web/
   ```

3. Click "Connect Device" to establish a connection with your Timex Datalink device

### Running Tests

Open the test runner in your browser:
```
http://localhost:8000/tests/test-runner.html
```

## Features

### Current Implementation

- ✅ Project structure with ES6 modules
- ✅ Basic HTML structure with Windows 98 styling
- ✅ Core TimexDatalinkClient class with protocol abstraction
- ✅ SerialAdapter class for Web Serial API communication
- ✅ **Protocol Abstraction Framework** - Multi-protocol support system
- ✅ **Protocol 3 Complete Implementation** - Full Protocol 3 support
- ✅ Protocol templates for future expansion (1, 4, 6, 7, 9)
- ✅ CRC packet wrapping and character encoding
- ✅ Bidirectional sync support
- ✅ Comprehensive test framework
- ✅ Device connection and protocol detection

### Protocol Support Status

| Protocol | Status | Devices | Features |
|----------|--------|---------|----------|
| Protocol 1 | Template | Datalink 50, 70 | Time, Alarms, EEPROM |
| **Protocol 3** | **Complete** | **Datalink 150, 150s** | **Time, Alarms, EEPROM, Sound, Bidirectional** |
| Protocol 4 | Template | Internet Messenger | Time, Alarms, EEPROM, Sound, WristApps |
| Protocol 6 | Template | Beepwear Pro | Time, Alarms, EEPROM, Pager |
| Protocol 7 | Template | DSI e-BRAIN | Calendar, Activities, Games, Speech |
| Protocol 9 | Template | Ironman Triathlon | Time, Alarms, Timer, Chrono |

### Planned Features

- Google Calendar integration
- Enhanced error handling and user feedback
- Additional protocol implementations (completing templates)
- Advanced device detection and management

## Architecture

The web client uses a modern protocol abstraction framework:

### Core Components

- **TimexDatalinkClient**: Main client class with protocol detection and management
- **SerialAdapter**: Web Serial API communication with bidirectional support
- **Protocol Abstraction Framework**: Multi-protocol support system
  - **ProtocolBase**: Abstract base class for all protocols
  - **ProtocolRegistry**: Central protocol registration and detection
  - **ProtocolFactory**: Protocol and component instantiation
  - **ProtocolManager**: High-level protocol management

### Protocol Structure

Each protocol implementation includes:
- Protocol class extending ProtocolBase
- Component classes (Start, Time, Alarm, etc.)
- Device compatibility detection
- Protocol-specific validation and features

### Helper Utilities

- **CrcPacketsWrapper**: CRC16-ARC calculation and packet wrapping
- **CharacterEncoders**: Character encoding for watch displays
- **DataValidator**: Input validation framework
- **LengthPacketWrapper**: Length-prefixed packet handling

## Browser Compatibility

- **Chrome 89+**: Full Web Serial API support
- **Edge 89+**: Full Web Serial API support
- **Firefox**: Behind experimental flag
- **Safari**: Not supported

## Development Notes

This is a Proof of Concept (POC) implementation focusing on:
- Simple, direct solutions
- Minimal dependencies
- Browser-native ES6 modules
- Byte-for-byte compatibility with Ruby implementation
- Windows 98 retro aesthetic

## Usage Examples

### Basic Protocol Detection and Sync

```javascript
import { TimexDatalinkClient } from './lib/timex-datalink-client.js';

const client = new TimexDatalinkClient({ verbose: true });

// Auto-detect protocol from device
const deviceInfo = { model: 'Timex Datalink 150' };
await client.detectProtocol(deviceInfo);

// Sync time and alarms
await client.syncWithProtocol({
  time: {
    zone: 1,
    is24h: false,
    dateFormat: "%_m-%d-%y",
    time: new Date()
  },
  alarms: [{
    number: 1,
    time: new Date(Date.now() + 3600000), // 1 hour from now
    enabled: true,
    message: 'Meeting'
  }]
});
```

### Manual Protocol Selection

```javascript
// Set protocol manually if auto-detection fails
client.setProtocol(3, { model: 'Timex Datalink 150' });

// Get protocol recommendations
const recommendations = client.getProtocolRecommendations();
console.log('Recommended protocols:', recommendations);
```

### Direct Component Usage

```javascript
import { ProtocolFactory } from './lib/protocol-factory.js';

// Create protocol instance
const protocol = ProtocolFactory.createProtocol(3);

// Create specific components
const timeComponent = protocol.createComponent('Time', {
  zone: 1,
  time: new Date()
});

const packets = timeComponent.packets();
```

## Documentation

- **[Protocol Expansion Guide](docs/protocol-expansion-guide.md)** - Complete guide for implementing new protocols
- **[Protocol Quick Reference](docs/protocol-quick-reference.md)** - Quick reference for developers
- **[Protocol Migration Guide](docs/protocol-migration-guide.md)** - Migrating existing code to the new framework

## Next Steps

1. Implement Google Calendar integration
2. Complete remaining protocol implementations
3. Add enhanced error handling and user feedback
4. Optimize performance and add advanced features