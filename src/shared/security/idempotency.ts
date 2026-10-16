import crypto from 'node:crypto';
import {
  DataTidakValidError,
  TransaksiDuplikatError,
} from '../lib/errors';

const seenKeys = new Map<string, number>();
const KEY_TTL_MS = 10 * 60 * 1000;

export function generateIdempotencyKey(prefix = 'idem'): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function assertValidIdempotencyKey(key: string): void {
  const trimmed = key.trim();
  if (trimmed.length < 8 || trimmed.length > 120) {
    throw new DataTidakValidError(
      'Idempotency key wajib memiliki panjang antara 8 hingga 120 karakter.'
    );
  }
}

export function assertAndLockIdempotency(key: string, nowMs = Date.now()): void {
  assertValidIdempotencyKey(key);
  const clean = key.trim();
  const existingExpiry = seenKeys.get(clean);
  if (existingExpiry && existingExpiry > nowMs) {
    throw new TransaksiDuplikatError();
  }
  seenKeys.set(clean, nowMs + KEY_TTL_MS);
}
