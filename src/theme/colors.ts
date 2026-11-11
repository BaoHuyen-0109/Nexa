/**
 * BẢNG MÀU TRUNG TÍNH MẶC ĐỊNH (NEUTRAL PALETTE)
 *
 * HƯỚNG DẪN KHI NHẬN ĐỀ THI:
 * Chỉ cần thay đổi giá trị `primary`, `primaryLight`, `secondary` tại đây
 * để đổi toàn bộ tông màu ứng dụng theo chủ đề đề thi mà không cần sửa từng Component.
 */

export interface ColorPalette {
  primary: string;
  primaryLight: string;
  onPrimary: string;
  secondary: string;
  secondaryLight: string;
  onSecondary: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  divider: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  overlay: string;
  disabled: string;
  disabledText: string;
}

export const colors: ColorPalette = {
  // Màu chủ đạo trung tính (Neutral Charcoal / Slate) - Thay đổi tại đây khi có chủ đề thi
  primary: '#27272A',
  primaryLight: '#F4F4F5',
  onPrimary: '#FFFFFF',

  // Màu phụ trung tính (Neutral Gray)
  secondary: '#52525B',
  secondaryLight: '#E4E4E7',
  onSecondary: '#FFFFFF',

  // Màu nền và bề mặt
  background: '#F4F4F5',
  surface: '#FFFFFF',
  surfaceVariant: '#FAFAFA',

  // Màu chữ
  textPrimary: '#18181B',
  textSecondary: '#71717A',
  textMuted: '#A1A1AA',

  // Màu viền và đường kẻ
  border: '#E4E4E7',
  divider: '#F4F4F5',

  // Màu trạng thái ngữ nghĩa (Semantic Status Colors)
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',

  // Màu bổ trợ
  overlay: 'rgba(24, 24, 27, 0.5)',
  disabled: '#E4E4E7',
  disabledText: '#A1A1AA',
};

