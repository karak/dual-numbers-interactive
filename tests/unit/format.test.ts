import { describe, it, expect } from 'vitest';
import { fmt3, signed } from '../../src/lib/format';

describe('fmt3', () => {
  it('formats positive number with 3 decimals', () => {
    expect(fmt3(1.23456)).toBe('1.235');
  });
  it('formats integer', () => {
    expect(fmt3(2)).toBe('2.000');
  });
  it('formats negative', () => {
    expect(fmt3(-0.5)).toBe('-0.500');
  });
});

describe('signed', () => {
  it('prefixes + for positive', () => {
    expect(signed(2)).toBe('+ 2');
  });
  it('prefixes - for negative', () => {
    expect(signed(-3)).toBe('- 3');
  });
  it('handles zero as +', () => {
    expect(signed(0)).toBe('+ 0');
  });
});
