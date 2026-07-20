import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';
import type { ConnectorConfig } from './connectors/types';

// Encrypt connector secrets at rest (AES-256-GCM) so tokens in connections.config
// aren't stored in plaintext. Key from SECRETS_KEY env (any string → hashed to 32B).
// If SECRETS_KEY is unset we fall back to plaintext (dev only) — logged once.
const KEY = process.env.SECRETS_KEY ? createHash('sha256').update(process.env.SECRETS_KEY).digest() : null;
const PREFIX = 'enc:v1:';

// Fields that hold secrets and must be encrypted. Non-secret fields (propertyId,
// ad_account_id, shop) stay plaintext so they remain queryable/inspectable.
const SECRET_FIELDS = ['refresh_token', 'access_token', 'secret_key'];

export function encryptValue(plain: string): string {
  if (!KEY) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decryptValue(v: string): string {
  if (!v.startsWith(PREFIX)) return v; // plaintext / not encrypted
  if (!KEY) return v;
  const raw = Buffer.from(v.slice(PREFIX.length), 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

// Encrypt the secret fields of a config before persisting.
export function encryptConfig(config: ConnectorConfig): ConnectorConfig {
  const out: ConnectorConfig = { ...config };
  for (const f of SECRET_FIELDS) if (out[f]) out[f] = encryptValue(out[f]!);
  return out;
}

// Decrypt the secret fields of a stored config before use.
export function decryptConfig(config: ConnectorConfig): ConnectorConfig {
  const out: ConnectorConfig = { ...config };
  for (const f of SECRET_FIELDS) if (out[f]) out[f] = decryptValue(out[f]!);
  return out;
}
