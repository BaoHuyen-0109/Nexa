import {
  BaseEntity,
  CreatePayload,
  EntityId,
  QueryOptions,
  UpdatePayload,
} from '../types/crud.types';

/**
 * GIAO DIỆN REPOSITORY TỔNG QUÁT (GENERIC REPOSITORY INTERFACE)
 *
 * Mọi nguồn lưu trữ dữ liệu khi nhận đề thi (SQLite, AsyncStorage, API, v.v.)
 * đều chỉ cần thực thi (implement) interface này.
 * Tầng Service và UI hoàn toàn độc lập với công nghệ lưu trữ bên dưới.
 */
export interface IRepository<T extends BaseEntity> {
  /**
   * Lấy danh sách toàn bộ bản ghi (hỗ trợ tìm kiếm, lọc và sắp xếp tùy chọn).
   */
  getAll(options?: QueryOptions<T>): Promise<T[]>;

  /**
   * Lấy chi tiết một bản ghi theo định danh (id).
   */
  getById(id: EntityId): Promise<T | null>;

  /**
   * Tạo mới một bản ghi.
   */
  create(data: CreatePayload<T>): Promise<T>;

  /**
   * Cập nhật bản ghi theo định danh (id).
   */
  update(id: EntityId, data: UpdatePayload<T>): Promise<T>;

  /**
   * Xóa bản ghi theo định danh (id).
   */
  delete(id: EntityId): Promise<boolean>;
}

