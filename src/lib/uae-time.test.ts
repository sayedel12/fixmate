import { describe, expect, it } from '@jest/globals';
import { getDubaiDate, isValidUaeMobile } from './uae-time';

describe('UAE locale helpers', () => {
  it('calculates service dates using Dubai local time, not device UTC date', () => {
    const eveningInDubai = new Date('2026-10-19T20:30:00.000Z');
    expect(getDubaiDate(0, eveningInDubai)).toBe('2026-10-20');
    expect(getDubaiDate(1, eveningInDubai)).toBe('2026-10-21');
  });

  it('accepts UAE mobile numbers in international format', () => {
    expect(isValidUaeMobile('+971501234567')).toBe(true);
    expect(isValidUaeMobile('+971401234567')).toBe(false);
    expect(isValidUaeMobile('0501234567')).toBe(false);
  });
});
