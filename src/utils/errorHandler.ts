/**
 * TIỆN ÍCH XỬ LÝ LỖI TẬP TRUNG (ERROR HANDLER UTILITY)
 */

export class AppError extends Error {
  public readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

/**
 * Chuẩn hóa mọi đối tượng lỗi thành thông báo chuỗi thân thiện với người dùng.
 */
export function extractErrorMessage(
  error: unknown,
  fallbackMessage = 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.'
): string {
  if (!error) {
    return fallbackMessage;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }

  if (
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  return fallbackMessage;
}

