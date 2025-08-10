# Task Guidelines

## Context

I am a solo developer working on personal/small projects
This is NOT an enterprise-level project
I prefer simple, direct solutions over "best practices"
I'm a vibe coder who values shipping over perfect architecture

## What to do

Always assume this is a POC (Proof of Concept) unless explicitly told otherwise
Keep it simple and direct - don't overthink it
Start with the most obvious solution that works
No frameworks unless absolutely necessary
Prefer single files over multiple files when reasonable
Hardcode reasonable defaults instead of building configuration systems

## What NOT to do

Don't add abstractions until we actually need them
Don't build for imaginary future requirements
Don't add complex error handling for edge cases that probably won't happen
Don't suggest design patterns unless the problem actually requires them
Don't optimize prematurely
Don't add configuration for things that rarely change

## Web Serial Port Specific Guidelines

- Focus on getting Protocol 3 working first (target protocol for initial implementation)
- Start with hardcoded device connection rather than device discovery
- Copy the exact byte sequences from Ruby tests as reference data
- Don't worry about perfect error handling initially - just get data flowing
- Use simple JavaScript modules, avoid build tools until needed
- Test with actual hardware when possible, mock when not
- Build web app with Windows 98 aesthetic after core protocol is working
- Support full sync (read/write) functionality where available