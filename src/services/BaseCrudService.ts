import { IRepository } from '../repositories/IRepository';
import {
  BaseEntity,
  CreatePayload,
  EntityId,
  QueryOptions,
  UpdatePayload,
} from '../types/crud.types';

type ChangeListener = () => void;

/**
 * LỚP SERVICE XỬ LÝ NGHIỆP VỤ CRUD TỔNG QUÁT (GENERIC BASE CRUD SERVICE)
 *
 * Đóng vai trò cầu nối giữa Giao diện (UI/Hooks) và Nguồn dữ liệu (Repository).
 * Hỗ trợ cơ chế đăng ký lắng nghe thay đổi (subscribe) để các màn hình
 * tự động đồng bộ dữ liệu sau khi Create / Update / Delete.
 */
export class BaseCrudService<T extends BaseEntity> {
  protected repository: IRepository<T>;
  private listeners: Set<ChangeListener> = new Set();

  constructor(repository: IRepository<T>) {
    this.repository = repository;
  }

  /**
   * Cho phép thay thế nguồn dữ liệu (Repository) linh hoạt khi tích hợp Database.
   */
  public setRepository(repository: IRepository<T>): void {
    this.repository = repository;
    this.notifyListeners();
  }

  /**
   * Đăng ký hàm lắng nghe khi dữ liệu thay đổi (thêm/sửa/xóa).
   */
  public subscribe(listener: ChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  protected notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  public async getAll(options?: QueryOptions<T>): Promise<T[]> {
    return this.repository.getAll(options);
  }

  public async getById(id: EntityId): Promise<T | null> {
    return this.repository.getById(id);
  }

  public async create(data: CreatePayload<T>): Promise<T> {
    const created = await this.repository.create(data);
    this.notifyListeners();
    return created;
  }

  public async update(id: EntityId, data: UpdatePayload<T>): Promise<T> {
    const updated = await this.repository.update(id, data);
    this.notifyListeners();
    return updated;
  }

  public async delete(id: EntityId): Promise<boolean> {
    const deleted = await this.repository.delete(id);
    if (deleted) {
      this.notifyListeners();
    }
    return deleted;
  }
}

