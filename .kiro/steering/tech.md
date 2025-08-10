# Technology Stack

## Current (Ruby)
- **Ruby**: Minimum version 3.1.0
- **Dependencies**: ActiveModel, CRC, MDB, UART gems for core functionality

## Target (Web Serial Port)
- **JavaScript/TypeScript**: Modern ES modules
- **Web Serial API**: Browser-based serial communication
- **Target Environment**: Modern web browsers with Web Serial API support

## Build System & Tools (Current)
- **Bundler**: Dependency management via Gemfile
- **RSpec**: Testing framework with custom helpers and shared examples
- **RuboCop**: Code linting with GitHub style guide inheritance
- **MDL**: Markdown linting
- **YARD**: Documentation generation

## Common Commands (Current Ruby)

### Development Setup
```bash
bundle install          # Install dependencies
```

### Testing
```bash
bundle exec rspec       # Run all tests
bundle exec rspec spec/lib/timex_datalink_client/protocol_1/  # Run specific protocol tests
```

### Code Quality
```bash
bundle exec rubocop     # Run linter
bundle exec mdl .       # Lint markdown files
```

### Gem Management
```bash
gem build timex_datalink_client.gemspec    # Build gem
gem install timex_datalink_client-*.gem    # Install locally
```

## Architecture Patterns (To Preserve in Port)
- **Protocol-based organization**: Each protocol version has its own namespace/module
- **Input validation**: Equivalent validation logic for data integrity
- **Helper utilities**: Shared functionality for character encoding, CRC, packet formatting
- **Packet compilation**: Models generate byte arrays for USB transmission
- **Hardware abstraction**: Replace NotebookAdapter with WebUSB interface

## Web Serial Port Considerations
- Replace Ruby's UART gem with Web Serial API calls
- Translate ActiveModel validations to JavaScript validation
- Maintain exact byte-level protocol compatibility
- Preserve timing parameters for reliable data transmission