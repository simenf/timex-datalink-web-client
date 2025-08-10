# Timex Datalink Web Client

A modern JavaScript implementation of the Timex Datalink client software for browser-based communication with vintage Timex Datalink watches using the Web Serial API.

This is a complete port of the Ruby implementation by [synthead](https://github.com/synthead/timex_datalink_client), rewritten from scratch for web browsers.

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

- ✅ **All 6 Protocols Fully Implemented** - Complete support for protocols 1, 3, 4, 6, 7, and 9
- ✅ **Web Serial API Integration** - Direct browser communication with serial devices
- ✅ **Protocol Abstraction Framework** - Multi-protocol support system with auto-detection
- ✅ **Complete Helper Utilities** - CRC, character encoding, validation, packet handling
- ✅ **Windows 98-Style Interface** - Nostalgic web interface for device management
- ✅ **Calendar Integration** - Google Calendar and local calendar sync support
- ✅ **Bidirectional Sync** - Full read/write support where protocols allow
- ✅ **Comprehensive Test Suite** - Hardware-compatible testing framework
- ✅ **Device Management** - Connection, detection, and protocol selection

### Protocol Support Status

| Protocol | Status | Devices | Features |
|----------|--------|---------|----------|
| **Protocol 1** | **✅ Complete** | **Datalink 50, 70** | **Time, Alarms, EEPROM (Appointments, Anniversaries, Lists, Phone Numbers)** |
| **Protocol 3** | **✅ Complete** | **Datalink 150** | **Time, Alarms, EEPROM, Sound Options, Sound Themes** |
| **Protocol 4** | **✅ Complete** | **Datalink 150s** | **Time, Alarms, EEPROM, Sound Options, Sound Themes, WristApps** |
| **Protocol 6** | **✅ Complete** | **Motorola Beepwear Pro** | **Time, Alarms, Pager Options, Night Mode, Sound/Scroll Options** |
| **Protocol 7** | **✅ Complete** | **DSI e-BRAIN** | **EEPROM, Calendar, Activities, Games, Speech, Phrase Builder** |
| **Protocol 9** | **✅ Complete** | **Timex Ironman Triathlon** | **Time, Time Names, Alarms, Timers, Sound Options** |

### Completed Features

- ✅ **Complete Protocol Suite** - All 6 protocols fully implemented and tested
- ✅ **Google Calendar Integration** - Sync appointments and events
- ✅ **Local Calendar Support** - Browser-based calendar management
- ✅ **Advanced Device Detection** - Auto-detection with protocol recommendations
- ✅ **Error Handling** - Comprehensive error handling with retry logic
- ✅ **Hardware Compatibility** - Works with original Notebook Adapter and Arduino devices

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

## Project Status

This project is **feature-complete** with all 6 Timex Datalink protocols fully implemented and tested. The JavaScript port maintains byte-for-byte compatibility with the original Ruby implementation while providing a modern web-based interface.

### Future Enhancements

- Enhanced web interface with more device-specific features
- Additional calendar service integrations (Outlook, Apple Calendar)
- Mobile browser optimization
- Advanced sync conflict resolution
- Protocol performance optimizations

## Acknowledgments

This project is a complete JavaScript port of the excellent Ruby implementation by [synthead](https://github.com/synthead/timex_datalink_client). While entirely rewritten for the web platform, it builds upon the protocol research and reverse engineering work done in the original project.

See [ACKNOWLEDGMENTS.md](ACKNOWLEDGMENTS.md) for detailed credits and references.