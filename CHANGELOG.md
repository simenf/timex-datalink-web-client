# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-08-10

### Added
- Complete JavaScript port of Timex Datalink client protocols
- Protocol 1 implementation (Timex Datalink 50, 70)
- Protocol 3 implementation (Timex Datalink 150)
- Protocol 4 implementation (Timex Datalink 150s)
- Protocol 6 implementation (Motorola Beepwear Pro)
- Protocol 7 implementation (DSI e-BRAIN)
- Protocol 9 implementation (Timex Ironman Triathlon)
- Web Serial API integration for browser communication
- Helper utilities for CRC, character encoding, and validation
- Protocol factory and registry system
- Comprehensive test suite
- Windows 98-style web interface
- Google Calendar integration
- Local calendar support
- Device detection and auto-protocol selection
- Serial adapter with retry logic and error handling
- Complete documentation for all protocols

### Technical Details
- Pure JavaScript ES6 modules (no build step required)
- Byte-for-byte compatibility with original Ruby implementation
- Modern browser support (Chrome 89+, Edge 89+)
- HTTPS-ready for Web Serial API requirements
- Modular architecture for easy protocol extension

### Initial Release
This represents a complete port from the Ruby implementation at:
https://github.com/synthead/timex_datalink_client