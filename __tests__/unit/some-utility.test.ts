import { capitalize, sum } from '@/lib/utils/some-utility';

describe('capitalize', () => {
  it('should capitalize the first letter of a string', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('should return an empty string for an empty input', () => {
    expect(capitalize('')).toBe('');
  });

  it('should handle strings with mixed case', () => {
    expect(capitalize('wOrLd')).toBe('World');
  });

  it('should handle single character strings', () => {
    expect(capitalize('a')).toBe('A');
  });
});

describe('sum', () => {
  it('should return the sum of two numbers', () => {
    expect(sum(1, 2)).toBe(3);
  });

  it('should handle negative numbers', () => {
    expect(sum(-1, 5)).toBe(4);
  });

  it('should handle zero', () => {
    expect(sum(0, 0)).toBe(0);
  });
});