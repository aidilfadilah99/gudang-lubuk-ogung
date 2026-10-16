export const APP_CONSTANTS = {
  COOPERATIVE_NAME: 'KDKMP Lubuk Ogung',
  SYSTEM_TITLE: 'Sistem Pergudangan Barang KDKMP Lubuk Ogung',
  TIMEZONE: 'Asia/Jakarta',
  LOCALE: 'id-ID',
  DEFAULT_WAREHOUSE_ID: 'wh_lubuk_ogung_01',
  DEFAULT_WAREHOUSE_NAME: 'Gudang Utama KDKMP Lubuk Ogung',
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SESSION_COOKIE_NAME: 'kdkmp_session',
  SESSION_MAX_AGE_SECONDS: 60 * 60 * 12, // 12 jam kerja
  LOGIN_MAX_ATTEMPTS: 5,
  LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 menit
} as const;

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'PETUGAS_GUDANG',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
