import { BaseEntity } from '../types/crud.types';

/**
 * MÔ HÌNH DỮ LIỆU KHUNG (PLACEHOLDER MODEL)
 *
 * LƯU Ý QUAN TRỌNG:
 * - Đây KHÔNG phải là Model nghiệp vụ cố định hay cấu trúc bảng Database chính thức.
 * - `GenericRecord` chỉ đóng vai trò đối tượng trung tính (Placeholder) để kiểm thử
 *   luồng kiến trúc CRUD (Create - Read - Update - Delete) và giao diện khung.
 * - Khi giảng viên công bố đề thi và cấu trúc Database, hãy định nghĩa interface
 *   Model thực tế kế thừa từ `BaseEntity` tại thư mục `src/models/`.
 */

export type RecordStatus = 'active' | 'inactive' | 'pending';

export interface GenericRecord extends BaseEntity {
  title: string;
  subtitle?: string;
  description?: string;
  status?: RecordStatus;
}

