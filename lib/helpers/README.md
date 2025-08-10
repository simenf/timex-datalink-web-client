# Helper Utilities

This directory contains core helper utilities ported from the Ruby Timex Datalink Client library to JavaScript. These utilities provide the foundation for protocol implementations.

## Implemented Modules

### 1. CRC Packets Wrapper (`crc-packets-wrapper.js`)

Implements CRC16-ARC checksum calculation and packet wrapping functionality.

**Features:**
- CRC16-ARC algorithm with lookup table for performance
- Packet wrapping with CRC headers and footers
- Byte-for-byte compatibility with Ruby implementation

**Usage:**
```javascript
import { CrcPacketsWrapper } from './crc-packets-wrapper.js';

// Wrap a single packet
const packet = [0x20, 0x00, 0x00, 0x03];
const wrapped = CrcPacketsWrapper.wrapPacket(packet);
// Result: [7, 32, 0, 0, 3, 1, 254]

// Wrap multiple packets
const packets = [[0x20, 0x00, 0x00, 0x03], [0x21]];
const wrappedPackets = CrcPacketsWrapper.wrapPackets(packets);
```

### 2. Character Encoders (`character-encoders.js`)

Provides character encoding utilities for different data types and protocols.

**Features:**
- Multiple character maps (CHARS, EEPROM_CHARS, PHONE_CHARS, etc.)
- Basic character-to-index conversion with padding and length limits
- EEPROM encoding with 6-bit packing
- Phone number encoding with 4-bit packing
- Protocol 6 character support

**Usage:**
```javascript
import { CharacterEncoders } from './character-encoders.js';

// Basic character encoding
const chars = CharacterEncoders.charsFor('Hello World');
// Result: [17, 14, 21, 21, 24, 36, 32, 24, 27, 21, 13]

// EEPROM encoding with packing
const eepromData = CharacterEncoders.eepromCharsFor('Hello');
// Result: [145, 83, 85, 216, 15]

// Phone number encoding
const phoneData = CharacterEncoders.phoneCharsFor('1234567890');
// Result: [33, 67, 101, 135, 9]
```

### 3. Data Validator (`data-validator.js`)

JavaScript equivalent of ActiveModel validations for data integrity.

**Features:**
- Inclusion validation with ranges and arrays
- Comparison validation (greater than, less than, etc.)
- Conditional validation (if/unless)
- Custom validation rules
- Function-based valid values
- Comprehensive error messages

**Usage:**
```javascript
import { DataValidator, ValidationError, range } from './data-validator.js';

const validator = new DataValidator();

// Add validation rules
validator.validateInclusion('zone', {
  in: range(1, 2),
  message: '%{value} is invalid! Valid zones are 1..2.'
});

validator.validateInclusion('priority', {
  in: [1, 2, 3, 4, 5],
  allowNull: true
});

// Validate object
try {
  validator.validate({ zone: 1, priority: 3 }); // Passes
  validator.validate({ zone: 0, priority: 3 }); // Throws ValidationError
} catch (error) {
  console.log(error.message); // "Validation failed: Zone 0 is invalid! Valid zones are 1..2."
}
```

## Testing

All helper utilities include comprehensive tests that verify byte-for-byte compatibility with the Ruby implementation.

Run all tests:
```bash
node tests/run-all-tests.js
```

Run individual test suites:
```bash
node tests/helpers/crc-packets-wrapper.test.js
node tests/helpers/character-encoders.test.js
node tests/helpers/data-validator.test.js
```

## Compatibility

These utilities maintain exact compatibility with the Ruby Timex Datalink Client library:

- **CRC calculations** produce identical checksums
- **Character encoding** generates identical byte arrays
- **Validation behavior** matches ActiveModel validation patterns
- **Error messages** follow the same format and content

## Next Steps

With these helper utilities complete, the next phase is to implement Protocol 3 components:

1. Protocol3.Start - Protocol initialization
2. Protocol3.Sync - Synchronization sequences  
3. Protocol3.Time - Time data handling
4. Protocol3.End - Protocol termination
5. Protocol3.Alarm - Alarm management
6. Protocol3.EEPROM - EEPROM data classes

Each protocol component will use these helper utilities for CRC wrapping, character encoding, and data validation.