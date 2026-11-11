import { useAppTheme, AppTheme } from '../theme';

/**
 * Hook truy cập hệ thống Theme động (Dynamic Theme).
 */
export function useTheme(): AppTheme {
  const { theme } = useAppTheme();
  return theme;
}
