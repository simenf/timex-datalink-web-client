/**
 * Protocol 3 EEPROM implementation
 * 
 * Handles EEPROM data compilation and packet generation for Protocol 3 devices.
 * Manages appointments, anniversaries, phone numbers, and lists.
 */

import CrcPacketsWrapper from '../helpers/crc-packets-wrapper.js';
import CpacketPaginator from '../helpers/cpacket-paginator.js';

class Protocol3Eeprom {
  static CPACKET_CLEAR = [0x93, 0x01];
  static CPACKET_SECT = [0x90, 0x01];
  static CPACKET_DATA = [0x91, 0x01];
  static CPACKET_END = [0x92, 0x01];

  static CPACKET_DATA_LENGTH = 32;
  static START_ADDRESS = 0x0236;
  static APPOINTMENT_NO_NOTIFICATION = 0xff;
  static APPOINTMENT_NOTIFICATION_VALID_MINUTES = [0, 5, 10, 15, 20, 25, 30];

  /**
   * Create an EEPROM instance
   * @param {Object} options - EEPROM configuration
   * @param {Array} options.appointments - Appointments to be added to EEPROM data
   * @param {Array} options.anniversaries - Anniversaries to be added to EEPROM data
   * @param {Array} options.phoneNumbers - Phone numbers to be added to EEPROM data
   * @param {Array} options.lists - Lists to be added to EEPROM data
   * @param {number|null} options.appointmentNotificationMinutes - Appointment notification in minutes
   */
  constructor({ 
    appointments = [], 
    anniversaries = [], 
    phoneNumbers = [], 
    lists = [], 
    appointmentNotificationMinutes = null 
  }) {
    this.appointments = appointments;
    this.anniversaries = anniversaries;
    this.phoneNumbers = phoneNumbers;
    this.lists = lists;
    this.appointmentNotificationMinutes = appointmentNotificationMinutes;
    
    this.validate();
  }

  /**
   * Validate EEPROM parameters
   * @throws {Error} If validation fails
   */
  validate() {
    if (this.appointmentNotificationMinutes !== null && 
        !Protocol3Eeprom.APPOINTMENT_NOTIFICATION_VALID_MINUTES.includes(this.appointmentNotificationMinutes)) {
      throw new Error(
        `value ${this.appointmentNotificationMinutes} is invalid! Valid appointment notification minutes values are ${Protocol3Eeprom.APPOINTMENT_NOTIFICATION_VALID_MINUTES} or null.`
      );
    }
  }

  /**
   * Compile packets for EEPROM data
   * @returns {Array<Array<number>>} Two-dimensional array of integers that represent bytes
   */
  packets() {
    this.validate();

    const packets = [
      Protocol3Eeprom.CPACKET_CLEAR,
      this.header(),
      ...this.payloads(),
      Protocol3Eeprom.CPACKET_END
    ];

    return CrcPacketsWrapper.wrapPackets(packets);
  }

  /**
   * Generate EEPROM header
   * @returns {Array<number>} Header packet
   * @private
   */
  header() {
    const payloads = this.payloads();
    return [
      ...Protocol3Eeprom.CPACKET_SECT,
      payloads.length,
      ...this.itemsAddresses(),
      ...this.itemsLengths(),
      this.earliestAppointmentYear(),
      this.appointmentNotificationMinutesValue()
    ];
  }

  /**
   * Generate paginated payload packets
   * @returns {Array<Array<number>>} Paginated packets
   * @private
   */
  payloads() {
    const allPackets = this.allPackets();
    return CpacketPaginator.paginateCpackets({
      header: Protocol3Eeprom.CPACKET_DATA,
      length: Protocol3Eeprom.CPACKET_DATA_LENGTH,
      cpackets: allPackets
    });
  }

  /**
   * Get all items in order
   * @returns {Array<Array>} All items grouped by type
   * @private
   */
  allItems() {
    return [this.appointments, this.lists, this.phoneNumbers, this.anniversaries];
  }

  /**
   * Get all packets from all items
   * @returns {Array<number>} Flattened array of all packet bytes
   * @private
   */
  allPackets() {
    return this.allItems()
      .flat()
      .map(item => item.packet())
      .flat();
  }

  /**
   * Calculate addresses for each item type
   * @returns {Array<number>} Address bytes (LSB, MSB pairs)
   * @private
   */
  itemsAddresses() {
    let address = Protocol3Eeprom.START_ADDRESS;
    const addresses = [];

    for (const items of this.allItems()) {
      // Add address as [LSB, MSB] (divmod(256) equivalent)
      addresses.push(address & 0xFF, (address >> 8) & 0xFF);
      
      // Calculate next address
      address += items.reduce((sum, item) => sum + item.packet().length, 0);
    }

    return addresses;
  }

  /**
   * Get lengths of each item type
   * @returns {Array<number>} Length of each item type
   * @private
   */
  itemsLengths() {
    return this.allItems().map(items => items.length);
  }

  /**
   * Get the earliest appointment year
   * @returns {number} Year (last 2 digits) or 0 if no appointments
   * @private
   */
  earliestAppointmentYear() {
    if (this.appointments.length === 0) {
      return 0;
    }

    const earliestAppointment = this.appointments.reduce((earliest, current) => 
      current.time < earliest.time ? current : earliest
    );

    return earliestAppointment.time.getFullYear() % 100;
  }

  /**
   * Convert appointment notification minutes to device value
   * @returns {number} Device notification value
   * @private
   */
  appointmentNotificationMinutesValue() {
    if (this.appointmentNotificationMinutes === null) {
      return Protocol3Eeprom.APPOINTMENT_NO_NOTIFICATION;
    }

    return this.appointmentNotificationMinutes / 5;
  }
}

export default Protocol3Eeprom;