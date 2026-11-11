import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import {
  buildStrictFirestoreUserDoc,
  estimateFirestoreUserDocBytes,
  MAX_FIRESTORE_DOC_BYTES,
  UserEntity,
} from '../models/UserModel';
import {
  firebaseUserRepository,
  FirebaseUserRepository,
  PaginatedUsersResult,
} from '../repositories/FirebaseUserRepository';
import { CreatePayload, EntityId, UpdatePayload } from '../types/crud.types';
import { commonPatterns } from '../utils/validators';
import { BaseCrudService } from './BaseCrudService';
import { imageService, IImageService } from './image';

/**
 * USER SERVICE
 *
 * Xử lý toàn bộ nghiệp vụ quản lý người dùng (Create, Read, Update, Delete, Pagination).
 * Giao diện (UI) chỉ gọi qua `userService`, tuyệt đối không gọi trực tiếp Firestore.
 */
export class UserService extends BaseCrudService<UserEntity> {
  private readonly userRepo: FirebaseUserRepository;
  private readonly imgService: IImageService;

  constructor(
    repository: FirebaseUserRepository = firebaseUserRepository,
    imgService: IImageService = imageService
  ) {
    super(repository);
    this.userRepo = repository;
    this.imgService = imgService;
  }

  private validateCommonFields(input: {
    email?: string;
    hoten?: string;
    hinhanh?: string;
    docIdForEstimation?: string;
  }): void {
    if (input.email !== undefined) {
      const trimmedEmail = input.email.trim();
      if (!trimmedEmail || !commonPatterns.email.test(trimmedEmail)) {
        throw new Error('Địa chỉ email không hợp lệ.');
      }
    }

    if (input.hoten !== undefined) {
      const trimmedName = input.hoten.trim();
      if (!trimmedName || trimmedName.length < 2) {
        throw new Error('Họ tên người dùng phải có ít nhất 2 ký tự.');
      }
      if (trimmedName.length > 150) {
        throw new Error('Họ tên người dùng không được vượt quá 150 ký tự.');
      }
    }

    if (input.hinhanh !== undefined) {
      const imgValidation = this.imgService.validateImageSource(input.hinhanh);
      if (!imgValidation.isValid) {
        throw new Error(imgValidation.error ?? 'Hình ảnh không hợp lệ.');
      }
    }

    // Kiểm tra tổng kích thước ước lượng của toàn bộ Firestore Document (<= 750 KB)
    const sampleDoc = buildStrictFirestoreUserDoc({
      email: input.email ?? 'user@example.com',
      hoten: input.hoten ?? 'User',
      hinhanh: input.hinhanh ?? '',
    });
    const estimatedDocBytes = estimateFirestoreUserDocBytes(
      input.docIdForEstimation ?? 'ESTIMATED_UID_28_CHARACTERS_',
      sampleDoc
    );
    if (estimatedDocBytes > MAX_FIRESTORE_DOC_BYTES) {
      const kb = Math.round(estimatedDocBytes / 1024);
      throw new Error(
        `Tổng kích thước tài liệu Firestore (${kb} KB) vượt quá giới hạn an toàn 750 KB.`
      );
    }
  }

  private mapFirebaseError(error: unknown): Error {
    if (error && typeof error === 'object' && 'code' in error) {
      const code = String((error as { code: unknown }).code);
      switch (code) {
        case 'auth/email-already-in-use':
          return new Error(
            'Email này đã tồn tại trên Firebase Authentication (hoặc thuộc về tài khoản cũ chưa xóa trên Auth Console).'
          );
        case 'auth/invalid-email':
          return new Error('Định dạng địa chỉ email không hợp lệ.');
        case 'auth/weak-password':
          return new Error('Mật khẩu quá yếu (cần tối thiểu 6 ký tự).');
        case 'permission-denied':
          return new Error(
            'Không đủ quyền truy cập Firestore. Vui lòng đảm bảo tài khoản đã được cấp quyền trong /admins/{uid}.'
          );
      }
    }
    return error instanceof Error
      ? error
      : new Error('Đã xảy ra lỗi khi xử lý dữ liệu người dùng.');
  }

  /**
   * Lấy một trang dữ liệu từ Firestore bằng `limit()` và `startAfter()`.
   */
  public async getPaginatedPage(
    pageSize: number = 5,
    afterCursor?: QueryDocumentSnapshot<DocumentData> | null
  ): Promise<PaginatedUsersResult> {
    try {
      return await this.userRepo.getPaginatedPage(pageSize, afterCursor);
    } catch (err) {
      throw this.mapFirebaseError(err);
    }
  }

  /**
   * Đếm tổng số lượng người dùng từ Firestore metadata (cực nhanh, không tải payload dữ liệu/ảnh).
   */
  public async countAll(): Promise<number> {
    try {
      return await this.userRepo.countAll();
    } catch {
      return 0;
    }
  }

  /**
   * Lắng nghe thay đổi dữ liệu thời gian thực trực tiếp từ Cloud Firestore (/users).
   * Đồng bộ 2 chiều tức thì giữa Web Dashboard và Mobile App mà không cần tải lại trang.
   */
  public subscribeRealtime(
    callback: (users: UserEntity[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.userRepo.subscribeRealtime(callback, onError);
  }

  public override async create(
    data: CreatePayload<UserEntity>
  ): Promise<UserEntity> {
    this.validateCommonFields({
      email: data.email,
      hoten: data.hoten,
      hinhanh: data.hinhanh,
    });

    if (!data.matkhau || data.matkhau.length < 6) {
      throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
    }

    try {
      return await super.create(data);
    } catch (err) {
      throw this.mapFirebaseError(err);
    }
  }

  public override async update(
    id: EntityId,
    data: UpdatePayload<UserEntity>
  ): Promise<UserEntity> {
    this.validateCommonFields({
      hoten: data.hoten,
      hinhanh: data.hinhanh,
      docIdForEstimation: String(id),
    });

    try {
      return await super.update(id, {
        hoten: data.hoten,
        hinhanh: data.hinhanh,
        // Không cho phép cập nhật email và luôn giữ matkhau là null
        matkhau: null,
      });
    } catch (err) {
      throw this.mapFirebaseError(err);
    }
  }

  /**
   * Xóa hồ sơ người dùng khỏi Firestore (`/users/{uid}`).
   * Lưu ý: Tài khoản Firebase Authentication gốc không bị xóa bởi Client SDK.
   */
  public override async delete(id: EntityId): Promise<boolean> {
    try {
      return await super.delete(id);
    } catch (err) {
      throw this.mapFirebaseError(err);
    }
  }
}

export const userService = new UserService();
