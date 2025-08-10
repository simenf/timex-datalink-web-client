/**
 * Protocol Templates
 * 
 * Template implementations for Protocol 1, 4, 6, 7, and 9.
 * These serve as starting points for full implementations and demonstrate
 * how the protocol abstraction framework accommodates different protocols.
 */

import { ProtocolBase, ProtocolComponentBase } from './protocol-base.js';
import CrcPacketsWrapper from './helpers/crc-packets-wrapper.js';

// ============================================================================
// PROTOCOL 1 TEMPLATE
// ============================================================================

/**
 * Basic Start component for Protocol 1
 */
class Protocol1Start extends ProtocolComponentBase {
  static CPACKET_START = [0x20, 0x00, 0x00, 0x01];

  packets() {
    const rawPackets = [Protocol1Start.CPACKET_START];
    return CrcPacketsWrapper.wrapPackets(rawPackets);
  }
}

/**
 * Basic End component for Protocol 1
 */
class Protocol1End extends ProtocolComponentBase {
  static CPACKET_END = [0x21, 0x00, 0x00, 0x01];

  packets() {
    const rawPackets = [Protocol1End.CPACKET_END];
    return CrcPacketsWrapper.wrapPackets(rawPackets);
  }
}

export class Protocol1 extends ProtocolBase {
  static get VERSION() { return 1; }
  static get NAME() { return 'Protocol 1'; }
  static get SUPPORTED_DEVICES() {
    return [
      'Timex Datalink 50',
      'Timex Datalink 70',
      'Generic Protocol 1 Device'
    ];
  }
  static get CAPABILITIES() {
    return {
      bidirectional: false,
      time: true,
      alarms: true,
      eeprom: true,
      soundOptions: false,
      wristApps: false
    };
  }
  static get START_PACKET() { return [0x20, 0x00, 0x00, 0x01]; }

  static getComponents() {
    return {
      Start: Protocol1Start,
      End: Protocol1End
      // Additional components would be implemented here
    };
  }
}

// ============================================================================
// PROTOCOL 4 TEMPLATE
// ============================================================================

class Protocol4Start extends ProtocolComponentBase {
  static CPACKET_START = [0x20, 0x00, 0x00, 0x04];

  packets() {
    const rawPackets = [Protocol4Start.CPACKET_START];
    return CrcPacketsWrapper.wrapPackets(rawPackets);
  }
}

class Protocol4End extends ProtocolComponentBase {
  static CPACKET_END = [0x21, 0x00, 0x00, 0x04];

  packets() {
    const rawPackets = [Protocol4End.CPACKET_END];
    return CrcPacketsWrapper.wrapPackets(rawPackets);
  }
}

export class Protocol4 extends ProtocolBase {
  static get VERSION() { return 4; }
  static get NAME() { return 'Protocol 4'; }
  static get SUPPORTED_DEVICES() {
    return [
      'Timex Datalink Internet Messenger',
      'Timex Datalink USB',
      'Generic Protocol 4 Device'
    ];
  }
  static get CAPABILITIES() {
    return {
      bidirectional: true,
      time: true,
      alarms: true,
      eeprom: true,
      soundOptions: true,
      soundTheme: true,
      wristApps: true
    };
  }
  static get START_PACKET() { return [0x20, 0x00, 0x00, 0x04]; }

  static getComponents() {
    return {
      Start: Protocol4Start,
      End: Protocol4End
      // Additional components would be implemented here
    };
  }
}

// ============================================================================
// PROTOCOL 6 TEMPLATE
// ============================================================================

class Protocol6Start extends ProtocolComponentBase {
  static CPACKET_START = [0x20, 0x00, 0x00, 0x06];

  packets() {
    const rawPackets = [Protocol6Start.CPACKET_START];
    return CrcPacketsWrapper.wrapPackets(rawPackets);
  }
}

class Protocol6End extends ProtocolComponentBase {
  static CPACKET_END = [0x21, 0x00, 0x00, 0x06];

  packets() {
    const rawPackets = [Protocol6End.CPACKET_END];
    return CrcPacketsWrapper.wrapPackets(rawPackets);
  }
}

export class Protocol6 extends ProtocolBase {
  static get VERSION() { return 6; }
  static get NAME() { return 'Protocol 6'; }
  static get SUPPORTED_DEVICES() {
    return [
      'Motorola Beepwear Pro',
      'Generic Protocol 6 Device'
    ];
  }
  static get CAPABILITIES() {
    return {
      bidirectional: false,
      time: true,
      alarms: true,
      eeprom: true,
      soundOptions: true,
      pagerOptions: true,
      nightMode: true
    };
  }
  static get START_PACKET() { return [0x20, 0x00, 0x00, 0x06]; }

  static getComponents() {
    return {
      Start: Protocol6Start,
      End: Protocol6End
      // Additional components would be implemented here:
      // PagerOptions, NightModeOptions, SoundScrollOptions
    };
  }
}

// ============================================================================
// PROTOCOL 7 TEMPLATE
// ============================================================================

class Protocol7Start extends ProtocolComponentBase {
  static CPACKET_START = [0x20, 0x00, 0x00, 0x07];

  packets() {
    const rawPackets = [Protocol7Start.CPACKET_START];
    return CrcPacketsWrapper.wrapPackets(rawPackets);
  }
}

class Protocol7End extends ProtocolComponentBase {
  static CPACKET_END = [0x21, 0x00, 0x00, 0x07];

  packets() {
    const rawPackets = [Protocol7End.CPACKET_END];
    return CrcPacketsWrapper.wrapPackets(rawPackets);
  }
}

export class Protocol7 extends ProtocolBase {
  static get VERSION() { return 7; }
  static get NAME() { return 'Protocol 7'; }
  static get SUPPORTED_DEVICES() {
    return [
      'DSI e-BRAIN',
      'Generic Protocol 7 Device'
    ];
  }
  static get CAPABILITIES() {
    return {
      bidirectional: false,
      time: false,
      alarms: false,
      eeprom: true,
      calendar: true,
      activities: true,
      games: true,
      speech: true,
      phraseBuilder: true
    };
  }
  static get START_PACKET() { return [0x20, 0x00, 0x00, 0x07]; }

  static getComponents() {
    return {
      Start: Protocol7Start,
      End: Protocol7End
      // Additional components would be implemented here:
      // Calendar, Activities, Games, Speech, PhraseBuilder
    };
  }

  static isCompatible(deviceInfo) {
    // Protocol 7 has unique characteristics for DSI e-BRAIN
    if (deviceInfo.model && deviceInfo.model.toLowerCase().includes('e-brain')) {
      return true;
    }
    if (deviceInfo.identifier && deviceInfo.identifier.toLowerCase().includes('dsi')) {
      return true;
    }
    return super.isCompatible(deviceInfo);
  }
}

// ============================================================================
// PROTOCOL 9 TEMPLATE
// ============================================================================

class Protocol9Start extends ProtocolComponentBase {
  static CPACKET_START = [0x20, 0x00, 0x00, 0x09];

  packets() {
    const rawPackets = [Protocol9Start.CPACKET_START];
    return CrcPacketsWrapper.wrapPackets(rawPackets);
  }
}

class Protocol9End extends ProtocolComponentBase {
  static CPACKET_END = [0x21, 0x00, 0x00, 0x09];

  packets() {
    const rawPackets = [Protocol9End.CPACKET_END];
    return CrcPacketsWrapper.wrapPackets(rawPackets);
  }
}

export class Protocol9 extends ProtocolBase {
  static get VERSION() { return 9; }
  static get NAME() { return 'Protocol 9'; }
  static get SUPPORTED_DEVICES() {
    return [
      'Timex Ironman Triathlon',
      'Generic Protocol 9 Device'
    ];
  }
  static get CAPABILITIES() {
    return {
      bidirectional: false,
      time: true,
      timeName: true,
      alarms: true,
      timer: true,
      eeprom: true,
      chrono: true,
      soundOptions: true
    };
  }
  static get START_PACKET() { return [0x20, 0x00, 0x00, 0x09]; }

  static getComponents() {
    return {
      Start: Protocol9Start,
      End: Protocol9End
      // Additional components would be implemented here:
      // TimeName, Timer, Chrono
    };
  }

  static isCompatible(deviceInfo) {
    // Protocol 9 is specific to Ironman Triathlon watches
    if (deviceInfo.model && deviceInfo.model.toLowerCase().includes('ironman')) {
      return true;
    }
    if (deviceInfo.model && deviceInfo.model.toLowerCase().includes('triathlon')) {
      return true;
    }
    return super.isCompatible(deviceInfo);
  }
}

// ============================================================================
// PROTOCOL TEMPLATE UTILITIES
// ============================================================================

/**
 * Get all template protocols
 */
export function getAllProtocolTemplates() {
  return [Protocol1, Protocol4, Protocol6, Protocol7, Protocol9];
}

/**
 * Register all template protocols with the registry
 */
export function registerAllTemplates(registry) {
  const templates = getAllProtocolTemplates();
  
  for (const ProtocolClass of templates) {
    try {
      registry.register(ProtocolClass);
      console.log(`Registered template: ${ProtocolClass.NAME}`);
    } catch (error) {
      console.warn(`Failed to register template ${ProtocolClass.NAME}: ${error.message}`);
    }
  }
  
  return templates.length;
}

/**
 * Create a new protocol template
 */
export function createProtocolTemplate(version, name, options = {}) {
  const {
    supportedDevices = [`Generic Protocol ${version} Device`],
    capabilities = {},
    startPacket = [0x20, 0x00, 0x00, version],
    endPacket = [0x21, 0x00, 0x00, version]
  } = options;

  // Create Start component
  class TemplateStart extends ProtocolComponentBase {
    static CPACKET_START = startPacket;

    packets() {
      const rawPackets = [TemplateStart.CPACKET_START];
      return CrcPacketsWrapper.wrapPackets(rawPackets);
    }
  }

  // Create End component
  class TemplateEnd extends ProtocolComponentBase {
    static CPACKET_END = endPacket;

    packets() {
      const rawPackets = [TemplateEnd.CPACKET_END];
      return CrcPacketsWrapper.wrapPackets(rawPackets);
    }
  }

  // Create Protocol class
  class TemplateProtocol extends ProtocolBase {
    static get VERSION() { return version; }
    static get NAME() { return name; }
    static get SUPPORTED_DEVICES() { return supportedDevices; }
    static get CAPABILITIES() { return capabilities; }
    static get START_PACKET() { return startPacket; }

    static getComponents() {
      return {
        Start: TemplateStart,
        End: TemplateEnd
      };
    }
  }

  return TemplateProtocol;
}