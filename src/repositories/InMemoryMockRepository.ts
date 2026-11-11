import {
  BaseEntity,
  CreatePayload,
  EntityId,
  QueryOptions,
  UpdatePayload,
} from '../types/crud.types';
import { IRepository } from './IRepository';

/**
 * REPOSITORY GIẢ LẬP TRONG BỘ NHỚ TẠM (IN-MEMORY MOCK REPOSITORY)
 *
 * LƯU Ý QUAN TRỌNG:
 * - Đây KHÔNG phải là Database chính thức của đề thi.
 * - Lớp này chỉ dùng để kiểm tra luồng dữ liệu CRUD (Create - Read - Update - Delete)
 *   khi chưa biết công nghệ lưu trữ mà giảng viên yêu cầu.
 * - Khi nhận đề thi, bạn chỉ cần viết lớp Repository mới thực thi `IRepository<T>`
 *   và thay thế vào tầng Service.
 */
export class InMemoryMockRepository<T extends BaseEntity>
  implements IRepository<T>
{
  private items: T[];
  private searchableFields: Array<keyof T>;

  constructor(initialItems: T[] = [], searchableFields: Array<keyof T> = []) {
    this.items = [...initialItems];
    this.searchableFields = searchableFields;
  }

  async getAll(options?: QueryOptions<T>): Promise<T[]> {
    let result = [...this.items];

    if (options?.searchQuery && options.searchQuery.trim().length > 0) {
      const keyword = options.searchQuery.trim().toLowerCase();
      result = result.filter((item) => {
        const fieldsToSearch =
          this.searchableFields.length > 0
            ? this.searchableFields
            : (Object.keys(item) as Array<keyof T>);

        return fieldsToSearch.some((field) => {
          const val = item[field];
          return (
            typeof val === 'string' && val.toLowerCase().includes(keyword)
          );
        });
      });
    }

    if (options?.filterFn) {
      result = result.filter(options.filterFn);
    }

    if (options?.sortBy) {
      const sortKey = options.sortBy;
      const order = options.sortOrder === 'desc' ? -1 : 1;
      result.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        return valA > valB ? order : -order;
      });
    }

    return result;
  }

  async getById(id: EntityId): Promise<T | null> {
    const found = this.items.find((item) => String(item.id) === String(id));
    return found ? { ...found } : null;
  }

  async create(data: CreatePayload<T>): Promise<T> {
    const now = new Date().toISOString();
    const generatedId = `ITEM_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newItem = {
      ...data,
      id: generatedId,
      createdAt: now,
      updatedAt: now,
    } as T;

    this.items = [newItem, ...this.items];
    return { ...newItem };
  }

  async update(id: EntityId, data: UpdatePayload<T>): Promise<T> {
    const index = this.items.findIndex(
      (item) => String(item.id) === String(id)
    );

    if (index === -1) {
      throw new Error(`Không tìm thấy bản ghi với ID: ${String(id)}`);
    }

    const updatedItem: T = {
      ...this.items[index],
      ...data,
      id: this.items[index].id,
      updatedAt: new Date().toISOString(),
    };

    this.items[index] = updatedItem;
    return { ...updatedItem };
  }

  async delete(id: EntityId): Promise<boolean> {
    const initialLength = this.items.length;
    this.items = this.items.filter((item) => String(item.id) !== String(id));
    if (this.items.length === initialLength) {
      throw new Error(`Không tìm thấy bản ghi cần xóa với ID: ${String(id)}`);
    }
    return true;
  }
}

