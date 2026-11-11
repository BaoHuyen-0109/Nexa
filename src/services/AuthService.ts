import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  getFirestoreDb,
  getPrimaryAuth,
  isFirebaseConfigured,
} from '../config/firebase';

export const ADMINS_COLLECTION = 'admins';

export interface AdminUserProfile {
  uid: string;
  email: string;
  displayName: string;
}

/**
 * DỊCH VỤ XÁC THỰC & PHÂN QUYỀN QUẢN TRỊ VIÊN (ADMIN AUTH SERVICE)
 *
 * Bảo mật:
 * - Không bao giờ ghi mật khẩu ra console.
 * - Không sử dụng biến môi trường phía client (`EXPO_PUBLIC_*`) để cấp quyền Admin.
 * - Không cho phép tài khoản người dùng thông thường (trong collection `users`)
 *   tự động có quyền truy cập trang quản trị.
 * - Xác thực quyền Admin đồng bộ 100% với Firestore Security Rules qua:
 *   1. Custom Claim `admin === true` trên Firebase ID Token, HOẶC
 *   2. Document tồn tại hợp lệ trong collection `/admins/{uid}` trên Firestore.
 */
export class AuthService {
  /**
   * Kiểm tra một Firebase User đã đăng nhập có quyền Admin hợp lệ hay không.
   */
  public async verifyIsAdmin(user: User): Promise<boolean> {
    try {
      // 1. Kiểm tra Custom Claims trên ID Token (do Firebase Admin SDK cấp)
      const tokenResult = await user.getIdTokenResult();
      if (tokenResult.claims.admin === true) {
        return true;
      }

      // 2. Kiểm tra document định danh trong collection `/admins/{uid}` trên Firestore
      const db = getFirestoreDb();
      const adminDocRef = doc(db, ADMINS_COLLECTION, user.uid);
      const adminSnap = await getDoc(adminDocRef);

      if (adminSnap.exists()) {
        const data = adminSnap.data() as Record<string, unknown>;
        if (data.disabled === true || data.active === false) {
          return false;
        }
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Đăng nhập dành riêng cho Admin.
   * Nếu tài khoản hợp lệ về mật khẩu nhưng không có quyền Admin, hệ thống sẽ
   * lập tức đăng xuất và từ chối truy cập.
   */
  public async loginAdmin(
    email: string,
    password: string
  ): Promise<AdminUserProfile> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      throw new Error('Vui lòng nhập đầy đủ email và mật khẩu quản trị.');
    }

    const auth = getPrimaryAuth();
    let credential;

    try {
      credential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err) {
        const code = String((err as { code: unknown }).code);
        if (
          code === 'auth/invalid-credential' ||
          code === 'auth/user-not-found' ||
          code === 'auth/wrong-password'
        ) {
          throw new Error('Email hoặc mật khẩu không chính xác.');
        }
        if (code === 'auth/too-many-requests') {
          throw new Error(
            'Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau.'
          );
        }
      }
      throw new Error(
        'Không thể đăng nhập. Vui lòng kiểm tra kết nối mạng và cấu hình Firebase (.env).'
      );
    }

    const isAdmin = await this.verifyIsAdmin(credential.user);
    if (!isAdmin) {
      await signOut(auth).catch(() => undefined);
      throw new Error(
        `Tài khoản "${normalizedEmail}" (UID: ${credential.user.uid}) chưa được cấp quyền Quản trị viên trong collection /admins/{uid}. Truy cập bị từ chối.`
      );
    }

    return {
      uid: credential.user.uid,
      email: credential.user.email ?? normalizedEmail,
      displayName: credential.user.displayName || 'Admin',
    };
  }

  /**
   * Đăng xuất Admin hiện tại.
   */
  public async logoutAdmin(): Promise<void> {
    if (!isFirebaseConfigured()) {
      return;
    }
    const auth = getPrimaryAuth();
    await signOut(auth);
  }

  /**
   * Lắng nghe trạng thái phiên đăng nhập Admin.
   */
  public subscribeAdminAuth(
    callback: (admin: AdminUserProfile | null) => void
  ): () => void {
    if (!isFirebaseConfigured()) {
      callback(null);
      return () => undefined;
    }

    const auth = getPrimaryAuth();
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        callback(null);
        return;
      }

      const isAdmin = await this.verifyIsAdmin(user);
      if (!isAdmin) {
        await signOut(auth).catch(() => undefined);
        callback(null);
        return;
      }

      callback({
        uid: user.uid,
        email: user.email ?? '',
        displayName: user.displayName || 'Admin',
      });
    });
  }
}

export const authService = new AuthService();
