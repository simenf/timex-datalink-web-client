# Contributing to Timex Datalink Web Client

Thank you for your interest in contributing to the Timex Datalink Web Client! This project aims to preserve and modernize access to vintage Timex Datalink devices through web technologies.

## Getting Started

### Prerequisites
- Node.js 16+ for development server
- Modern browser with Web Serial API support (Chrome 89+, Edge 89+)
- HTTPS connection (required for Web Serial API)
- Timex Datalink device and compatible adapter for testing

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/timex-datalink-web-client.git
   cd timex-datalink-web-client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `https://localhost:8000` (HTTPS required)

## Project Structure

```
├── lib/                    # Protocol implementations
│   ├── helpers/           # Shared utilities
│   ├── protocol1/         # Protocol 1 implementation
│   ├── protocol3/         # Protocol 3 implementation
│   └── ...
├── js/                    # Web application code
├── styles/               # CSS stylesheets
├── tests/                # Test files
├── docs/                 # Protocol documentation
└── index.html           # Main application entry
```

## How to Contribute

### Reporting Issues
- Use GitHub Issues to report bugs or request features
- Include browser version, device model, and steps to reproduce
- Attach screenshots or error messages when helpful

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test thoroughly:**
   - Test with actual hardware when possible
   - Verify browser compatibility
   - Check HTTPS requirements
5. **Commit with clear messages:**
   ```bash
   git commit -m "Add support for Protocol X feature"
   ```
6. **Push and create a Pull Request**

### Testing Guidelines

- **Hardware Testing**: Test with actual Timex Datalink devices when possible
- **Browser Testing**: Verify compatibility with Chrome 89+ and Edge 89+
- **Protocol Testing**: Use existing test files in `/tests/` directory
- **Manual Testing**: Open test files in browser at `https://localhost:8000/tests/`

### Code Style

- Use modern JavaScript (ES6+)
- Follow existing code patterns and naming conventions
- Add comments for complex protocol logic
- Keep functions focused and modular
- Maintain byte-for-byte compatibility with original protocols

### Protocol Implementation

When adding new protocol support:

1. **Study the original Ruby implementation** in the docs
2. **Create protocol files** following existing structure
3. **Implement byte-perfect compatibility** with original protocols
4. **Add comprehensive tests** with known good data
5. **Update documentation** with usage examples

### Documentation

- Update README.md for new features
- Add protocol documentation in `/docs/`
- Include code examples and usage instructions
- Document any breaking changes in CHANGELOG.md

## Development Philosophy

This project follows a "vibe coding" approach:
- **Ship working code** over perfect architecture
- **Keep it simple** - avoid unnecessary abstractions
- **Hardware compatibility first** - maintain byte-perfect protocols
- **Preserve the retro feel** - honor the vintage aesthetic

## Community Guidelines

- Be respectful and inclusive
- Help preserve vintage computing history
- Share knowledge about Timex Datalink devices
- Test with real hardware when possible
- Document your discoveries

## Questions?

- Open a GitHub Issue for technical questions
- Check existing documentation in `/docs/`
- Review the original Ruby implementation for reference

Thank you for helping keep these amazing vintage devices alive in the modern web!