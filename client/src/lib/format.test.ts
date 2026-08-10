import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { daysUntil, formatDate, formatDateOnly, truncateAddress } from './format';

describe('truncateAddress', () => {
  it('returns an empty string for empty input', () => {
    expect(truncateAddress('')).toBe('');
  });

  it('returns short addresses unchanged (well under the truncation window)', () => {
    expect(truncateAddress('ABCDE')).toBe('ABCDE');
  });

  it('returns the address unchanged exactly at the truncation window boundary', () => {
    // default chars=4 -> window = chars * 2 + 3 = 11
    const address = 'ABCDEFGHIJK';
    expect(address).toHaveLength(11);
    expect(truncateAddress(address)).toBe(address);
  });

  it('truncates to `first…last` once the address exceeds the window', () => {
    // one character past the 11-char boundary
    const address = 'ABCDEFGHIJKL';
    expect(truncateAddress(address)).toBe('ABCD…IJKL');
  });

  it('truncates a realistic Stellar address using the default 4-char window', () => {
    const address = 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37';
    expect(truncateAddress(address)).toBe(`${address.slice(0, 4)}…${address.slice(-4)}`);
  });

  it('respects a custom chars parameter', () => {
    const address = 'ABCDEFGHIJKLMNOPQRST';
    expect(truncateAddress(address, 6)).toBe('ABCDEF…OPQRST');
  });
});

describe('formatDate', () => {
  it('returns a non-empty string', () => {
    const result = formatDate('2026-07-24T10:15:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes time-of-day: different instants on the same day produce different output', () => {
    const morning = formatDate('2026-07-24T09:00:00Z');
    const evening = formatDate('2026-07-24T21:00:00Z');
    expect(morning).not.toBe(evening);
  });
});

describe('formatDateOnly', () => {
  it('returns a non-empty string', () => {
    const result = formatDateOnly('2026-07-24T10:15:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('ignores time-of-day: different times on the same day produce the same output', () => {
    // Kept close to UTC noon so no real-world timezone offset (-12..+14) crosses midnight.
    const morning = formatDateOnly('2026-07-24T12:00:00Z');
    const afternoon = formatDateOnly('2026-07-24T13:00:00Z');
    expect(morning).toBe(afternoon);
  });

  it('produces different output for different days', () => {
    const day1 = formatDateOnly('2026-07-24T12:00:00Z');
    const day2 = formatDateOnly('2026-08-10T12:00:00Z');
    expect(day1).not.toBe(day2);
  });
});

describe('daysUntil', () => {
  const NOW = new Date('2026-08-10T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a negative number for a past date, without throwing', () => {
    expect(() => daysUntil('2026-08-01T12:00:00Z')).not.toThrow();
    expect(daysUntil('2026-08-01T12:00:00Z')).toBeLessThan(0);
  });

  it('returns a positive number for a future date', () => {
    expect(daysUntil('2026-08-20T12:00:00Z')).toBeGreaterThan(0);
  });

  it('returns 0 for the current instant', () => {
    expect(daysUntil(NOW.toISOString())).toBe(0);
  });

  it('rounds up partial days (ceiling), not down', () => {
    // 25 hours ahead is 1.0417 days away, which should ceil to 2, not floor to 1.
    const future = new Date(NOW.getTime() + 25 * 60 * 60 * 1000).toISOString();
    expect(daysUntil(future)).toBe(2);
  });
});
