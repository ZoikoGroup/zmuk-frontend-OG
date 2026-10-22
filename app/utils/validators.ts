/**
 * Centralized Validation Library for Zoiko Mobile
 * Provides standard validators for UK telecom, banking, card, and user inputs.
 */

// ── UK Mobile Phone ──────────────────────────────────────────────────────────
/**
 * Validates a UK mobile number adhering to Ofcom standards:
 * - 11 digits starting with 07 (e.g., 07123 456789)
 * - Or 12 digits starting with +447 or 447 (e.g., +44 7123 456789)
 */
export function validateUkMobile(phone?: string | null): {
  isValid: boolean;
  error?: string;
  formatted?: string;
} {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: "Mobile number is required." };
  }

  const cleaned = phone.replace(/[\s\-()]/g, "");
  // Remove leading +
  const noPlus = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;

  let local = "";
  if (noPlus.startsWith("447") && noPlus.length === 12) {
    local = "07" + noPlus.slice(3);
  } else if (noPlus.startsWith("07") && noPlus.length === 11) {
    local = noPlus;
  } else if (noPlus.startsWith("7") && noPlus.length === 10) {
    local = "0" + noPlus;
  }

  if (!local || !/^07\d{9}$/.test(local)) {
    return {
      isValid: false,
      error: "Enter a valid 11-digit UK mobile number starting with 07 (e.g. 07123 456789).",
    };
  }

  const formatted = `${local.slice(0, 5)} ${local.slice(5)}`;
  return { isValid: true, formatted };
}

// ── Email ────────────────────────────────────────────────────────────────────
/**
 * Validates RFC 5322 compliant email addresses.
 */
export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateEmail(email?: string | null): {
  isValid: boolean;
  error?: string;
  normalized?: string;
} {
  if (!email || !email.trim()) {
    return { isValid: false, error: "Email address is required." };
  }
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: "Enter a valid email address (e.g. name@example.com)." };
  }
  return { isValid: true, normalized: trimmed };
}

// ── Password ─────────────────────────────────────────────────────────────────
/**
 * Password complexity rule:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special symbol
 */
export function validatePassword(password?: string | null): {
  isValid: boolean;
  error?: string;
  score: number; // 0 to 4
} {
  if (!password) {
    return { isValid: false, error: "Password is required.", score: 0 };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) score++;

  if (password.length < 8) {
    return {
      isValid: false,
      error: "Password must be at least 8 characters long.",
      score,
    };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: "Password must include at least one uppercase letter (A-Z).",
      score,
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: "Password must include at least one lowercase letter (a-z).",
      score,
    };
  }
  if (!/\d/.test(password)) {
    return {
      isValid: false,
      error: "Password must include at least one digit (0-9).",
      score,
    };
  }

  return { isValid: true, score };
}

// ── UK Postcode ──────────────────────────────────────────────────────────────
/**
 * Royal Mail standard UK Postcode regex.
 * Handles formats like: SW1A 1AA, EC1A 1BB, W1A 0AX, M1 1AE, B33 8TH, CR2 6XH, DN55 1PT
 */
export const UK_POSTCODE_REGEX =
  /^([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9][A-Za-z]?))))\s?[0-9][A-Za-z]{2})$/;

export function validateUkPostcode(postcode?: string | null): {
  isValid: boolean;
  error?: string;
  formatted?: string;
} {
  if (!postcode || !postcode.trim()) {
    return { isValid: false, error: "Postcode is required." };
  }
  const clean = postcode.trim().toUpperCase();
  if (!UK_POSTCODE_REGEX.test(clean)) {
    return { isValid: false, error: "Enter a valid UK postcode (e.g. SW1A 1AA)." };
  }
  // Standard format spacing
  const formatted = clean.includes(" ")
    ? clean
    : `${clean.slice(0, clean.length - 3)} ${clean.slice(-3)}`;
  return { isValid: true, formatted };
}

// ── UK Bank Direct Debit (Sort Code & Account Number) ────────────────────────
export function validateUkSortCode(sortCode?: string | null): {
  isValid: boolean;
  error?: string;
  formatted?: string;
} {
  if (!sortCode || !sortCode.trim()) {
    return { isValid: false, error: "Sort code is required." };
  }
  const digits = sortCode.replace(/\D/g, "");
  if (digits.length !== 6) {
    return { isValid: false, error: "Sort code must be 6 digits (e.g. 20-40-60)." };
  }
  const formatted = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`;
  return { isValid: true, formatted };
}

export function validateUkAccountNumber(accountNumber?: string | null): {
  isValid: boolean;
  error?: string;
  digits?: string;
} {
  if (!accountNumber || !accountNumber.trim()) {
    return { isValid: false, error: "Account number is required." };
  }
  const digits = accountNumber.replace(/\D/g, "");
  if (digits.length !== 8) {
    return { isValid: false, error: "Bank account number must be exactly 8 digits." };
  }
  return { isValid: true, digits };
}

// ── Card Number (Luhn Mod-10 Check) ──────────────────────────────────────────
export function validateCardNumber(cardNumber?: string | null): {
  isValid: boolean;
  error?: string;
  brand: "Visa" | "Mastercard" | "Amex" | "Discover" | "Unknown";
  last4?: string;
} {
  if (!cardNumber || !cardNumber.trim()) {
    return { isValid: false, error: "Card number is required.", brand: "Unknown" };
  }
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) {
    return { isValid: false, error: "Enter a valid 16-digit card number.", brand: "Unknown" };
  }

  // Luhn algorithm verification
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  if (sum % 10 !== 0) {
    return { isValid: false, error: "Invalid card number. Please check the digits.", brand: "Unknown" };
  }

  // Brand detection
  let brand: "Visa" | "Mastercard" | "Amex" | "Discover" | "Unknown" = "Unknown";
  if (/^4/.test(digits)) brand = "Visa";
  else if (/^(5[1-5]|2[2-7])/.test(digits)) brand = "Mastercard";
  else if (/^3[47]/.test(digits)) brand = "Amex";
  else if (/^6(?:011|5)/.test(digits)) brand = "Discover";

  return { isValid: true, brand, last4: digits.slice(-4) };
}

// ── Card Expiry (MM/YY or MM/YYYY) ───────────────────────────────────────────
export function validateCardExpiry(expiry?: string | null): {
  isValid: boolean;
  error?: string;
  formatted?: string;
} {
  if (!expiry || !expiry.trim()) {
    return { isValid: false, error: "Expiry date is required." };
  }
  const clean = expiry.replace(/\s+/g, "");
  const match = clean.match(/^(\d{1,2})[\/\-](\d{2,4})$/);
  if (!match) {
    return { isValid: false, error: "Enter expiry as MM/YY (e.g. 08/28)." };
  }

  const month = parseInt(match[1], 10);
  let year = parseInt(match[2], 10);
  if (year < 100) year += 2000;

  if (month < 1 || month > 12) {
    return { isValid: false, error: "Invalid expiry month (01 to 12)." };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { isValid: false, error: "This card has expired." };
  }

  if (year > currentYear + 20) {
    return { isValid: false, error: "Invalid expiry year." };
  }

  const formattedMonth = String(month).padStart(2, "0");
  const formattedYear = String(year).slice(-2);
  return { isValid: true, formatted: `${formattedMonth}/${formattedYear}` };
}

// ── Card CVV / CVC ───────────────────────────────────────────────────────────
export function validateCardCvv(cvv?: string | null, isAmex = false): {
  isValid: boolean;
  error?: string;
} {
  if (!cvv || !cvv.trim()) {
    return { isValid: false, error: "Security code (CVV) is required." };
  }
  const digits = cvv.replace(/\D/g, "");
  const expectedLength = isAmex ? 4 : 3;
  if (digits.length !== expectedLength) {
    return {
      isValid: false,
      error: `CVV must be ${expectedLength} digits${isAmex ? " for Amex" : ""}.`,
    };
  }
  return { isValid: true };
}

// ── Ofcom PAC Code & STAC Code ───────────────────────────────────────────────
/**
 * Ofcom PAC format: 3 uppercase letters followed by 6 digits (e.g. ABC123456)
 */
export function validatePacCode(code?: string | null): {
  isValid: boolean;
  error?: string;
  formatted?: string;
} {
  if (!code || !code.trim()) {
    return { isValid: false, error: "PAC code is required." };
  }
  const clean = code.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z]{3}\d{6}$/.test(clean)) {
    return {
      isValid: false,
      error: "PAC code must be 3 letters followed by 6 numbers (e.g. ABC123456).",
    };
  }
  return { isValid: true, formatted: clean };
}

/**
 * Ofcom STAC format: 6 digits followed by 3 letters (e.g. 123456ABC)
 */
export function validateStacCode(code?: string | null): {
  isValid: boolean;
  error?: string;
  formatted?: string;
} {
  if (!code || !code.trim()) {
    return { isValid: false, error: "STAC code is required." };
  }
  const clean = code.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^\d{6}[A-Z]{3}$/.test(clean)) {
    return {
      isValid: false,
      error: "STAC code must be 6 numbers followed by 3 letters (e.g. 123456ABC).",
    };
  }
  return { isValid: true, formatted: clean };
}

// ── PUK Code (8 digits) ──────────────────────────────────────────────────────
export function validatePukCode(puk?: string | null): {
  isValid: boolean;
  error?: string;
} {
  if (!puk || !puk.trim()) {
    return { isValid: false, error: "PUK code is required." };
  }
  const digits = puk.replace(/\D/g, "");
  if (digits.length !== 8) {
    return { isValid: false, error: "PUK code must be exactly 8 digits." };
  }
  return { isValid: true };
}

// ── IMEI & EID (Luhn Mod-10 for IMEI) ────────────────────────────────────────
export function validateImeiOrEid(value?: string | null): {
  isValid: boolean;
  error?: string;
  type?: "IMEI" | "EID";
} {
  if (!value || !value.trim()) {
    return { isValid: false, error: "IMEI or EID is required." };
  }
  const clean = value.trim().replace(/\D/g, "");

  // EID: exactly 32 digits
  if (clean.length === 32) {
    return { isValid: true, type: "EID" };
  }

  // Standard IMEI: 15 digits (or 16 digits IMEISV)
  if (clean.length === 15) {
    // Luhn algorithm check on 15 digits
    let sum = 0;
    for (let i = 0; i < 15; i++) {
      let digit = parseInt(clean.charAt(i), 10);
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    if (sum % 10 !== 0) {
      return {
        isValid: false,
        error: "Invalid 15-digit IMEI check digit. Please re-check *#06# on your device.",
      };
    }
    return { isValid: true, type: "IMEI" };
  }

  return {
    isValid: false,
    error: "Enter a valid 15-digit IMEI or 32-digit eSIM EID number.",
  };
}

// ── Spend / Bill Limit (£0.00 to £100.00) ────────────────────────────────────
export function validateSpendLimit(value?: string | number | null): {
  isValid: boolean;
  error?: string;
  amount?: number;
} {
  if (value === undefined || value === null || String(value).trim() === "") {
    return { isValid: false, error: "Please enter a limit amount." };
  }
  const num = typeof value === "number" ? value : parseFloat(String(value));
  if (isNaN(num)) {
    return { isValid: false, error: "Please enter a valid monetary amount." };
  }
  if (num < 0) {
    return { isValid: false, error: "Spend limit cannot be negative (£0 minimum)." };
  }
  if (num > 100) {
    return { isValid: false, error: "Monthly spend limit cannot exceed £100.00." };
  }
  return { isValid: true, amount: Number(num.toFixed(2)) };
}

// ── Name & General Text ──────────────────────────────────────────────────────
export function validateName(name?: string | null, fieldName = "Name"): {
  isValid: boolean;
  error?: string;
  cleaned?: string;
} {
  if (!name || !name.trim()) {
    return { isValid: false, error: `${fieldName} is required.` };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters.` };
  }
  if (!/^[a-zA-Z\s\-'.]+$/.test(trimmed)) {
    return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens and apostrophes.` };
  }
  return { isValid: true, cleaned: trimmed };
}
