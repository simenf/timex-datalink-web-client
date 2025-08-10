# Changelog

All notable changes to the Timex Datalink Web Client will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-10

### Added
- Complete JavaScript port of the Ruby Timex Datalink Client library
- Web Serial API support for browser-based device communication
- Protocol implementations for protocols 1, 3, 4, 6, 7, and 9
- Windows 98-style web interface for nostalgic user experience
- Google Calendar integration for appointment syncing
- Local calendar management system
- Device connection and management interface
- Comprehensive test suite for protocol implementations
- Protocol documentation and usage guides
- GitHub Actions workflow for CI/CD
- Cloudflare Pages deployment configuration

### Changed
- Migrated from Ruby to JavaScript for browser compatibility
- Replaced serial communication with Web Serial API
- Updated user interface from desktop to web-based
- Modernized development workflow and deployment process

### Removed
- Ruby implementation and dependencies
- Desktop application requirements
- Python development server scripts

## [0.1.0] - Development Phase

### Added
- Initial JavaScript protocol implementations
- Basic web interface development
- Calendar integration prototypes
- Test framework setup