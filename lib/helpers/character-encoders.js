/**
 * Character encoding utilities for Timex Datalink protocols
 * Ported from Ruby TimexDatalinkClient::Helpers::CharEncoders
 */

class CharacterEncoders {
  // Character maps for different protocols and data types
  static CHARS = "0123456789abcdefghijklmnopqrstuvwxyz !\"#$%&'()*+,-./:\\;=@?_|<>[]";
  static CHARS_PROTOCOL_6 = "0123456789 abcdefghijklmnopqrstuvwxyz!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
  static EEPROM_CHARS = "0123456789abcdefghijklmnopqrstuvwxyz !\"#$%&'()*+,-./:\\;=@?_|<>[";
  static PHONE_CHARS = "0123456789cfhpw ";
  static INVALID_CHAR = " ";
  static EEPROM_TERMINATOR = 0x3f;

  /**
   * Convert string characters to numeric indices based on character map
   * @param {string} stringChars - Input string to encode
   * @param {Object} options - Encoding options
   * @param {string} options.charMap - Character map to use (default: CHARS)
   * @param {number|null} options.length - Maximum length to encode
   * @param {boolean} options.pad - Whether to pad with spaces to reach length
   * @returns {number[]} Array of character indices
   */
  static charsFor(stringChars, { charMap = this.CHARS, length = null, pad = false } = {}) {
    let formattedChars = stringChars.toLowerCase();
    
    // Truncate to specified length if provided
    if (length !== null) {
      formattedChars = formattedChars.substring(0, length);
    }
    
    // Pad with spaces if requested
    if (pad && length !== null) {
      formattedChars = formattedChars.padEnd(length, ' ');
    }
    
    // Convert each character to its index in the character map
    return Array.from(formattedChars).map(char => {
      const index = charMap.indexOf(char);
      return index !== -1 ? index : charMap.indexOf(this.INVALID_CHAR);
    });
  }

  /**
   * Convert string characters using Protocol 6 character map
   * @param {string} stringChars - Input string to encode
   * @param {number|null} length - Maximum length to encode
   * @param {boolean} pad - Whether to pad with spaces to reach length
   * @returns {number[]} Array of character indices
   */
  static protocol6CharsFor(stringChars, { length = null, pad = false } = {}) {
    return this.charsFor(stringChars, { 
      charMap: this.CHARS_PROTOCOL_6, 
      length, 
      pad 
    });
  }

  /**
   * Convert string to EEPROM format with 6-bit packing
   * @param {string} stringChars - Input string to encode
   * @param {number} length - Maximum length (default: 31)
   * @returns {number[]} Packed bytes in little-endian format
   */
  static eepromCharsFor(stringChars, length = 31) {
    // Get character indices and append terminator
    const chars = this.charsFor(stringChars, { 
      charMap: this.EEPROM_CHARS, 
      length 
    });
    chars.push(this.EEPROM_TERMINATOR);

    // Pack characters using 6-bit encoding
    let packedInt = 0n; // Use BigInt for large numbers
    chars.forEach((char, index) => {
      packedInt += BigInt(char) << BigInt(6 * index);
    });

    // Convert to little-endian byte array
    const bytes = [];
    let remaining = packedInt;
    while (remaining > 0n) {
      bytes.push(Number(remaining & 0xFFn));
      remaining >>= 8n;
    }

    return bytes.length > 0 ? bytes : [0];
  }

  /**
   * Convert string to phone number format with 4-bit packing
   * @param {string} stringChars - Input string to encode
   * @returns {number[]} Packed bytes in little-endian format
   */
  static phoneCharsFor(stringChars) {
    // Get character indices (max 12 characters for phone numbers)
    const chars = this.charsFor(stringChars, { 
      charMap: this.PHONE_CHARS, 
      length: 12 
    });

    // Pack characters using 4-bit encoding
    let packedInt = 0n; // Use BigInt for large numbers
    chars.forEach((char, index) => {
      packedInt += BigInt(char) << BigInt(4 * index);
    });

    // Convert to little-endian byte array
    const bytes = [];
    let remaining = packedInt;
    while (remaining > 0n) {
      bytes.push(Number(remaining & 0xFFn));
      remaining >>= 8n;
    }

    return bytes.length > 0 ? bytes : [0];
  }
}

export { CharacterEncoders };