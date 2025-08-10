/**
 * Data validation framework equivalent to ActiveModel validations
 * Provides validation helpers for ranges, inclusion, and custom rules
 */

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class DataValidator {
  constructor() {
    this.validations = [];
    this.errors = [];
  }

  /**
   * Add an inclusion validation rule
   * @param {string} field - Field name to validate
   * @param {Object} options - Validation options
   * @param {Array|Function} options.in - Array of valid values or function returning valid values
   * @param {string} options.message - Custom error message
   * @param {boolean} options.allowNull - Allow null/undefined values
   * @param {Function} options.if - Conditional function to determine if validation should run
   * @param {Function} options.unless - Conditional function to determine if validation should NOT run
   */
  validateInclusion(field, options = {}) {
    this.validations.push({
      type: 'inclusion',
      field,
      options
    });
  }

  /**
   * Add a comparison validation rule
   * @param {string} field - Field name to validate
   * @param {Object} options - Validation options
   * @param {*} options.greaterThan - Value must be greater than this
   * @param {*} options.greaterThanOrEqualTo - Value must be greater than or equal to this
   * @param {*} options.lessThan - Value must be less than this
   * @param {*} options.lessThanOrEqualTo - Value must be less than or equal to this
   * @param {string} options.message - Custom error message
   * @param {Function} options.if - Conditional function to determine if validation should run
   * @param {Function} options.unless - Conditional function to determine if validation should NOT run
   */
  validateComparison(field, options = {}) {
    this.validations.push({
      type: 'comparison',
      field,
      options
    });
  }

  /**
   * Add a custom validation rule
   * @param {string} field - Field name to validate
   * @param {Function} validator - Custom validation function
   * @param {string} message - Error message
   */
  validateCustom(field, validator, message) {
    this.validations.push({
      type: 'custom',
      field,
      validator,
      message
    });
  }

  /**
   * Validate an object against all registered validation rules
   * @param {Object} obj - Object to validate
   * @throws {ValidationError} If validation fails
   */
  validate(obj) {
    this.errors = [];

    for (const validation of this.validations) {
      this.runValidation(obj, validation);
    }

    if (this.errors.length > 0) {
      throw new ValidationError(`Validation failed: ${this.errors.join(', ')}`);
    }
  }

  /**
   * Run a single validation rule
   * @private
   */
  runValidation(obj, validation) {
    const { type, field, options } = validation;
    const value = obj[field];

    // Check conditional execution
    if (options.if && !options.if(obj)) return;
    if (options.unless && options.unless(obj)) return;

    // Handle null/undefined values
    if ((value === null || value === undefined)) {
      if (options.allowNull || options.allowNil) return;
      // If not allowing null and no specific message, continue with normal validation
    }

    switch (type) {
      case 'inclusion':
        this.validateInclusionRule(obj, field, value, options);
        break;
      case 'comparison':
        this.validateComparisonRule(obj, field, value, options);
        break;
      case 'custom':
        this.validateCustomRule(obj, field, value, validation);
        break;
    }
  }

  /**
   * Validate inclusion rule
   * @private
   */
  validateInclusionRule(obj, field, value, options) {
    let validValues = options.in;
    
    // Handle function-based valid values
    if (typeof validValues === 'function') {
      validValues = validValues(obj);
    }

    // Handle range objects (with start and end properties)
    if (validValues && typeof validValues === 'object' && 'start' in validValues && 'end' in validValues) {
      const { start, end } = validValues;
      if (value < start || value > end) {
        this.addInclusionError(field, value, options, `${start}..${end}`);
      }
      return;
    }

    // Handle arrays
    if (Array.isArray(validValues)) {
      if (!validValues.includes(value)) {
        this.addInclusionError(field, value, options, validValues);
      }
      return;
    }

    // Handle numeric ranges (for backwards compatibility)
    if (typeof validValues === 'number') {
      // Assume it's a max value, min is 1
      if (value < 1 || value > validValues) {
        this.addInclusionError(field, value, options, `1..${validValues}`);
      }
    }
  }

  /**
   * Validate comparison rule
   * @private
   */
  validateComparisonRule(obj, field, value, options) {
    const {
      greaterThan,
      greaterThanOrEqualTo,
      lessThan,
      lessThanOrEqualTo,
      message
    } = options;

    let comparisonValue;
    let failed = false;
    let operator = '';

    if (greaterThan !== undefined) {
      comparisonValue = typeof greaterThan === 'string' ? obj[greaterThan] : greaterThan;
      if (value <= comparisonValue) {
        failed = true;
        operator = 'greater than';
      }
    }

    if (greaterThanOrEqualTo !== undefined) {
      comparisonValue = typeof greaterThanOrEqualTo === 'string' ? obj[greaterThanOrEqualTo] : greaterThanOrEqualTo;
      if (value < comparisonValue) {
        failed = true;
        operator = 'greater than or equal to';
      }
    }

    if (lessThan !== undefined) {
      comparisonValue = typeof lessThan === 'string' ? obj[lessThan] : lessThan;
      if (value >= comparisonValue) {
        failed = true;
        operator = 'less than';
      }
    }

    if (lessThanOrEqualTo !== undefined) {
      comparisonValue = typeof lessThanOrEqualTo === 'string' ? obj[lessThanOrEqualTo] : lessThanOrEqualTo;
      if (value > comparisonValue) {
        failed = true;
        operator = 'less than or equal to';
      }
    }

    if (failed) {
      const errorMessage = message || 
        `${this.capitalize(field)} ${value} must be ${operator} ${comparisonValue}!`;
      this.errors.push(errorMessage);
    }
  }

  /**
   * Validate custom rule
   * @private
   */
  validateCustomRule(obj, field, value, validation) {
    if (!validation.validator(obj, value)) {
      this.errors.push(validation.message);
    }
  }

  /**
   * Add inclusion validation error
   * @private
   */
  addInclusionError(field, value, options, validValues) {
    let message = options.message;
    
    if (!message) {
      const validValuesStr = Array.isArray(validValues) 
        ? JSON.stringify(validValues)
        : validValues.toString();
      
      const allowNullStr = (options.allowNull || options.allowNil) ? ' and nil' : '';
      
      if (field.toLowerCase().includes('number')) {
        message = `${this.capitalize(field)} value ${value} is invalid!  Valid ${field} values are ${validValuesStr}${allowNullStr}.`;
      } else {
        message = `${this.capitalize(field)} ${value} is invalid!  Valid ${field} values are ${validValuesStr}${allowNullStr}.`;
      }
    }

    // Replace template variables
    message = message.replace(/%\{value\}/g, value);
    message = message.replace(/%\{field\}/g, field);

    this.errors.push(message);
  }

  /**
   * Capitalize first letter of string
   * @private
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Clear all validation rules and errors
   */
  clear() {
    this.validations = [];
    this.errors = [];
  }
}

/**
 * Helper function to create range objects
 * @param {number} start - Start of range (inclusive)
 * @param {number} end - End of range (inclusive)
 * @returns {Object} Range object
 */
function range(start, end) {
  return { start, end };
}

export { DataValidator, ValidationError, range };