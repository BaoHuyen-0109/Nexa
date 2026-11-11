import { useCallback, useEffect, useState } from 'react';
import { BaseCrudService } from '../services/BaseCrudService';
import {
  BaseEntity,
  CreatePayload,
  EntityId,
  QueryOptions,
  UpdatePayload,
} from '../types/crud.types';
import { extractErrorMessage } from '../utils/errorHandler';

export interface UseCrudReturn<T extends BaseEntity> {
  items: T[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  refresh: (customOptions?: QueryOptions<T>) => Promise<void>;
  getById: (id: EntityId) => Promise<T | null>;
  createItem: (data: CreatePayload<T>) => Promise<T | null>;
  updateItem: (id: EntityId, data: UpdatePayload<T>) => Promise<T | null>;
  deleteItem: (id: EntityId) => Promise<boolean>;
  clearError: () => void;
}

/**
 * HOOK QUẢN LÝ TRẠNG THÁI VÀ THAO TÁC CRUD TỔNG QUÁT
 *
 * Tự động đồng bộ dữ liệu giữa các màn hình khi có thao tác Thêm / Sửa / Xóa.
 */
export function useCrud<T extends BaseEntity>(
  service: BaseCrudService<T>,
  initialQueryOptions?: QueryOptions<T>
): UseCrudReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(
    initialQueryOptions?.searchQuery ?? ''
  );

  const fetchItems = useCallback(
    async (customOptions?: QueryOptions<T>) => {
      setLoading(true);
      setError(null);
      try {
        const data = await service.getAll({
          ...initialQueryOptions,
          searchQuery,
          ...customOptions,
        });
        setItems(data);
      } catch (err) {
        setError(extractErrorMessage(err, 'Không thể tải danh sách dữ liệu.'));
      } finally {
        setLoading(false);
      }
    },
    [service, searchQuery, initialQueryOptions]
  );

  useEffect(() => {
    void fetchItems();
    const unsubscribe = service.subscribe(() => {
      void fetchItems();
    });
    return unsubscribe;
  }, [fetchItems, service]);

  const getById = useCallback(
    async (id: EntityId): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        return await service.getById(id);
      } catch (err) {
        setError(extractErrorMessage(err, 'Không thể tải chi tiết bản ghi.'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [service]
  );

  const createItem = useCallback(
    async (data: CreatePayload<T>): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        return await service.create(data);
      } catch (err) {
        setError(extractErrorMessage(err, 'Không thể tạo bản ghi mới.'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [service]
  );

  const updateItem = useCallback(
    async (id: EntityId, data: UpdatePayload<T>): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        return await service.update(id, data);
      } catch (err) {
        setError(extractErrorMessage(err, 'Không thể cập nhật bản ghi.'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [service]
  );

  const deleteItem = useCallback(
    async (id: EntityId): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        return await service.delete(id);
      } catch (err) {
        setError(extractErrorMessage(err, 'Không thể xóa bản ghi.'));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [service]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    items,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    refresh: fetchItems,
    getById,
    createItem,
    updateItem,
    deleteItem,
    clearError,
  };
}

