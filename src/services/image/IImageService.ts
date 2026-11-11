/**
 * GIAO DIỆN TRỪU TƯỢNG DỊCH VỤ HÌNH ẢNH (IMAGE SERVICE INTERFACE)
 * Hỗ trợ chọn ảnh từ thiết bị (Web & Android), nén ảnh sang Base64
 * và kiểm tra định dạng URL ảnh trực tiếp.
 */

export const MAX_BASE64_BYTES = 700 * 1024; // Giới hạn ~700 KB sau mã hóa Base64

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export interface ImagePickResult {
  cancelled: boolean;
  /** Chuỗi Data URL (`data:image/jpeg;base64,...`) đã được nén và kiểm tra dung lượng */
  dataUrl?: string;
  mimeType?: string;
  fileName?: string;
  encodedBytes?: number;
}

export interface IImageService {
  /**
   * Mở bộ chọn ảnh trên Web hoặc Android, tự động kiểm tra MIME type,
   * nén ảnh và trả về chuỗi Base64 Data URL giới hạn <= 700 KB.
   */
  pickAndEncodeImage(): Promise<ImagePickResult>;

  /**
   * Nén một File ảnh trên Web (ví dụ từ sự kiện kéo thả - Drag & Drop) sang Base64 <= 700 KB.
   */
  encodeWebFile?(file: File): Promise<ImagePickResult>;

  /**
   * Kiểm tra tính hợp lệ của chuỗi hình ảnh (chấp nhận Base64 Data URL hợp lệ <= 700 KB hoặc URL trực tiếp http/https).
   */
  validateImageSource(value: string): { isValid: boolean; error?: string };

  /**
   * Kiểm tra MIME type có nằm trong danh sách cho phép hay không.
   */
  isAllowedMimeType(mimeType: string): boolean;
}
