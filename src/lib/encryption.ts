import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

// AES-256-GCM encryption constants
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

// Cached encryption key (scryptSync is slow by design)
let cachedKey: Buffer | null = null;

function getEncryptionKey(): Buffer {
  if (cachedKey) {
    return cachedKey;
  }

  const secret = process.env['ENCRYPTION_SECRET'];
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is required for credential encryption');
  }

  const salt = scryptSync(secret, 'datalens-salt', SALT_LENGTH);
  cachedKey = scryptSync(secret, salt, KEY_LENGTH);
  return cachedKey;
}

// Encrypts data using AES-256-GCM, returns base64(IV + authTag + ciphertext)
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    return '';
  }

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, encrypted]);

  return combined.toString('base64');
}

// Decrypts base64(IV + authTag + ciphertext) back to plaintext
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    return '';
  }

  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedData, 'base64');

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted.toString('utf8');
}

// Re-encrypts data with a new key (for key rotation)
export function reEncrypt(encryptedData: string, oldSecret: string, newSecret: string): string {
  if (!encryptedData) {
    return '';
  }

  // Derive old key and decrypt
  const oldSalt = scryptSync(oldSecret, 'datalens-salt', SALT_LENGTH);
  const oldKey = scryptSync(oldSecret, oldSalt, KEY_LENGTH);

  const combined = Buffer.from(encryptedData, 'base64');
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, oldKey, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');

  // Derive new key and encrypt
  const newSalt = scryptSync(newSecret, 'datalens-salt', SALT_LENGTH);
  const newKey = scryptSync(newSecret, newSalt, KEY_LENGTH);

  const newIv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, newKey, newIv);
  const newEncrypted = Buffer.concat([cipher.update(decrypted, 'utf8'), cipher.final()]);
  const newAuthTag = cipher.getAuthTag();

  const newCombined = Buffer.concat([newIv, newAuthTag, newEncrypted]);
  return newCombined.toString('base64');
}
