import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getUtf8ByteLength } from '../../models/UserModel';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  IImageService,
  ImagePickResult,
  MAX_BASE64_BYTES,
} from './IImageService';

const DATA_URL_REGEX = /^data:(image\/(?:jpeg|jpg|png|webp));base64,[A-Za-z0-9+/=]+$/i;
const DIRECT_URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

/**
 * DỊCH VỤ XỬ LÝ ẢNH BASE64 KẾT HỢP HỖ TRỢ URL TRỰC TIẾP (BASE64 IMAGE SERVICE)
 *
 * - Hỗ trợ chọn ảnh trên cả Web và Android (Expo Go).
 * - Kiểm tra chặt chẽ MIME type (`image/jpeg`, `image/png`, `image/webp`).
 * - Nén ảnh trước khi chuyển sang Base64.
 * - Giới hạn kích thước sau mã hóa tối đa ~700 KB để đảm bảo an toàn tuyệt đối cho Firestore Document (1 MB).
 * - Hỗ trợ nhập/dán URL ảnh trực tiếp (`http://` hoặc `https://`).
 */
export class Base64ImageService implements IImageService {
  private readonly maxDimension = 640;

  public isAllowedMimeType(mimeType: string): boolean {
    const normalized = mimeType.trim().toLowerCase();
    return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(normalized);
  }

  public getByteLength(str: string): number {
    return getUtf8ByteLength(str);
  }

  public validateImageSource(value: string): { isValid: boolean; error?: string } {
    const trimmed = value.trim();
    if (!trimmed) {
      return { isValid: false, error: 'Vui lòng chọn hình ảnh hoặc nhập URL ảnh.' };
    }

    if (trimmed.startsWith('data:')) {
      const match = DATA_URL_REGEX.exec(trimmed);
      if (!match) {
        return {
          isValid: false,
          error: 'Định dạng ảnh Base64 không hợp lệ (chỉ hỗ trợ JPG, PNG, WEBP).',
        };
      }

      const mimeType = match[1].toLowerCase();
      if (!this.isAllowedMimeType(mimeType)) {
        return {
          isValid: false,
          error: `Định dạng MIME "${mimeType}" không được hỗ trợ.`,
        };
      }

      const byteLength = this.getByteLength(trimmed);
      if (byteLength > MAX_BASE64_BYTES) {
        const sizeKB = Math.round(byteLength / 1024);
        return {
          isValid: false,
          error: `Kích thước ảnh sau mã hóa (${sizeKB} KB) vượt quá giới hạn 700 KB.`,
        };
      }

      return { isValid: true };
    }

    if (DIRECT_URL_REGEX.test(trimmed)) {
      return { isValid: true };
    }

    return {
      isValid: false,
      error: 'Hình ảnh phải là ảnh tải lên hợp lệ hoặc đường dẫn URL (http/https).',
    };
  }

  public async pickAndEncodeImage(): Promise<ImagePickResult> {
    if (Platform.OS === 'web') {
      return this.pickOnWeb();
    }
    return this.pickOnNative();
  }

  /**
   * Chọn và nén ảnh trên trình duyệt Web bằng HTML5 File + Canvas
   */
  private pickOnWeb(): Promise<ImagePickResult> {
    return new Promise<ImagePickResult>((resolve, reject) => {
      if (typeof document === 'undefined') {
        resolve({ cancelled: true });
        return;
      }

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = ALLOWED_IMAGE_MIME_TYPES.join(',');

      input.onchange = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) {
          resolve({ cancelled: true });
          return;
        }

        try {
          const encoded = await this.encodeWebFile(file);
          resolve(encoded);
        } catch (err) {
          reject(err);
        }
      };

      input.oncancel = () => {
        resolve({ cancelled: true });
      };

      input.click();
    });
  }

  /**
   * Nén một đối tượng File trên Web sang Base64 Data URL <= 700 KB
   */
  public async encodeWebFile(file: File): Promise<ImagePickResult> {
    if (!this.isAllowedMimeType(file.type)) {
      throw new Error(
        `Định dạng file "${file.type || 'không xác định'}" không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP.`
      );
    }

    const rawDataUrl = await this.readFileAsDataUrl(file);
    const compressedDataUrl = await this.compressDataUrlOnWeb(rawDataUrl);
    const encodedBytes = this.getByteLength(compressedDataUrl);

    if (encodedBytes > MAX_BASE64_BYTES) {
      throw new Error(
        `Ảnh sau khi nén (${Math.round(encodedBytes / 1024)} KB) vẫn vượt quá giới hạn 700 KB. Vui lòng chọn ảnh khác.`
      );
    }

    return {
      cancelled: false,
      dataUrl: compressedDataUrl,
      mimeType: 'image/jpeg',
      fileName: file.name,
      encodedBytes,
    };
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Không thể đọc dữ liệu file ảnh.'));
        }
      };
      reader.onerror = () => reject(new Error('Lỗi khi đọc file ảnh từ thiết bị.'));
      reader.readAsDataURL(file);
    });
  }

  private compressDataUrlOnWeb(sourceDataUrl: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        resolve(sourceDataUrl);
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > this.maxDimension || height > this.maxDimension) {
          if (width >= height) {
            height = Math.round((height * this.maxDimension) / width);
            width = this.maxDimension;
          } else {
            width = Math.round((width * this.maxDimension) / height);
            height = this.maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Trình duyệt không hỗ trợ xử lý nén ảnh Canvas.'));
          return;
        }

        // Vẽ nền trắng cho ảnh PNG trong suốt trước khi xuất JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const qualities = [0.75, 0.6, 0.45, 0.3];
        for (const q of qualities) {
          const output = canvas.toDataURL('image/jpeg', q);
          if (this.getByteLength(output) <= MAX_BASE64_BYTES) {
            resolve(output);
            return;
          }
        }

        // Trả về mức nén thấp nhất để kiểm tra dung lượng ở bước tiếp theo
        resolve(canvas.toDataURL('image/jpeg', 0.25));
      };

      img.onerror = () => {
        reject(new Error('Tệp tin không phải là hình ảnh hợp lệ.'));
      };

      img.src = sourceDataUrl;
    });
  }

  /**
   * Chọn và nén ảnh trên thiết bị di động Android (Expo Go) qua expo-image-picker
   */
  private async pickOnNative(): Promise<ImagePickResult> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Cần cấp quyền truy cập thư viện ảnh để chọn hình đại diện.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.55,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { cancelled: true };
    }

    const asset = result.assets[0];
    const mimeType = (asset.mimeType || 'image/jpeg').toLowerCase();

    if (!this.isAllowedMimeType(mimeType)) {
      throw new Error(
        `Định dạng ảnh "${mimeType}" không được hỗ trợ. Vui lòng chọn ảnh JPG, PNG hoặc WEBP.`
      );
    }

    if (!asset.base64) {
      throw new Error('Không thể trích xuất dữ liệu Base64 từ ảnh đã chọn.');
    }

    const dataUrl = `data:${mimeType};base64,${asset.base64}`;
    const encodedBytes = this.getByteLength(dataUrl);

    if (encodedBytes > MAX_BASE64_BYTES) {
      throw new Error(
        `Kích thước ảnh (${Math.round(encodedBytes / 1024)} KB) vượt quá giới hạn 700 KB. Vui lòng chọn hoặc cắt ảnh nhỏ hơn.`
      );
    }

    return {
      cancelled: false,
      dataUrl,
      mimeType,
      fileName: asset.fileName ?? 'avatar.jpg',
      encodedBytes,
    };
  }
}

export const imageService: IImageService = new Base64ImageService();

