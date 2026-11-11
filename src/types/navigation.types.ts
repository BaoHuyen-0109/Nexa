import { EntityId } from './crud.types';

/**
 * ĐỊNH NGHĨA ROUTE CHO HỆ THỐNG NAVIGATION
 *
 * KHI NHẬN ĐỀ THI:
 * - Có thể thêm/xóa các màn hình hoặc bổ sung tham số truyền giữa các màn hình tại đây.
 */

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ListTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  Detail: { id: EntityId };
  Create: undefined;
  Edit: { id: EntityId };
};

