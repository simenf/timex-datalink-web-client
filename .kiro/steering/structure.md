# Project Structure

## Root Level
- `lib/` - Main library code
- `spec/` - RSpec test files (mirrors lib structure)
- `docs/` - Protocol documentation and guides
- `Gemfile` - Dependency management
- `timex_datalink_client.gemspec` - Gem specification
- `.rubocop.yml` - Code style configuration

## Library Organization (`lib/timex_datalink_client/`)

### Core Files
- `timex_datalink_client.rb` - Main entry point and client class
- `notebook_adapter.rb` - Serial communication interface
- `version.rb` - Gem version constant

### Protocol Structure
Each protocol follows the same organizational pattern:
```
protocol_X/
├── alarm.rb              # Alarm management
├── eeprom.rb            # EEPROM data handling
├── eeprom/              # EEPROM data types
│   ├── anniversary.rb
│   ├── appointment.rb
│   ├── list.rb
│   └── phone_number.rb
├── end.rb               # Protocol termination
├── start.rb             # Protocol initialization
├── sync.rb              # Synchronization
├── time.rb              # Time setting
└── [protocol-specific files]
```

### Helpers (`lib/timex_datalink_client/helpers/`)
- `char_encoders.rb` - Character encoding utilities
- `crc_packets_wrapper.rb` - CRC packet wrapping
- `cpacket_paginator.rb` - Packet pagination
- `four_byte_formatter.rb` - 4-byte data formatting
- `length_packet_wrapper.rb` - Length-prefixed packets
- `lsb_msb_formatter.rb` - Byte order formatting

## Testing Structure (`spec/`)
- Mirrors `lib/` directory structure exactly
- `spec_helper.rb` - Test configuration and shared setup
- `helpers/` - Test helper modules (CrcHelpers, LengthPacketHelpers)
- `fixtures/` - Test data files (.SPC, .ZAP files)

## Naming Conventions
- **Classes**: PascalCase (e.g., `TimexDatalinkClient::Protocol1::Alarm`)
- **Files**: snake_case matching class names
- **Constants**: SCREAMING_SNAKE_CASE
- **Methods**: snake_case
- **Spec files**: `*_spec.rb` suffix