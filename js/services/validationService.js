/**
 * Validation Service
 * Centralized, modular validation utilities for form fields and data models.
 */

(function () {
  const ValidationService = {
    isValidEmail(email) {
      if (!email || typeof email !== "string") return false;
      const trimmed = email.trim();
      if (trimmed.length === 0 || trimmed.length > 254) return false;
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      return emailRegex.test(trimmed);
    },

    isValidUrl(url) {
      if (!url || typeof url !== "string") return false;
      const trimmed = url.trim();
      if (trimmed.length === 0 || trimmed.length > 2048) return false;
      try {
        const parsed = new URL(trimmed);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },

    isValidPhone(phone) {
      if (!phone || typeof phone !== "string") return false;
      const trimmed = phone.trim();
      if (trimmed.length === 0 || trimmed.length > 25) return false;
      if (!/^[+]?[(]?[0-9\s\-().]{6,25}$/.test(trimmed)) return false;
      const digitCount = (trimmed.match(/\d/g) || []).length;
      return digitCount >= 7 && digitCount <= 15;
    },

    isValidExactPhone(phone, exactDigits) {
      if (!phone || typeof phone !== "string") return false;
      const trimmed = phone.trim();
      if (!/^\d+$/.test(trimmed)) return false;
      return trimmed.length === exactDigits;
    },

    isValidMonthYear(value) {
      if (!value || typeof value !== "string") return false;
      const trimmed = value.trim();
      const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(trimmed);
      if (!match) return false;
      const year = parseInt(match[1], 10);
      return year >= 1900 && year <= 2100;
    },

    isValidDateRange(startDate, endDate) {
      if (!startDate || !endDate) return true;
      return startDate <= endDate;
    },

    isNonEmptyString(value) {
      return typeof value === "string" && value.trim().length > 0;
    },

    isWithinLength(value, min = 0, max = Infinity) {
      if (typeof value !== "string") return false;
      const len = value.trim().length;
      return len >= min && len <= max;
    },

    validateFile(file, maxSizeBytes = 2097152, allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"]) {
      if (!file || !(file instanceof File || (typeof file === "object" && file.size !== undefined))) {
        return { valid: false, error: "No file selected." };
      }
      if (!allowedMimeTypes.includes(file.type)) {
        return {
          valid: false,
          error: `File type "${file.type || "unknown"}" is not supported. Please upload a JPG, PNG, or WebP image.`,
        };
      }
      if (file.size > maxSizeBytes) {
        const sizeMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
        return {
          valid: false,
          error: `File size exceeds the ${sizeMb}MB limit. Please upload a smaller image.`,
        };
      }
      return { valid: true, error: null };
    },
  };

  window.ValidationService = ValidationService;

  // Expose legacy global helpers for compatibility
  window.isValidEmail = ValidationService.isValidEmail;
  window.isValidUrl = ValidationService.isValidUrl;
  window.isValidPhone = ValidationService.isValidPhone;
  window.isValidExactPhone = ValidationService.isValidExactPhone;
  window.isValidMonthYear = ValidationService.isValidMonthYear;
  window.isValidDateRange = ValidationService.isValidDateRange;
  window.isNonEmptyString = ValidationService.isNonEmptyString;
  window.isWithinLength = ValidationService.isWithinLength;
  window.validateFile = ValidationService.validateFile;
})();
