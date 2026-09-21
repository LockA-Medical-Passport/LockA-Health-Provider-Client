import { describe, expect, it } from 'vitest';
import { emailError, isValidEmail, isValidPassportId, passportIdError, requiredError } from './validation';

describe('isValidEmail', () => {
  it.each([
    ['a.okoye@aventinegeneral.org', true],
    ['name+tag@example.co', true],
    ['not-an-email', false],
    ['missing@domain', false],
    ['@no-local.com', false],
    ['', false],
    ['   ', false],
])('isValidEmail(%s) -> %s', (value, expected) => {
    expect(isValidEmail(value)).toBe(expected);
  });
});

describe('isValidPassportId', () => {
  it.each([
    ['pp_3a91ee02', true],
    ['pp_ABCD1234', true],
    ['pp_ab', false],
    ['3a91ee02', false],
    ['PP_3a91ee02', false],
    ['', false],
])('isValidPassportId(%s) -> %s', (value, expected) => {
    expect(isValidPassportId(value)).toBe(expected);
  });
});

describe('requiredError', () => {
  it('returns a message for empty/whitespace values', () => {
    expect(requiredError('', 'Name')).toBe('Name is required');
    expect(requiredError('   ', 'Name')).toBe('Name is required');
  });

  it('returns null for a non-empty value', () => {
    expect(requiredError('Jane', 'Name')).toBeNull();
  });
});

describe('emailError', () => {
  it('requires a value before checking format', () => {
    expect(emailError('')).toBe('Email is required');
  });

  it('flags an invalid format distinctly from a missing value', () => {
    expect(emailError('not-an-email')).toBe('Enter a valid email address');
  });

  it('returns null for a valid email', () => {
    expect(emailError('jane@example.com')).toBeNull();
  });
});

describe('passportIdError', () => {
  it('requires a value before checking shape', () => {
    expect(passportIdError('')).toBe('Patient passport ID is required');
  });

  it('flags an invalid shape distinctly from a missing value', () => {
    expect(passportIdError('not-a-passport-id')).toBe('Must look like pp_xxxxxxxx');
  });

  it('returns null for a valid passport ID', () => {
    expect(passportIdError('pp_3a91ee02')).toBeNull();
  });
});
