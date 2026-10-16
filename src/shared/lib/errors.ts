export class DomainError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;

  constructor(code: string, message: string, httpStatus = 400) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export class StokTidakCukupError extends DomainError {
  constructor(itemName: string, available: number, requested: number) {
    super(
      'STOK_TIDAK_CUKUP',
      `Stok "${itemName}" tidak mencukupi. Tersedia: ${available}, diminta: ${requested}.`,
      422
    );
  }
}

export class TidakBerhakError extends DomainError {
  constructor(
    message = 'Anda tidak memiliki hak akses untuk melakukan tindakan ini.'
  ) {
    super('TIDAK_BERHAK', message, 403);
  }
}

export class BelumLoginError extends DomainError {
  constructor(message = 'Sesi Anda telah berakhir. Silakan login kembali.') {
    super('BELUM_LOGIN', message, 401);
  }
}

export class DataTidakValidError extends DomainError {
  constructor(message: string) {
    super('DATA_TIDAK_VALID', message, 400);
  }
}

export class DataTidakDitemukanError extends DomainError {
  constructor(entity: string) {
    super('DATA_TIDAK_DITEMUKAN', `${entity} tidak ditemukan.`, 404);
  }
}

export class TransaksiDuplikatError extends DomainError {
  constructor(
    message = 'Transaksi ini sudah pernah diproses (Idempotency Key terdeteksi).'
  ) {
    super('TRANSAKSI_DUPLIKAT', message, 409);
  }
}

export interface ApiErrorPayload {
  ok: false;
  code: string;
  message: string;
  status: number;
}

export function translateDomainError(error: unknown): ApiErrorPayload {
  if (error instanceof DomainError) {
    return {
      ok: false,
      code: error.code,
      message: error.message,
      status: error.httpStatus,
    };
  }
  if (error instanceof Error) {
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      message: error.message || 'Terjadi kesalahan sistem internal.',
      status: 500,
    };
  }
  return {
    ok: false,
    code: 'UNKNOWN_ERROR',
    message: 'Terjadi kesalahan yang tidak diketahui.',
    status: 500,
  };
}
