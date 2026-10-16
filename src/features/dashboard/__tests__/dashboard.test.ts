import { describe, expect, it } from 'vitest';
import { buildLastNDaysBuckets } from '../domain/dashboard';

describe('Fitur Dashboard - Kalkulasi Bucket 30 Hari', () => {
  it('membangun 30 titik tanggal berurutan dan mengisi nilai masuk/keluar', () => {
    const now = new Date('2026-10-16T05:00:00Z');
    const buckets = buildLastNDaysBuckets(now, 30, [
      { dayKey: '2026-10-16', totalIn: 25, totalOut: 10 },
    ]);
    expect(buckets).toHaveLength(30);
    const last = buckets[29];
    expect(last?.dateLabel).toBe('16/10');
    expect(last?.totalIn).toBe(25);
    expect(last?.totalOut).toBe(10);
  });
});
