# Timex Datalink Web Client

A modern JavaScript implementation of the Timex Datalink client software for browser-based communication with vintage Timex Datalink watches using the Web Serial API.

![Timex Datalink Watch](https://user-images.githubusercontent.com/820984/209043607-a449b764-42f9-4f92-9a32-cd0665551289.jpg)

## What is the Timex Datalink?

The Timex Datalink is a watch introduced in 1994 that functions as a small PDA on your wrist. The early models have an optical sensor that receives data via visible light patterns. This web client enables modern browsers to communicate with these vintage devices using the Web Serial API.

## Features

- **Protocol Support**: Implements protocols 1, 3, 4, 6, 7, and 9 for various Timex Datalink devices
- **Web Serial API**: Direct browser communication with serial devices
- **Modern Interface**: Windows 98-style web interface for nostalgic experience
- **Calendar Integration**: Sync with Google Calendar and local calendar data
- **Device Management**: Set time, alarms, appointments, and phone numbers
- **Hardware Compatibility**: Works with Notebook Adapter or compatible Arduino devices

## Supported Devices

- Timex Datalink 50 (protocol 1)
- Timex Datalink 70 (protocol 1)  
- Timex Datalink 150 (protocol 3)
- Timex Datalink 150s (protocol 4)
- Timex Ironman Triathlon (protocol 9)
- Motorola Beepwear Pro (protocol 6)
- DSI e-BRAIN (protocol 7)
- Various PDAs and organizers

## Browser Requirements

- Chrome 89+ or Edge 89+
- Web Serial API support
- HTTPS connection (required for Web Serial API)

## Quick Start

1. **Clone and serve the application:**
   ```bash
   git clone https://github.com/yourusername/timex-datalink-web-client.git
   cd timex-datalink-web-client
   npm install
   npm run serve
   ```

2. **Open in browser:**
   Navigate to `https://localhost:8000` (HTTPS required for Web Serial API)

3. **Connect your device:**
   - Connect your Timex Datalink Notebook Adapter or compatible device
   - Click "Connect Device" in the web interface
   - Select your serial device from the browser prompt

4. **Sync your watch:**
   - Put your watch in COMM MODE
   - Select the appropriate protocol for your device
   - Use the interface to set time, alarms, or sync calendar data

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run serve

# Run tests
npm test
```

## Protocol Documentation

Each protocol is documented with implementation details:

- [Protocol 1](docs/timex_datalink_protocol_1.md) - Timex Datalink 50 & 70
- [Protocol 3](docs/timex_datalink_protocol_3.md) - Timex Datalink 150  
- [Protocol 4](docs/timex_datalink_protocol_4.md) - Timex Datalink 150s
- [Protocol 6](docs/motorola_beepwear_pro_protocol_6.md) - Motorola Beepwear Pro
- [Protocol 7](docs/dsi_ebrain_protocol_7.md) - DSI e-BRAIN
- [Protocol 9](docs/timex_ironman_triathlon_protocol_9.md) - Timex Ironman Triathlon

## Hardware Setup

### Using the Original Notebook Adapter
Connect your Timex Datalink Notebook Adapter to a USB-to-serial converter, then connect to your computer.

### Using Arduino/Teensy
Build a compatible adapter using the [Timex Datalink Arduino project](https://github.com/synthead/timex-datalink-arduino).

## Deployment

This application is designed to work with:
- **Cloudflare Pages**: Automatic deployment from GitHub
- **GitHub Pages**: Static site hosting
- **Any static host**: All files are client-side JavaScript

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with actual hardware when possible
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Original Ruby implementation by [synthead](https://github.com/synthead/timex_datalink_client)
- Timex for creating these amazing vintage devices
- NASA for certifying these watches for space travel!

## Fun Fact

These watches are flight certified by NASA and qualified for space travel. James H. Newman wore a Datalink watch on Space Shuttle mission STS-88!