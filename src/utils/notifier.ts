import { Alert } from 'react-native';

/**
 * TIỆN ÍCH THÔNG BÁO NGƯỜI DÙNG (USER NOTIFICATION UTILITY)
 * Hỗ trợ hiển thị thông báo thành công, lỗi và hộp thoại xác nhận nhanh.
 */

export const notifier = {
  showSuccess(message: string, title = 'Thành công', onOk?: () => void): void {
    Alert.alert(title, message, [{ text: 'Đóng', onPress: onOk }]);
  },

  showError(message: string, title = 'Thông báo lỗi'): void {
    Alert.alert(title, message, [{ text: 'Đóng', style: 'cancel' }]);
  },

  showConfirm(options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
  }): void {
    const {
      title = 'Xác nhận thao tác',
      message,
      confirmText = 'Xác nhận',
      cancelText = 'Hủy',
      destructive = false,
      onConfirm,
      onCancel,
    } = options;

    Alert.alert(title, message, [
      {
        text: cancelText,
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: confirmText,
        style: destructive ? 'destructive' : 'default',
        onPress: onConfirm,
      },
    ]);
  },
};

