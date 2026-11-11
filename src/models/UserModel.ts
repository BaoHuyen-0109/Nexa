import { BaseEntity } from '../types/crud.types';

/**
 * GIỚI HẠN AN TOÀN CHO TOÀN BỘ FIRESTORE DOCUMENT: 750 KB (768,000 bytes)
 * (Giới hạn cứng của Firestore là 1 MiB = 1,048,576 bytes).
 */
export const MAX_FIRESTORE_DOC_BYTES = 750 * 1024;

/**
 * CẤU TRÚC TÀI LIỆU NGƯỜI DÙNG TRONG FIRESTORE (STRICT 4-FIELD CONTRACT)
 *
 * Giảng viên chỉ chấp nhận đúng 4 khóa trong Firestore document:
 * - email: string
 * - matkhau: string | null (mặc định lưu null, mật khẩu thực tế do Firebase Authentication quản lý)
 * - hoten: string
 * - hinhanh: string (Base64 Data URL đã nén <= 700KB hoặc URL trực tiếp http/https)
 */
export interface FirestoreUserDocument {
  email: string;
  matkhau: string | null;
  hoten: string;
  hinhanh: string;
}

/**
 * Thực thể người dùng sử dụng trong tầng ứng dụng (Service / UI).
 * Thuộc tính `id` là Document ID (Firebase Auth UID), tuyệt đối KHÔNG ghi vào bên trong thân document Firestore.
 */
export interface UserEntity extends BaseEntity, FirestoreUserDocument {
  id: string;
}

/**
 * Dữ liệu đầu vào khi Admin tạo người dùng mới.
 * `matkhau` dùng để khởi tạo tài khoản trên Firebase Authentication (Secondary App),
 * sau đó khi lưu xuống Firestore thì trường `matkhau` luôn được gán `null`.
 */
export interface CreateUserInput {
  email: string;
  matkhau: string;
  hoten: string;
  hinhanh: string;
}

/**
 * Dữ liệu đầu vào khi Admin cập nhật thông tin người dùng.
 */
export interface UpdateUserInput {
  email?: string;
  matkhau?: string | null;
  hoten?: string;
  hinhanh?: string;
}

/**
 * Tính chính xác độ dài byte UTF-8 của một chuỗi bất kỳ (hỗ trợ đầy đủ tiếng Việt có dấu trên cả Web & React Native).
 */
export function getUtf8ByteLength(str: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str).length;
  }
  let bytes = 0;
  for (let i = 0; i < str.length; i++) {
    const codePoint = str.charCodeAt(i);
    if (codePoint < 0x80) {
      bytes += 1;
    } else if (codePoint < 0x800) {
      bytes += 2;
    } else if (codePoint >= 0xd800 && codePoint <= 0xdbff) {
      // Surrogate pair (4 bytes UTF-8)
      bytes += 4;
      i++;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

/**
 * Ước lượng kích thước thực tế của toàn bộ Firestore Document `/users/{uid}` theo quy tắc tính của Firestore:
 * - Kích thước tên đường dẫn document (`users/{uid}` + overhead đường dẫn)
 * - Kích thước tên 4 khóa (`email`, `matkhau`, `hoten`, `hinhanh`)
 * - Kích thước byte UTF-8 của các giá trị chuỗi (`email`, `hoten`, `hinhanh`) + giá trị `null` (1 byte)
 * - Overhead cấu trúc nội bộ của Firestore document (~64 bytes)
 */
export function estimateFirestoreUserDocBytes(
  docId: string,
  docData: FirestoreUserDocument
): number {
  const pathOverhead = getUtf8ByteLength(`users/${docId}`) + 64;
  const fieldNamesBytes =
    getUtf8ByteLength('email') +
    getUtf8ByteLength('matkhau') +
    getUtf8ByteLength('hoten') +
    getUtf8ByteLength('hinhanh') +
    16;
  const valuesBytes =
    getUtf8ByteLength(docData.email) +
    1 + // matkhau === null
    getUtf8ByteLength(docData.hoten) +
    getUtf8ByteLength(docData.hinhanh);

  return pathOverhead + fieldNamesBytes + valuesBytes + 64;
}

/**
 * Hàm chuẩn hóa đối tượng trước khi ghi xuống Firestore:
 * Đảm bảo 100% chỉ có đúng 4 khóa (`email`, `matkhau`, `hoten`, `hinhanh`),
 * loại bỏ hoàn toàn `id`, `createdAt`, `updatedAt` và không bao giờ lưu plaintext password.
 */
export function buildStrictFirestoreUserDoc(input: {
  email: string;
  hoten: string;
  hinhanh: string;
}): FirestoreUserDocument {
  return {
    email: input.email.trim().toLowerCase(),
    matkhau: null,
    hoten: input.hoten.trim(),
    hinhanh: input.hinhanh.trim(),
  };
}
