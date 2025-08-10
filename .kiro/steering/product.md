# Product Overview

The Timex Datalink Client is a Ruby library that reimplements the original Timex Datalink client software for communicating with vintage Timex Datalink watches and compatible devices. These watches, introduced in 1994, receive data through an optical sensor using visible light patterns.

**Current Goal**: Port this Ruby library to JavaScript/Web Serial API to enable browser-based communication with Timex Datalink devices.

## Supported Devices

The library supports multiple protocol versions (1, 3, 4, 6, 7, 9) for various devices:
- Timex Datalink watches (50, 70, 150, 150s)
- Timex Ironman Triathlon
- Motorola Beepwear Pro
- DSI e-BRAIN
- Various PDAs and organizers

## Core Functionality

- **Data Transfer**: Currently sends data via serial communication with Notebook Adapter or compatible hardware
- **Protocol Support**: Implements byte-for-byte perfect recreation of original protocols
- **Device Features**: Manages alarms, time, appointments, phone numbers, and device-specific settings
- **Hardware Interface**: Currently communicates through serial devices with configurable timing parameters

## Web Serial Port Goals

- Translate Ruby protocol implementations to JavaScript
- Replace serial communication with Web Serial API
- Maintain byte-for-byte compatibility with original protocols
- Enable web browser access to Timex Datalink devices
- Preserve existing protocol structure and validation logic
- Create modern web app with Windows 98-style interface
- Support full bidirectional sync with modern services (Google Calendar, etc.)