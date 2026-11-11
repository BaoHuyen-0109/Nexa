import { Platform } from 'react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  // @ts-ignore: getReactNativePersistence is exported by firebase/auth when bundled for React Native
  getReactNativePersistence,
  initializeAuth,
  inMemoryPersistence,
  setPersistence,
} from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

/**
 * CẤU HÌNH FIREBASE TẬP TRUNG (PROJECT: ptdnt-dc87f)
 *
 * Bảo mật:
 * - Tuyệt đối KHÔNG lưu cứng (hardcode) API Key hay credentials trong source code.
 * - Đọc thông tin cấu hình qua biến môi trường `EXPO_PUBLIC_FIREBASE_*` từ file `.env`.
 * - Hỗ trợ cả Web và Expo Go (Android).
 * - Khởi tạo Secondary Firebase App riêng biệt với `inMemoryPersistence` để Admin
 *   tạo tài khoản người dùng mới mà KHÔNG làm mất phiên đăng nhập Admin hiện tại.
 */

const SECONDARY_APP_NAME = 'PTDNT_Secondary_Auth_App';

export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'ptdnt-dc87f.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'ptdnt-dc87f',
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    'ptdnt-dc87f.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? undefined,
};

/**
 * Kiểm tra xem các biến môi trường Firebase bắt buộc đã được cung cấp trong `.env` hay chưa.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.apiKey.trim().length > 0 &&
      firebaseConfig.projectId &&
      firebaseConfig.projectId.trim().length > 0 &&
      firebaseConfig.appId &&
      firebaseConfig.appId.trim().length > 0
  );
}

export function assertFirebaseConfigured(): void {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Chưa cấu hình đầy đủ thông tin kết nối Firebase (project: ptdnt-dc87f). Vui lòng tạo file .env từ .env.example và điền EXPO_PUBLIC_FIREBASE_API_KEY, EXPO_PUBLIC_FIREBASE_APP_ID.'
    );
  }
}

let primaryAppInstance: FirebaseApp | null = null;
let primaryAuthInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;
let secondaryAppInstance: FirebaseApp | null = null;
let secondaryAuthInstance: Auth | null = null;

/**
 * Lấy hoặc khởi tạo Firebase App chính (Singleton - chống duplicate initialization).
 */
export function getPrimaryFirebaseApp(): FirebaseApp {
  assertFirebaseConfigured();
  if (primaryAppInstance) {
    return primaryAppInstance;
  }

  const existingDefault = getApps().find((app) => app.name === '[DEFAULT]');
  primaryAppInstance = existingDefault
    ? getApp('[DEFAULT]')
    : initializeApp(firebaseConfig);

  return primaryAppInstance;
}

/**
 * Lấy Firebase Authentication instance chính dành cho phiên đăng nhập Admin.
 * - Trên React Native (iOS / Android): Sử dụng AsyncStorage persistence để lưu phiên đăng nhập cục bộ.
 * - Trên Web: Sử dụng cấu hình mặc định (IndexedDB).
 */
export function getPrimaryAuth(): Auth {
  if (primaryAuthInstance) {
    return primaryAuthInstance;
  }
  const app = getPrimaryFirebaseApp();

  if (Platform.OS === 'web') {
    primaryAuthInstance = getAuth(app);
  } else {
    try {
      primaryAuthInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      });
    } catch {
      primaryAuthInstance = getAuth(app);
    }
  }

  return primaryAuthInstance;
}

/**
 * Lấy Firestore instance chính.
 */
export function getFirestoreDb(): Firestore {
  if (firestoreInstance) {
    return firestoreInstance;
  }
  const app = getPrimaryFirebaseApp();
  firestoreInstance = getFirestore(app);
  return firestoreInstance;
}

/**
 * Lấy Secondary Firebase Auth instance (chỉ lưu trong bộ nhớ tạm `inMemoryPersistence`).
 * Dùng riêng khi Admin tạo tài khoản người dùng mới (`createUserWithEmailAndPassword`),
 * đảm bảo phiên đăng nhập hiện tại của Admin trên Primary Auth được giữ nguyên 100%.
 */
export async function getSecondaryAuthForUserCreation(): Promise<Auth> {
  assertFirebaseConfigured();

  if (!secondaryAppInstance) {
    const existingSecondary = getApps().find(
      (app) => app.name === SECONDARY_APP_NAME
    );
    secondaryAppInstance = existingSecondary
      ? getApp(SECONDARY_APP_NAME)
      : initializeApp(firebaseConfig, SECONDARY_APP_NAME);
  }

  if (!secondaryAuthInstance) {
    secondaryAuthInstance = getAuth(secondaryAppInstance);
  }

  await setPersistence(secondaryAuthInstance, inMemoryPersistence);
  return secondaryAuthInstance;
}

