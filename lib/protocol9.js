/**
 * Protocol 9 Class
 * Complete Protocol 9 implementation extending ProtocolBase
 * Ported from Ruby TimexDatalinkClient::Protocol9
 */

import { ProtocolBase } from './protocol-base.js';
import { DataValidator, ValidationError, range } from './helpers/data-validator.js';
import { CharacterEncoders } from './helpers/character-encoders.js';
import CrcPacketsWrapper from './helpers/crc-packets-wrapper.js';

// Protocol 9 Start Component
class Protocol9Start {
  static CPACKET_START = [0x20, 0x00, 0x00, 0x09];

  packets() {
    return CrcPacketsWrapper.wrapPackets([Protocol9Start.CPACKET_START]);
  }
}

// Protocol 9 End Component
class Protocol9End {
  static CPACKET_SKIP = [0x21];

  packets() {
    return CrcPacketsWrapper.wrapPackets([Protocol9End.CPACKET_SKIP]);
  }
}

// Protocol 9 Sync Component
class Protocol9Sync {
  static PING_BYTE = [0x78];
  static SYNC_1_BYTE = [0x55];
  static SYNC_2_BYTE = [0xaa];
  static SYNC_2_LENGTH = 40;

  constructor({ length = 300 } = {}) {
    this.length = length;
  }

  packets() {
    return [
      [
        ...Protocol9Sync.PING_BYTE,
        ...this.renderSync1(),
        ...this.renderSync2()
      ]
    ];
  }

  renderSync1() {
    return new Array(this.length).fill(Protocol9Sync.SYNC_1_BYTE[0]);
  }

  renderSync2() {
    return new Array(Protocol9Sync.SYNC_2_LENGTH).fill(Protocol9Sync.SYNC_2_BYTE[0]);
  }
}

// Protocol 9 Time Component
class Protocol9Time {
  static CPACKET_TIME = [0x30];

  constructor({ zone, is24h, time }) {
    this.zone = zone;
    this.is24h = is24h;
    this.time = time;
    
    this.validator = new DataValidator();
    this.setupValidations();
  }

  setupValidations() {
    this.validator.validateInclusion('zone', {
      in: range(1, 2),
      message: '%{value} is invalid!  Valid zones are 1..2.'
    });
  }

  validate() {
    this.validator.validate(this);
  }

  packets() {
    this.validate();

    const packet = [
      ...Protocol9Time.CPACKET_TIME,
      this.zone,
      this.time.getHours(),
      this.time.getMinutes(),
      this.time.getMonth() + 1, // JavaScript months are 0-based
      this.time.getDate(),
      this.yearMod1900(),
      this.wdayFromMonday(),
      this.time.getSeconds(),
      this.is24hValue()
    ];

    return CrcPacketsWrapper.wrapPackets([packet]);
  }

  yearMod1900() {
    return this.time.getFullYear() % 100;
  }

  wdayFromMonday() {
    return (this.time.getDay() + 6) % 7;
  }

  is24hValue() {
    return this.is24h ? 2 : 1;
  }
}

// Protocol 9 TimeName Component
class Protocol9TimeName {
  static CPACKET_NAME = [0x31];

  constructor({ zone, name }) {
    this.zone = zone;
    this.name = name;
    
    this.validator = new DataValidator();
    this.setupValidations();
  }

  setupValidations() {
    this.validator.validateInclusion('zone', {
      in: range(1, 2),
      message: '%{value} is invalid!  Valid zones are 1..2.'
    });
  }

  validate() {
    this.validator.validate(this);
  }

  packets() {
    this.validate();

    const packet = [
      ...Protocol9TimeName.CPACKET_NAME,
      this.zone,
      ...this.nameCharacters()
    ];

    return CrcPacketsWrapper.wrapPackets([packet]);
  }

  nameFormatted() {
    return this.name || `tz${this.zone}`;
  }

  nameCharacters() {
    return CharacterEncoders.charsFor(this.nameFormatted(), { 
      length: 3, 
      pad: true 
    });
  }
}

// Protocol 9 Alarm Component
class Protocol9Alarm {
  static CPACKET_ALARM = [0x50];

  constructor({ number, audible, time, message, month = null, day = null }) {
    this.number = number;
    this.audible = audible;
    this.time = time;
    this.message = message;
    this.month = month;
    this.day = day;
    
    this.validator = new DataValidator();
    this.setupValidations();
  }

  setupValidations() {
    this.validator.validateInclusion('number', {
      in: range(1, 10),
      message: 'value %{value} is invalid!  Valid number values are 1..10.'
    });
  }

  validate() {
    this.validator.validate(this);
  }

  packets() {
    this.validate();

    const packet = [
      ...Protocol9Alarm.CPACKET_ALARM,
      this.number,
      this.time.getHours(),
      this.time.getMinutes(),
      this.month || 0,
      this.day || 0,
      this.audibleInteger(),
      ...this.messageCharacters()
    ];

    return CrcPacketsWrapper.wrapPackets([packet]);
  }

  messageCharacters() {
    return CharacterEncoders.charsFor(this.message, { 
      length: 16, 
      pad: true 
    });
  }

  audibleInteger() {
    return this.audible ? 1 : 0;
  }
}

// Protocol 9 Timer Component
class Protocol9Timer {
  static CPACKET_TIMER = [0x43];
  static ACTION_AT_END_MAP = {
    'stop_timer': 0,
    'repeat_timer': 1,
    'start_chrono': 2
  };

  constructor({ number, label, time, actionAtEnd }) {
    this.number = number;
    this.label = label;
    this.time = time;
    this.actionAtEnd = actionAtEnd;
  }

  packets() {
    const packet = [
      ...Protocol9Timer.CPACKET_TIMER,
      this.number,
      this.time.getHours(),
      this.time.getMinutes(),
      this.time.getSeconds(),
      this.actionAtEndValue(),
      ...this.labelCharacters()
    ];

    return CrcPacketsWrapper.wrapPackets([packet]);
  }

  actionAtEndValue() {
    return Protocol9Timer.ACTION_AT_END_MAP[this.actionAtEnd] || 0;
  }

  labelCharacters() {
    return CharacterEncoders.charsFor(this.label, { 
      length: 8, 
      pad: true 
    });
  }
}

// Protocol 9 Sound Options Component (simplified)
class Protocol9SoundOptions {
  static CPACKET_SOUND = [0x71];

  constructor({ hourlyChime = false, buttonBeep = false }) {
    this.hourlyChime = hourlyChime;
    this.buttonBeep = buttonBeep;
  }

  packets() {
    const packet = [
      ...Protocol9SoundOptions.CPACKET_SOUND,
      this.hourlyChime ? 1 : 0,
      this.buttonBeep ? 1 : 0
    ];

    return CrcPacketsWrapper.wrapPackets([packet]);
  }
}

// Main Protocol 9 Class
export class Protocol9 extends ProtocolBase {
  static get VERSION() { return 9; }
  static get NAME() { return 'Protocol 9'; }
  
  static get SUPPORTED_DEVICES() {
    return ['Timex Ironman Triathlon', 'Protocol 9 Compatible'];
  }

  static get CAPABILITIES() {
    return {
      bidirectional: false,
      time: true,
      timeName: true,
      alarms: true,
      timer: true,
      chrono: true,
      soundOptions: true,
      maxAlarms: 10
    };
  }

  static get START_PACKET() {
    return Protocol9Start.CPACKET_START;
  }

  static getComponents() {
    return {
      Start: Protocol9Start,
      End: Protocol9End,
      Sync: Protocol9Sync,
      Time: Protocol9Time,
      TimeName: Protocol9TimeName,
      Alarm: Protocol9Alarm,
      Timer: Protocol9Timer,
      SoundOptions: Protocol9SoundOptions
    };
  }

  static isCompatible(deviceInfo) {
    if (!deviceInfo) return false;
    
    if (deviceInfo.protocol === 9) return true;
    
    if (deviceInfo.model) {
      const modelLower = deviceInfo.model.toLowerCase();
      if (modelLower.includes('ironman') || modelLower.includes('triathlon') || modelLower.includes('protocol 9')) {
        return true;
      }
    }
    
    return super.isCompatible(deviceInfo);
  }

  static createSyncSequence(options = {}) {
    const {
      time = new Date(),
      zone = 1,
      is24h = true,
      zoneName = null,
      alarms = [],
      timers = [],
      soundOptions = null,
      syncLength = 300
    } = options;

    const sequence = [];

    sequence.push(new Protocol9Start());
    sequence.push(new Protocol9Sync({ length: syncLength }));
    sequence.push(new Protocol9Time({ zone, is24h, time }));

    if (zoneName) {
      sequence.push(new Protocol9TimeName({ zone, name: zoneName }));
    }

    for (const alarm of alarms) {
      sequence.push(alarm);
    }

    for (const timer of timers) {
      sequence.push(timer);
    }

    if (soundOptions) {
      sequence.push(new Protocol9SoundOptions(soundOptions));
    }

    sequence.push(new Protocol9End());

    return sequence;
  }

  static getUsageExamples() {
    return {
      basicTimeSync: {
        description: 'Basic time synchronization for Ironman Triathlon',
        code: `
const components = Protocol9.getComponents();

const sequence = [
  new components.Start(),
  new components.Sync({ length: 300 }),
  new components.Time({ 
    zone: 1, 
    is24h: true, 
    time: new Date() 
  }),
  new components.TimeName({ zone: 1, name: 'EST' }),
  new components.End()
];

const packets = sequence.flatMap(component => component.packets());
await serialAdapter.write(packets);
        `
      },
      timerSetup: {
        description: 'Setting up timers',
        code: `
const timer = new components.Timer({
  number: 1,
  label: 'Workout',
  time: new Date(0, 0, 0, 0, 30, 0), // 30 minutes
  actionAtEnd: 'repeat_timer'
});

const sequence = Protocol9.createSyncSequence({
  timers: [timer]
});
        `
      },
      alarmConfiguration: {
        description: 'Setting up multiple alarms',
        code: `
const alarms = [
  new components.Alarm({
    number: 1,
    audible: true,
    time: new Date(0, 0, 0, 6, 30, 0),
    message: 'Morning Run'
  }),
  new components.Alarm({
    number: 2,
    audible: true,
    time: new Date(0, 0, 0, 18, 0, 0),
    message: 'Evening Workout'
  })
];

const sequence = Protocol9.createSyncSequence({
  alarms: alarms
});
        `
      }
    };
  }
}

export default Protocol9;