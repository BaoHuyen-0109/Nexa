import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Platform } from 'react-native';
import { getFirestoreDb } from '../config/firebase';
import { FirestoreUserDocument } from '../models/UserModel';
import { USERS_COLLECTION } from '../repositories/FirebaseUserRepository';

/**
 * Cấu trúc file JSON xuất ra để nộp báo cáo:
 * - Key cấp 1 là `users`.
 * - Mỗi key con bên trong `users` chính là `UID` của người dùng (Document ID).
 * - Giá trị của mỗi UID là một object CHỈ GỒM ĐÚNG 4 TRƯỜNG NGHIỆP VỤ:
 *   + email: string
 *   + matkhau: null (tuyệt đối không xuất mật khẩu Auth)
 *   + hoten: string
 *   + hinhanh: string (Base64 hoặc URL)
 * - Tuyệt đối không thêm trường dữ liệu thứ 5 và không yêu cầu Service Account Key.
 */
export type ExportedUsersDatabaseJson = Record<string, FirestoreUserDocument>;

export interface ExportResult {
  totalExported: number;
  fileName: string;
}

export class DatabaseExportService {
  /**
   * Truy vấn toàn bộ dữ liệu thực tế từ collection /users trên Firestore.
   */
  public async fetchRawUsersDatabase(): Promise<ExportedUsersDatabaseJson> {
    const db = getFirestoreDb();
    const colRef = collection(db, USERS_COLLECTION);
    const q = query(colRef, orderBy('hoten', 'asc'));
    const snapshot = await getDocs(q);

    const exportedData: ExportedUsersDatabaseJson = {};

    snapshot.docs.forEach((docSnap) => {
      const raw = docSnap.data() as Record<string, unknown>;
      const uid = docSnap.id;

      // Đảm bảo nghiêm ngặt CHỈ CÓ ĐÚNG 4 TRƯỜNG, matkhau luôn là null, UID là key
      exportedData[uid] = {
        email: typeof raw.email === 'string' ? raw.email : '',
        matkhau: null,
        hoten: typeof raw.hoten === 'string' ? raw.hoten : '',
        hinhanh: typeof raw.hinhanh === 'string' ? raw.hinhanh : '',
      };
    });

    return exportedData;
  }

  /**
   * Xuất và kích hoạt tải xuống file `PTDNT_Database.json` trên trình duyệt Web.
   */
  public async exportAndDownloadJson(
    customFileName: string = 'PTDNT_Database.json'
  ): Promise<ExportResult> {
    const data = await this.fetchRawUsersDatabase();
    const totalCount = Object.keys(data).length;

    const jsonString = JSON.stringify(data, null, 2);

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = customFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    return {
      totalExported: totalCount,
      fileName: customFileName,
    };
  }
}

export const databaseExportService = new DatabaseExportService();

