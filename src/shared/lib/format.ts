import { APP_CONSTANTS } from '../config/constants';

const rupiahFormatter = new Intl.NumberFormat(APP_CONSTANTS.LOCALE, {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat(APP_CONSTANTS.LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const dateFormatterWib = new Intl.DateTimeFormat(APP_CONSTANTS.LOCALE, {
  timeZone: APP_CONSTANTS.TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFormatterWib = new Intl.DateTimeFormat(APP_CONSTANTS.LOCALE, {
  timeZone: APP_CONSTANTS.TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatRupiah(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return 'Rp 0';
  return rupiahFormatter.format(num);
}

export function formatQuantity(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '0';
  return numberFormatter.format(num);
}

export function formatDateWib(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '-';
  return dateFormatterWib.format(d);
}

export function formatDateTimeWib(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '-';
  return `${dateTimeFormatterWib.format(d)} WIB`;
}

export function toNumericString(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}
