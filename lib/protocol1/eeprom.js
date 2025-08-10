/**
 * Protocol 1 EEPROM implementation
 * Ported from Ruby TimexDatalinkClient::Protocol1::Eeprom
 */

import { DataValidator, ValidationError } from '../helpers/data-validator.js';
import CpacketPaginator from '../helpers/cpacket-paginator.js';
import CrcPacketsWrapper from '../helpers/crc-packets-wrapper.js';

class Protocol1Eeprom {
  static CPACKET_SECT = [0x60];
  static CPACKET_DATA = [0x61];
  static CPACKET_END = [0x62];
  static CPACKET_DATA_LENGTH = 27;
  static START_INDEX = 14;
  static APPOINTMENT_NO_NOTIFICATION = 0xff;
  static APPOINTMENT_NOTIFICATION_VALID_MINUTES = [0, 5, 10, 15, 20, 25, 30];

  constructor({ 
    appointments = [], 
    anniversaries = [], 
    phoneNumbers = [], 
    lists = [], 
    appointmentNotificationMinutes = null 
  } = {}) {
    this.appointments = appointments;
    this.anniversaries = anniversaries;
    this.phoneNumbers = phoneNumbers;
    this.lists = lists;
    this.appointmentNotificationMinutes = appointmentNotificationMinutes;
    
    this.validator = new DataValidator();
    this.setupValidations();
  }

  /**
   * Setup validation rules
   * @private
   */
  setupValidations() {
    this.validator.validateInclusion('appointmentNotificationMinutes', {
      in: Protocol1Eeprom.APPOINTMENT_NOTIFICATION_VALID_MINUTES,
      allowNull: true,
      message: 'value %{value} is invalid!  Valid appointment notification minutes values are' +
               ` ${JSON.stringify(Protocol1Eeprom.APPOINTMENT_NOTIFICATION_VALID_MINUTES)} or nil.`
    });
  }

  /**
   * Validate the EEPROM data
   * @throws {ValidationError} If validation fails
   */
  validate() {
    this.validator.validate(this);
  }

  /**
   * Compile packets for EEPROM data
   * @throws {ValidationError} One or more model values are invalid
   * @returns {Array<Array<number>>} Two-dimensional array of integers that represent bytes
   */
  packets() {
    this.validate();

    const packets = [
      this.header(),
      ...this.payloads(),
      Protocol1Eeprom.CPACKET_END
    ];

    return CrcPacketsWrapper.wrapPackets(packets);
  }

  /**
   * Generate EEPROM header packet
   * @private
   * @returns {Array<number>} Header packet
   */
  header() {
    return [
      ...Protocol1Eeprom.CPACKET_SECT,
      this.payloads().length
    ];
  }

  /**
   * Generate payload data
   * @private
   * @returns {Array<number>} Payload data
   */
  payload() {
    return [
      ...this.itemsIndexes(),
      ...this.itemsLengths(),
      this.earliestAppointmentYear(),
      this.appointmentNotificationMinutesValue(),
      ...this.allPackets()
    ];
  }

  /**
   * Generate paginated payloads
   * @private
   * @returns {Array<Array<number>>} Paginated payload packets
   */
  payloads() {
    return CpacketPaginator.paginateCpackets({
      header: Protocol1Eeprom.CPACKET_DATA,
      length: Protocol1Eeprom.CPACKET_DATA_LENGTH,
      cpackets: this.payload()
    });
  }

  /**
   * Get all items in order
   * @private
   * @returns {Array<Array>} All items grouped by type
   */
  allItems() {
    return [this.appointments, this.lists, this.phoneNumbers, this.anniversaries];
  }

  /**
   * Get all packets from all items
   * @private
   * @returns {Array<number>} Flattened packet data
   */
  allPackets() {
    return this.allItems()
      .flat()
      .map(item => item.packet())
      .flat();
  }

  /**
   * Calculate starting indexes for each item type
   * @private
   * @returns {Array<number>} Index bytes (LSB, MSB pairs)
   */
  itemsIndexes() {
    let index = Protocol1Eeprom.START_INDEX;
    const indexes = [];

    for (const items of this.allItems()) {
      // Add LSB, MSB (divmod equivalent)
      indexes.push(index % 256, Math.floor(index / 256));
      
      // Calculate total length of all packets for this item type
      index += items.reduce((sum, item) => sum + item.packet().length, 0);
    }

    return indexes;
  }

  /**
   * Get lengths of each item type
   * @private
   * @returns {Array<number>} Item type lengths
   */
  itemsLengths() {
    return this.allItems().map(items => items.length);
  }

  /**
   * Get earliest appointment year (mod 100)
   * @private
   * @returns {number} Earliest appointment year or 0
   */
  earliestAppointmentYear() {
    if (this.appointments.length === 0) return 0;

    const earliestAppointment = this.appointments.reduce((earliest, current) => 
      current.time < earliest.time ? current : earliest
    );

    return earliestAppointment.time.getFullYear() % 100;
  }

  /**
   * Convert appointment notification minutes to protocol value
   * @private
   * @returns {number} Notification value
   */
  appointmentNotificationMinutesValue() {
    if (this.appointmentNotificationMinutes === null) {
      return Protocol1Eeprom.APPOINTMENT_NO_NOTIFICATION;
    }

    return this.appointmentNotificationMinutes / 5;
  }
}

export default Protocol1Eeprom;