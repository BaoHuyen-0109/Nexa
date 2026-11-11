import {
  createUserWithEmailAndPassword,
  deleteUser,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  setDoc,
  startAfter,
} from 'firebase/firestore';
import {
  getFirestoreDb,
  getSecondaryAuthForUserCreation,
} from '../config/firebase';
import {
  buildStrictFirestoreUserDoc,
  estimateFirestoreUserDocBytes,
  FirestoreUserDocument,
  MAX_FIRESTORE_DOC_BYTES,
  UserEntity,
} from '../models/UserModel';
import {
  CreatePayload,
  EntityId,
  QueryOptions,
  UpdatePayload,
} from '../types/crud.types';
import { IRepository } from './IRepository';

export const USERS_COLLECTION = 'users';

export interface PaginatedUsersResult {
  items: UserEntity[];
  lastCursor: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/**
 * FIREBASE USER REPOSITORY
 *
 * Thực thi `IRepository<UserEntity>` với các cam kết nghiêm ngặt:
 * 1. Document ID trong Firestore chính là UID từ Firebase Authentication.
 * 2. Mỗi Firestore document trong collection `users` CHỈ ghi đúng 4 khóa:
 *    `email`, `matkhau` (luôn lưu `null`), `hoten`, `hinhanh`.
 * 3. Không bao giờ lưu plaintext password vào Firestore hoặc ghi password ra console.
 * 4. Sử dụng Secondary Firebase Auth instance khi tạo tài khoản mới để không
 *    làm thay đổi phiên đăng nhập hiện tại của Admin.
 * 5. Nếu tạo tài khoản trên Secondary Auth thành công nhưng ghi Firestore thất bại,
 *    tự động rollback bằng `deleteUser()` trên Secondary Auth trước khi `signOut()`.
 * 6. Chức năng `delete(id)` chỉ xóa hồ sơ Firestore (`/users/{uid}`), không xóa
 *    tài khoản Firebase Authentication (do giới hạn bảo mật của Client SDK).
 */
export class FirebaseUserRepository implements IRepository<UserEntity> {
  private readonly collectionName: string;

  constructor(collectionName: string = USERS_COLLECTION) {
    this.collectionName = collectionName;
  }

  private mapSnapshotToEntity(
    id: string,
    raw: Record<string, unknown>
  ): UserEntity {
    return {
      id,
      email: typeof raw.email === 'string' ? raw.email : '',
      matkhau: null,
      hoten: typeof raw.hoten === 'string' ? raw.hoten : '',
      hinhanh: typeof raw.hinhanh === 'string' ? raw.hinhanh : '',
    };
  }

  /**
   * Phân trang trực tiếp từ Firestore bằng `orderBy`, `limit` và `startAfter`.
   */
  public async getPaginatedPage(
    pageSize: number = 5,
    afterCursor?: QueryDocumentSnapshot<DocumentData> | null
  ): Promise<PaginatedUsersResult> {
    const db = getFirestoreDb();
    const colRef = collection(db, this.collectionName);

    const q = afterCursor
      ? query(
          colRef,
          orderBy('hoten', 'asc'),
          startAfter(afterCursor),
          limit(pageSize + 1)
        )
      : query(colRef, orderBy('hoten', 'asc'), limit(pageSize + 1));

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const slicedDocs = hasMore ? docs.slice(0, pageSize) : docs;

    const items = slicedDocs.map((docSnap) =>
      this.mapSnapshotToEntity(
        docSnap.id,
        docSnap.data() as Record<string, unknown>
      )
    );

    const lastCursor =
      slicedDocs.length > 0 ? slicedDocs[slicedDocs.length - 1] : null;

    return {
      items,
      lastCursor,
      hasMore,
    };
  }

  /**
   * Đếm tổng số bản ghi trong collection `users` trên Server.
   */
  public async countAll(): Promise<number> {
    const db = getFirestoreDb();
    const colRef = collection(db, this.collectionName);
    const snap = await getCountFromServer(colRef);
    return snap.data().count;
  }

  /**
   * Lắng nghe thay đổi dữ liệu thời gian thực trực tiếp từ Cloud Firestore (/users).
   * Khi thêm, sửa hoặc xóa người dùng từ Mobile, Firestore sẽ tự động đẩy dữ liệu mới về Web qua kết nối socket/stream.
   */
  public subscribeRealtime(
    callback: (users: UserEntity[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const db = getFirestoreDb();
    const colRef = collection(db, this.collectionName);
    const q = query(colRef, orderBy('hoten', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) =>
          this.mapSnapshotToEntity(
            docSnap.id,
            docSnap.data() as Record<string, unknown>
          )
        );
        callback(items);
      },
      (err) => {
        if (onError) {
          onError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    );

    return unsubscribe;
  }

  public async getAll(options?: QueryOptions<UserEntity>): Promise<UserEntity[]> {
    const db = getFirestoreDb();
    const colRef = collection(db, this.collectionName);
    const q = query(colRef, orderBy('hoten', 'asc'));
    const snapshot = await getDocs(q);

    let items: UserEntity[] = snapshot.docs.map((docSnap) =>
      this.mapSnapshotToEntity(
        docSnap.id,
        docSnap.data() as Record<string, unknown>
      )
    );

    if (options?.searchQuery && options.searchQuery.trim().length > 0) {
      const keyword = options.searchQuery.trim().toLowerCase();
      items = items.filter(
        (user) =>
          user.email.toLowerCase().includes(keyword) ||
          user.hoten.toLowerCase().includes(keyword)
      );
    }

    if (options?.filterFn) {
      items = items.filter(options.filterFn);
    }

    if (options?.sortBy) {
      const sortKey = options.sortBy;
      const order = options.sortOrder === 'desc' ? -1 : 1;
      items.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        return valA > valB ? order : -order;
      });
    }

    return items;
  }

  public async getById(id: EntityId): Promise<UserEntity | null> {
    const db = getFirestoreDb();
    const docRef = doc(db, this.collectionName, String(id));
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return null;
    }

    return this.mapSnapshotToEntity(
      snap.id,
      snap.data() as Record<string, unknown>
    );
  }

  public async create(data: CreatePayload<UserEntity>): Promise<UserEntity> {
    const email = data.email.trim().toLowerCase();
    const password = data.matkhau ?? '';

    if (!password || password.length < 6) {
      throw new Error('Mật khẩu khởi tạo tài khoản phải có ít nhất 6 ký tự.');
    }

    // Chuẩn bị sẵn document 4 khóa chuẩn và kiểm tra kích thước trước khi gọi Auth
    const strictDoc: FirestoreUserDocument = buildStrictFirestoreUserDoc({
      email,
      hoten: data.hoten,
      hinhanh: data.hinhanh,
    });

    const estimatedPreBytes = estimateFirestoreUserDocBytes(
      'TEMP_UID_28_CHARS_PLACEHOLDER',
      strictDoc
    );
    if (estimatedPreBytes > MAX_FIRESTORE_DOC_BYTES) {
      throw new Error(
        `Tổng kích thước hồ sơ (${Math.round(estimatedPreBytes / 1024)} KB) vượt quá ngưỡng an toàn 750 KB của Firestore.`
      );
    }

    const secondaryAuth = await getSecondaryAuthForUserCreation();
    let createdAuthUser: User | null = null;

    try {
      const credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password
      );
      createdAuthUser = credential.user;
      const uid = createdAuthUser.uid;

      const exactDocBytes = estimateFirestoreUserDocBytes(uid, strictDoc);
      if (exactDocBytes > MAX_FIRESTORE_DOC_BYTES) {
        throw new Error(
          `Kích thước tài liệu Firestore (${Math.round(exactDocBytes / 1024)} KB) vượt quá ngưỡng an toàn 750 KB.`
        );
      }

      const db = getFirestoreDb();
      const userDocRef = doc(db, this.collectionName, uid);
      await setDoc(userDocRef, strictDoc);

      return {
        id: uid,
        ...strictDoc,
      };
    } catch (error) {
      // Rollback: Nếu đã tạo tài khoản trên Secondary Auth nhưng ghi Firestore lỗi,
      // xóa ngay tài khoản Auth vừa tạo để tránh kẹt email (orphan Auth account).
      if (createdAuthUser) {
        await deleteUser(createdAuthUser).catch(() => undefined);
      }
      throw error;
    } finally {
      await signOut(secondaryAuth).catch(() => undefined);
    }
  }

  public async update(
    id: EntityId,
    data: UpdatePayload<UserEntity>
  ): Promise<UserEntity> {
    const db = getFirestoreDb();
    const docId = String(id);
    const docRef = doc(db, this.collectionName, docId);
    const existingSnap = await getDoc(docRef);

    if (!existingSnap.exists()) {
      throw new Error(`Không tìm thấy người dùng với UID: ${docId}`);
    }

    const existing = this.mapSnapshotToEntity(
      existingSnap.id,
      existingSnap.data() as Record<string, unknown>
    );

    // Email là định danh gắn với Firebase Auth nên giữ nguyên `existing.email` (readonly).
    // Ghi đè document với đúng 4 khóa chuẩn, `matkhau` luôn là `null`.
    const strictDoc: FirestoreUserDocument = buildStrictFirestoreUserDoc({
      email: existing.email,
      hoten: data.hoten !== undefined ? data.hoten : existing.hoten,
      hinhanh: data.hinhanh !== undefined ? data.hinhanh : existing.hinhanh,
    });

    const exactDocBytes = estimateFirestoreUserDocBytes(docId, strictDoc);
    if (exactDocBytes > MAX_FIRESTORE_DOC_BYTES) {
      throw new Error(
        `Kích thước tài liệu Firestore (${Math.round(exactDocBytes / 1024)} KB) vượt quá ngưỡng an toàn 750 KB.`
      );
    }

    await setDoc(docRef, strictDoc);

    return {
      id: docId,
      ...strictDoc,
    };
  }

  /**
   * LƯU Ý QUAN TRỌNG VỀ CHỨC NĂNG XÓA:
   * Do giới hạn bảo mật của Firebase Client SDK (không dùng Firebase Admin SDK / Blaze Cloud Functions),
   * phương thức này CHỈ xóa hồ sơ người dùng trong Firestore (`/users/{uid}`),
   * KHÔNG xóa tài khoản đăng nhập gốc trong Firebase Authentication.
   */
  public async delete(id: EntityId): Promise<boolean> {
    const db = getFirestoreDb();
    const docId = String(id);
    const docRef = doc(db, this.collectionName, docId);
    const existingSnap = await getDoc(docRef);

    if (!existingSnap.exists()) {
      throw new Error(`Không tìm thấy hồ sơ người dùng cần xóa với UID: ${docId}`);
    }

    await deleteDoc(docRef);
    return true;
  }
}

export const firebaseUserRepository = new FirebaseUserRepository();
