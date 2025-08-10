/**
 * Protocol 6 Class
 * Complete Protocol 6 implementation extending ProtocolBase
 * Ported from Ruby TimexDatalinkClient::Protocol6
 */

import { ProtocolBase } from './protocol-base.js';
import { DataValidator, ValidationError, range } from './helpers/data-validator.js';
import { CharacterEncoders } from './helpers/character-encoders.js';
import CrcPacketsWrapper from './helpers/crc-packets-wrapper.js';

// Protocol 6 Start Component
class Protocol6Start {
  static CPACKET_START = [0x20, 0x00, 0x00, 0x06];

  packets() {
    return CrcPacketsWrapper.wrapPackets([Protocol6Start.CPACKET_START]);
  }
}

// Protocol 6 End Component
class Protocol6End {
  static CPACKET_SKIP = [0x21];

  packets() {
    return CrcPacketsWrapper.wrapPackets([Protocol6End.CPACKET_SKIP]);
  }
}

// Protocol 6 Sync Component
class Protocol6Sync {
  static PING_BYTE = [0x78];
  static FAST_MODE_BYTE = [0x56];
  static SYNC_1_BYTE = [0x55];
  static SYNC_2_BYTE = [0xaa];
  static SYNC_2_LENGTH = 40;

  constructor({ length = 300 } = {}) {
    this.length = length;
  }

  packets() {
    return [
      [
        ...Protocol6Sync.PING_BYTE,
        ...Protocol6Sync.FAST_MODE_BYTE,
        ...this.renderSync1(),
        ...this.renderSync2()
      ]
    ];
  }

  renderSync1() {
    return new Array(this.length).fill(Protocol6Sync.SYNC_1_BYTE[0]);
  }

  renderSync2() {
    return new Array(Protocol6Sync.SYNC_2_LENGTH).fill(Protocol6Sync.SYNC_2_BYTE[0]);
  }
}

// Protocol 6 Time Component
class Protocol6Time {
  static CPACKET_TIME = [0x32];
  static CPACKET_FLEX_TIME = [0x33];
  static FLEX_TIME_ZONE = 0x10;
  static FLEX_DST_VALUE = 0x08;

  static ZONE_OFFSET_MAP = {
    '-39600': 0x15, '-36000': 0x16, '-32400': 0x17, '-28800': 0x18,
    '-25200': 0x19, '-21600': 0x1a, '-18000': 0x1b, '-14400': 0x1c,
    '-12600': 0x14, '-10800': 0x1d, '-7200': 0x1e, '-3600': 0x1f,
    '0': 0x00, '3600': 0x01, '7200': 0x02, '10800': 0x03,
    '12600': 0x0d, '14400': 0x04, '16200': 0x0e, '18000': 0x05,
    '19800': 0x0f, '20700': 0x11, '21600': 0x06, '23400': 0x12,
    '25200': 0x07, '28800': 0x08, '32400': 0x09, '34200': 0x13,
    '36000': 0x0a, '39600': 0x0b, '43200': 0x0c
  };

  static DATE_FORMAT_MAP = {
    '%_m-%d-%y': 0x00, '%_d-%m-%y': 0x01, '%y-%m-%d': 0x02,
    '%_m.%d.%y': 0x04, '%_d.%m.%y': 0x05, '%y.%m.%d': 0x06
  };

  constructor({ zone, is24h, dateFormat, time, name = null, flexTime = false, flexTimeZone = false, flexDst = false }) {
    this.zone = zone;
    this.is24h = is24h;
    this.dateFormat = dateFormat;
    this.time = time;
    this.name = name;
    this.flexTime = flexTime;
    this.flexTimeZone = flexTimeZone;
    this.flexDst = flexDst;
    
    this.validator = new DataValidator();
    this.setupValidations();
  }

  setupValidations() {
    this.validator.validateInclusion('zone', {
      in: range(1, 2),
      message: '%{value} is invalid!  Valid zones are 1..2.'
    });

    this.validator.validateInclusion('dateFormat', {
      in: Object.keys(Protocol6Time.DATE_FORMAT_MAP),
      message: `%{value} is invalid!  Valid date formats are ${Object.keys(Protocol6Time.DATE_FORMAT_MAP)}.`
    });
  }

  validate() {
    this.validator.validate(this);
  }

  packets() {
    this.validate();

    const packet = [
      ...(this.flexTime ? Protocol6Time.CPACKET_FLEX_TIME : Protocol6Time.CPACKET_TIME),
      this.zone,
      this.flexTime ? 0 : this.time.getSeconds(),
      this.flexTime ? 0 : this.time.getHours(),
      this.flexTime ? 0 : this.time.getMinutes(),
      this.flexTime ? 0 : (this.time.getMonth() + 1),
      this.flexTime ? 0 : this.time.getDate(),
      this.flexTime ? 0 : (this.time.getFullYear() % 100),
      ...this.nameCharacters(),
      this.flexTime ? 0 : ((this.time.getDay() + 6) % 7),
      this.formattedTimeZone(),
      this.is24h ? 2 : 1,
      this.dateFormatValue()
    ];

    return CrcPacketsWrapper.wrapPackets([packet]);
  }

  nameCharacters() {
    const formattedName = this.name || `tz${this.zone}`;
    return CharacterEncoders.protocol6CharsFor(formattedName, { length: 3, pad: true });
  }

  formattedTimeZone() {
    if (this.flexTimeZone) return Protocol6Time.FLEX_TIME_ZONE;
    const offset = this.time.getTimezoneOffset() * -60; // Convert to seconds
    return Protocol6Time.ZONE_OFFSET_MAP[offset.toString()] || 0x00;
  }

  dateFormatValue() {
    let format = Protocol6Time.DATE_FORMAT_MAP[this.dateFormat];
    if (this.flexDst) format += Protocol6Time.FLEX_DST_VALUE;
    return format;
  }
}

// Protocol 6 Alarm Component
class Protocol6Alarm {
  static CPACKET_ALARM = 0x51;
  static ALARM_STATUS_MAP = { disarmed: 0, armed: 1, unused: 2 };

  constructor({ number, status, time = new Date(0, 0, 1, 6, 0), message = '', month = null, day = null }) {
    this.number = number;
    this.status = status;
    this.time = time;
    this.message = message;
    this.month = month;
    this.day = day;
    
    this.validator = new DataValidator();
    this.setupValidations();
  }

  setupValidations() {
    this.validator.validateInclusion('number', {
      in: range(1, 8),
      message: 'value %{value} is invalid!  Valid number values are 1..8.'
    });

    this.validator.validateInclusion('status', {
      in: Object.keys(Protocol6Alarm.ALARM_STATUS_MAP),
      message: `%{value} is invalid!  Valid status values are ${Object.keys(Protocol6Alarm.ALARM_STATUS_MAP)}.`
    });
  }

  validate() {
    this.validator.validate(this);
  }

  packets() {
    this.validate();

    const packet = [
      Protocol6Alarm.CPACKET_ALARM,
      this.number,
      this.time.getHours(),
      this.time.getMinutes(),
      this.month || 0,
      this.day || 0,
      Protocol6Alarm.ALARM_STATUS_MAP[this.status],
      ...this.messageCharacters()
    ];

    return CrcPacketsWrapper.wrapPackets([packet]);
  }

  messageCharacters() {
    return CharacterEncoders.protocol6CharsFor(this.message, { length: 16, pad: true });
  }
}

// Protocol 6 Options Components
class Protocol6PagerOptions {
  static CPACKET_PAGER = 0x73;
  static ALERT_SOUND_SILENT = 6;

  constructor({ autoOnOff = false, onHour = 0, onMinute = 0, offHour = 0, offMinute = 0, alertSound = 0 }) {
    this.autoOnOff = autoOnOff;
    this.onHour = onHour;
    this.onMinute = onMinute;
    this.offHour = offHour;
    this.offMinute = offMinute;
    this.alertSound = alertSound;
  }

  packets() {
    const packet = [
      Protocol6PagerOptions.CPACKET_PAGER,
      this.autoOnOff ? 1 : 0,
      this.onHour,
      this.onMinute,
      this.offHour,
      this.offMinute,
      this.alertSound === null ? Protocol6PagerOptions.ALERT_SOUND_SILENT : this.alertSound
    ];

    return CrcPacketsWrapper.wrapPackets([packet]);
  }
}

class Protocol6NightModeOptions {
  static CPACKET_NIGHT_MODE = 0x72;

  constructor({ nightModeDeactivateHours = 8, indigloTimeoutSeconds = 4, nightModeOnNotification = false }) {
    this.nightModeDeactivateHours = nightModeDeactivateHours;
    this.indigloTimeoutSeconds = indigloTimeoutSeconds;
    this.nightModeOnNotification = nightModeOnNotification;
  }

  packets() {
    const packet = [
      Protocol6NightModeOptions.CPACKET_NIGHT_MODE,
      this.nightModeOnNotification ? 1 : 0,
      this.nightModeDeactivateHours,
      this.indigloTimeoutSeconds
    ];

    return CrcPacketsWrapper.wrapPackets([packet]);
  }
}

class Protocol6SoundScrollOptions {
  static CPACKET_SOUND_SCROLL = 0x71;

  constructor({ hourlyChime = false, buttonBeep = false, scrollSpeed = 1 }) {
    this.hourlyChime = hourlyChime;
    this.buttonBeep = buttonBeep;
    this.scrollSpeed = scrollSpeed;
  }

  packets() {
    const packet = [
      Protocol6SoundScrollOptions.CPACKET_SOUND_SCROLL,
      this.hourlyChime ? 1 : 0,
      this.buttonBeep ? 1 : 0,
      this.scrollSpeed
    ];

    return CrcPacketsWrapper.wrapPackets([packet]);
  }
}

// Main Protocol 6 Class
export class Protocol6 extends ProtocolBase {
  static get VERSION() { return 6; }
  static get NAME() { return 'Protocol 6'; }
  
  static get SUPPORTED_DEVICES() {
    return ['Motorola Beepwear Pro', 'Protocol 6 Compatible'];
  }

  static get CAPABILITIES() {
    return {
      bidirectional: false,
      time: true,
      alarms: true,
      eeprom: true,
      soundOptions: true,
      pagerOptions: true,
      nightMode: true,
      maxAlarms: 8
    };
  }

  static get START_PACKET() {
    return Protocol6Start.CPACKET_START;
  }

  static getComponents() {
    return {
      Start: Protocol6Start,
      End: Protocol6End,
      Sync: Protocol6Sync,
      Time: Protocol6Time,
      Alarm: Protocol6Alarm,
      PagerOptions: Protocol6PagerOptions,
      NightModeOptions: Protocol6NightModeOptions,
      SoundScrollOptions: Protocol6SoundScrollOptions
    };
  }

  static isCompatible(deviceInfo) {
    if (!deviceInfo) return false;
    
    if (deviceInfo.protocol === 6) return true;
    
    if (deviceInfo.model) {
      const modelLower = deviceInfo.model.toLowerCase();
      if (modelLower.includes('beepwear') || modelLower.includes('protocol 6')) {
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
      dateFormat = '%_m-%d-%y',
      zoneName = null,
      alarms = [],
      pagerOptions = null,
      nightModeOptions = null,
      soundScrollOptions = null,
      syncLength = 300
    } = options;

    const sequence = [];

    sequence.push(new Protocol6Start());
    sequence.push(new Protocol6Sync({ length: syncLength }));
    sequence.push(new Protocol6Time({ zone, is24h, dateFormat, time, name: zoneName }));

    for (const alarm of alarms) {
      sequence.push(alarm);
    }

    if (pagerOptions) {
      sequence.push(new Protocol6PagerOptions(pagerOptions));
    }

    if (nightModeOptions) {
      sequence.push(new Protocol6NightModeOptions(nightModeOptions));
    }

    if (soundScrollOptions) {
      sequence.push(new Protocol6SoundScrollOptions(soundScrollOptions));
    }

    sequence.push(new Protocol6End());

    return sequence;
  }
}

export default Protocol6;