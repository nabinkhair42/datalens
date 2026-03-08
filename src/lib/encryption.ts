import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

// AES-256-GCM encryption for secure credential storage
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

// Get encryption key from environment variable
function getEncryptionKey(): Buffer {
  const secret = process.env['ENCRYPTION_SECRET'];
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is required for credential encryption');
  }

  // Use scrypt to derive a key from the secret
  // Salt is fixed per deployment for consistency (derived from secret itself)
  const salt = scryptSync(secret, 'datalens-salt', SALT_LENGTH);
  return scryptSync(secret, salt, KEY_LENGTH);
}

/**
 * Encrypts sensitive data using AES-256-GCM
 * Returns: base64 encoded string containing IV + authTag + ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    return '';
  }

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

  const authTag = cipher.getAuthTag();

  // Combine IV + authTag + encrypted data
  const combined = Buffer.concat([iv, authTag, encrypted]);

  return combined.toString('base64');
}

/**
 * Decrypts data encrypted with the encrypt function
 * Expects: base64 encoded string containing IV + authTag + ciphertext
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    return '';
  }

  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedData, 'base64');

  // Extract IV, authTag, and encrypted data
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted.toString('utf8');
}

/**
 * Re-encrypts data with a new key (for key rotation)
 * Note: Requires both old and new secrets to be available
 */
export function reEncrypt(encryptedData: string, oldSecret: string, newSecret: string): string {
  if (!encryptedData) {
    return '';
  }

  // Derive old key
  const oldSalt = scryptSync(oldSecret, 'datalens-salt', SALT_LENGTH);
  const oldKey = scryptSync(oldSecret, oldSalt, KEY_LENGTH);

  // Decrypt with old key
  const combined = Buffer.from(encryptedData, 'base64');
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, oldKey, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');

  // Derive new key
  const newSalt = scryptSync(newSecret, 'datalens-salt', SALT_LENGTH);
  const newKey = scryptSync(newSecret, newSalt, KEY_LENGTH);

  // Encrypt with new key
  const newIv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, newKey, newIv);
  const newEncrypted = Buffer.concat([cipher.update(decrypted, 'utf8'), cipher.final()]);
  const newAuthTag = cipher.getAuthTag();

  const newCombined = Buffer.concat([newIv, newAuthTag, newEncrypted]);
  return newCombined.toString('base64');
}
