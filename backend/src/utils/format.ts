/**
 * Formatting utilities for Indian Currency (INR) and Indian Phone Numbers.
 */

export function formatINR(amount: number | string | any): string {
  let num: number;
  if (typeof amount === 'number') {
    num = amount;
  } else if (typeof amount === 'string') {
    num = parseFloat(amount);
  } else if (amount && typeof amount.toNumber === 'function') {
    num = amount.toNumber();
  } else if (amount && typeof amount.toString === 'function') {
    num = parseFloat(amount.toString());
  } else {
    num = Number(amount);
  }

  if (isNaN(num)) return '₹0.00';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Normalizes Indian phone numbers to E.164 format: +91XXXXXXXXXX
 * Validates that the base number is 10 digits starting with 6, 7, 8, or 9.
 */
export function normalizeIndianPhoneNumber(rawPhone: string): {
  isValid: boolean;
  normalized: string;
  error?: string;
} {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { isValid: false, normalized: '', error: 'Phone number is required' };
  }

  // Strip spaces, dashes, parentheses
  let cleaned = rawPhone.replace(/[\s\-()]/g, '');

  // Strip leading +91 or 91 or 0
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  // Check 10 digits starting with 6-9
  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (!indianMobileRegex.test(cleaned)) {
    return {
      isValid: false,
      normalized: '',
      error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9',
    };
  }

  return {
    isValid: true,
    normalized: `+91${cleaned}`,
  };
}
