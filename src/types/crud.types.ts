/**
 * KIỂU DỮ LIỆU TỔNG QUÁT CHO HỆ THỐNG CRUD
 * Không gắn với bất kỳ nghiệp vụ hay cơ sở dữ liệu cụ thể nào.
 */

export type EntityId = string | number;

/**
 * Thực thể cơ sở (Base Entity) mà mọi bản ghi quản lý đều kế thừa.
 */
export interface BaseEntity {
  id: EntityId;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Payload khi tạo mới (không cần truyền id, createdAt, updatedAt).
 */
export type CreatePayload<T extends BaseEntity> = Omit<
  T,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * Payload khi cập nhật (cho phép cập nhật một phần các trường).
 */
export type UpdatePayload<T extends BaseEntity> = Partial<
  Omit<T, 'id' | 'createdAt' | 'updatedAt'>
>;

/**
 * Tùy chọn truy vấn / lọc danh sách tổng quát.
 */
export interface QueryOptions<T> {
  searchQuery?: string;
  filterFn?: (item: T) => boolean;
  sortBy?: keyof T;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Kết quả trả về thống nhất từ tầng Service.
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  errorMessage?: string;
}

