import { describe, expect, it } from 'vitest';

import { encryptPassword } from './passwordCrypto';

describe('passwordCrypto', () => {
  it('should encrypt password with AES', () => {
    const original = '123456';
    const encrypted = encryptPassword(original, 'AES', 'thanks,edms2026!');
    expect(encrypted).toBeTruthy();
    expect(encrypted).not.toBe(original);
  });

  it('should throw error for invalid AES key length', () => {
    expect(() => encryptPassword('123456', 'AES', 'short')).toThrow();
  });

  it('should throw error for invalid SM4 key', () => {
    expect(() => encryptPassword('123456', 'SM4', 'not-hex')).toThrow();
  });
});
