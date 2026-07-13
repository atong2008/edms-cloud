import CryptoJS from 'crypto-js';
import { sm4 } from 'sm-crypto';

const AES_KEY_LENGTH = 16;
const SM4_HEX_KEY_LENGTH = 32;
const SM4_HEX_KEY_PATTERN = /^[0-9a-fA-F]{32}$/;

export type EncryptType = 'AES' | 'SM4';

/**
 * 加密登录密码，需与后端 security.encode-type / security.encode-key 保持一致。
 * @param password 明文密码
 * @param encryptType 加密类型，默认 AES
 * @param encryptKey 加密密钥
 * @returns 加密后的密文
 */
export function encryptPassword(
  password: string,
  encryptType: EncryptType = 'AES',
  encryptKey: string = import.meta.env.VITE_PWD_ENC_KEY || '',
): string {
  if (encryptType === 'AES') {
    return encryptByAes(password, encryptKey);
  }
  if (encryptType === 'SM4') {
    return encryptBySm4(password, encryptKey);
  }
  throw new Error(`Unsupported password encryption type: ${encryptType}`);
}

function encryptByAes(password: string, key: string): string {
  const keyBytes = CryptoJS.enc.Utf8.parse(key);
  if (keyBytes.sigBytes !== AES_KEY_LENGTH) {
    throw new Error(
      `AES encode-key must be ${AES_KEY_LENGTH} bytes (current: ${keyBytes.sigBytes})`,
    );
  }
  const iv = keyBytes;
  const encrypted = CryptoJS.AES.encrypt(password, keyBytes, {
    iv,
    mode: CryptoJS.mode.CFB,
    padding: CryptoJS.pad.NoPadding,
  });
  return encrypted.toString();
}

function encryptBySm4(password: string, key: string): string {
  if (!SM4_HEX_KEY_PATTERN.test(key)) {
    throw new Error(
      `SM4 encode-key must be ${SM4_HEX_KEY_LENGTH} hex characters`,
    );
  }
  return sm4.encrypt(password, key);
}

export default encryptPassword;
