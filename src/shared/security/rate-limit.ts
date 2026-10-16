import { APP_CONSTANTS } from '../config/constants';
import { DomainError } from '../lib/errors';

interface RateLimitBucket {
  attempts: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();

export class TerlaluBanyakPercobaanError extends DomainError {
  constructor(retryAfterSeconds: number) {
    super(
      'TERLALU_BANYAK_PERCOBAAN',
      `Terlalu banyak percobaan login gagal. Coba lagi dalam ${retryAfterSeconds} detik.`,
      429
    );
  }
}

export function checkLoginRateLimit(key: string, nowMs = Date.now()): void {
  const entry = buckets.get(key);
  if (!entry) return;
  if (nowMs >= entry.resetAt) {
    buckets.delete(key);
    return;
  }
  if (entry.attempts >= APP_CONSTANTS.LOGIN_MAX_ATTEMPTS) {
    const retrySeconds = Math.ceil((entry.resetAt - nowMs) / 1000);
    throw new TerlaluBanyakPercobaanError(retrySeconds);
  }
}

export function recordLoginFailure(key: string, nowMs = Date.now()): void {
  const existing = buckets.get(key);
  if (!existing || nowMs >= existing.resetAt) {
    buckets.set(key, {
      attempts: 1,
      resetAt: nowMs + APP_CONSTANTS.LOGIN_WINDOW_MS,
    });
    return;
  }
  existing.attempts += 1;
}

export function resetLoginAttempts(key: string): void {
  buckets.delete(key);
}
