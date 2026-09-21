const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSPORT_ID_PATTERN = /^pp_[a-zA-Z0-9]{4,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function isValidPassportId(value: string): boolean {
  return PASSPORT_ID_PATTERN.test(value.trim());
}

export function requiredError(value: string, label: string): string | null {
  return value.trim() ? null : `${label} is required`;
}

export function emailError(value: string): string | null {
  const missing = requiredError(value, 'Email');
  if (missing) return missing;
  return isValidEmail(value) ? null : 'Enter a valid email address';
}

export function passportIdError(value: string): string | null {
  const missing = requiredError(value, 'Patient passport ID');
  if (missing) return missing;
  return isValidPassportId(value) ? null : 'Must look like pp_xxxxxxxx';
}
