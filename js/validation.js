/**
 * Client-side validation utilities for form fields and data models.
 */

/**
 * Validates whether a string is a properly formatted email address.
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid
 */
function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  
  // RFC 5322 compliant regex for standard web forms
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

/**
 * Validates whether a string is a valid HTTP or HTTPS URL.
 * Rejects unsafe protocols such as javascript: or data: to prevent XSS.
 * @param {string} url - URL string to validate
 * @returns {boolean} True if URL is valid and uses http: or https:
 */
function isValidUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed.length === 0 || trimmed.length > 2048) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validates whether a string is a plausible phone number.
 * Accepts digits, spaces, hyphens, plus sign, and parentheses.
 * @param {string} phone - Phone string to validate
 * @returns {boolean} True if phone format is valid
 */
function isValidPhone(phone) {
  if (!phone || typeof phone !== "string") return false;
  const trimmed = phone.trim();
  if (trimmed.length === 0 || trimmed.length > 25) return false;

  // Allows international (+1), area code parentheses, spaces, dots, hyphens, and digits
  if (!/^[+]?[(]?[0-9\s\-().]{6,25}$/.test(trimmed)) return false;

  // Must contain between 7 and 15 digits (standard E.164 range)
  const digitCount = (trimmed.match(/\d/g) || []).length;
  return digitCount >= 7 && digitCount <= 15;
}

/**
 * Validates whether a phone number string contains only digits and matches the exact required length.
 * @param {string} phone - Phone number input
 * @param {number} exactDigits - Required exact number of digits for the country
 * @returns {boolean} True if phone consists of only digits and matches the exact length
 */
function isValidExactPhone(phone, exactDigits) {
  if (!phone || typeof phone !== "string") return false;
  const trimmed = phone.trim();
  if (!/^\d+$/.test(trimmed)) return false;
  return trimmed.length === exactDigits;
}

/**
 * Validates that a string matches YYYY-MM month format.
 * @param {string} value - Date string to validate
 * @returns {boolean} True if format is YYYY-MM and represents a valid calendar month
 */
function isValidMonthYear(value) {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(trimmed);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  return year >= 1900 && year <= 2100;
}

/**
 * Validates whether a date range has a start date that is before or equal to the end date.
 * @param {string} startDate - Start date string (YYYY-MM)
 * @param {string} endDate - End date string (YYYY-MM)
 * @returns {boolean} True if range is logically ordered or if either date is empty
 */
function isValidDateRange(startDate, endDate) {
  if (!startDate || !endDate) return true;
  return startDate <= endDate;
}

/**
 * Checks whether a given string has non-whitespace characters.
 * @param {unknown} value - Value to test
 * @returns {boolean} True if non-empty string
 */
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates that string length falls within specified minimum and maximum boundaries.
 * @param {string} value - String to check
 * @param {number} [min=0] - Minimum character length
 * @param {number} [max=Infinity] - Maximum character length
 * @returns {boolean} True if length is within range
 */
function isWithinLength(value, min = 0, max = Infinity) {
  if (typeof value !== "string") return false;
  const len = value.trim().length;
  return len >= min && len <= max;
}

/**
 * Validates an uploaded File object by size and allowed MIME types.
 * @param {File} file - File object to validate
 * @param {number} maxSizeBytes - Maximum allowed size in bytes
 * @param {Set<string>|string[]} allowedTypes - Collection of allowed MIME types
 * @returns {{ valid: boolean, error?: string }} Validation outcome with error description
 */
function validateFile(file, maxSizeBytes, allowedTypes) {
  if (!file) {
    return { valid: false, error: "No file provided." };
  }

  const typeSet = allowedTypes instanceof Set ? allowedTypes : new Set(allowedTypes);
  if (typeSet.size > 0 && !typeSet.has(file.type)) {
    return { valid: false, error: "Unsupported file format." };
  }

  if (maxSizeBytes > 0 && file.size > maxSizeBytes) {
    const sizeMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File size exceeds ${sizeMb} MB limit.` };
  }

  return { valid: true };
}

