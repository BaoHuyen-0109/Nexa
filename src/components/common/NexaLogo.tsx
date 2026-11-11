import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export interface NexaLogoProps {
  /** Kích thước của biểu tượng vuông (mặc định 42) */
  size?: number;
  /** Có hiển thị chữ NEXA và Tagline hay không (mặc định true) */
  showText?: boolean;
  /** Chế độ nền: 'dark' khi đặt trên Sidebar tím đậm, 'light' khi trên nền trắng */
  theme?: 'dark' | 'light';
  /** Tùy chỉnh style của container */
  style?: ViewStyle;
}

/**
 * BIỂU TƯỢNG VÀ THƯƠNG HIỆU NEXA
 * - Logo chữ N cách điệu hiện đại phong cách công nghệ / SaaS.
 * - Sử dụng các dải màu tím hoàng gia (Royal Indigo), tím tím hoa cà (Lavender) và hiệu ứng ánh sáng.
 * - Đi kèm tên thương hiệu NEXA và tagline SMART USER PLATFORM.
 */
export const NexaLogo: React.FC<NexaLogoProps> = ({
  size = 42,
  showText = true,
  theme = 'dark',
  style,
}) => {
  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, style]}>
      {/* Icon Chữ N Cách Điệu */}
      <View
        style={[
          styles.iconWrapper,
          {
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.28),
          },
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
          <Defs>
            {/* Nền badge icon */}
            <LinearGradient id="nexaBgGrad" x1="0" y1="0" x2="44" y2="44">
              <Stop offset="0%" stopColor="#4338CA" stopOpacity={isDark ? 0.85 : 0.95} />
              <Stop offset="100%" stopColor="#7C3AED" stopOpacity={isDark ? 0.95 : 1} />
            </LinearGradient>

            {/* Gradient cho nét chéo chữ N */}
            <LinearGradient id="nexaDiagonalGrad" x1="14" y1="12" x2="30" y2="32">
              <Stop offset="0%" stopColor="#DDD6FE" />
              <Stop offset="50%" stopColor="#A78BFA" />
              <Stop offset="100%" stopColor="#818CF8" />
            </LinearGradient>

            {/* Gradient cho cột phải */}
            <LinearGradient id="nexaRightGrad" x1="26" y1="12" x2="33" y2="32">
              <Stop offset="0%" stopColor="#F5F3FF" />
              <Stop offset="100%" stopColor="#C4B5FD" />
            </LinearGradient>
          </Defs>

          {/* Khối nền bo tròn với viền ánh sáng */}
          <Rect
            x="1"
            y="1"
            width="42"
            height="42"
            rx={Math.round(size * 0.26)}
            fill="url(#nexaBgGrad)"
            stroke={isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(99, 91, 255, 0.25)'}
            strokeWidth="1.5"
          />

          {/* Chữ N cách điệu: 3 phân đoạn dứt khoát */}
          {/* 1. Trụ đứng bên trái */}
          <Path
            d="M12 32V12C12 11.4477 12.4477 11 13 11H16.5C17.0523 11 17.5 11.4477 17.5 12V32C17.5 32.5523 17.0523 33 16.5 33H13C12.4477 33 12 32.5523 12 32Z"
            fill="#FFFFFF"
          />

          {/* 2. Nét chéo năng động (Dynamic Diagonal) */}
          <Path
            d="M15.5 11.5L28.5 31.8C28.8 32.3 29.5 32.4 29.9 32L31.5 30.2C31.8 29.8 31.7 29.2 31.3 28.7L18.3 11.2C17.9 10.7 17.2 10.7 16.8 11.1L15.5 12.3C15.2 12.6 15.2 13.1 15.5 11.5Z"
            fill="url(#nexaDiagonalGrad)"
          />

          {/* 3. Trụ đứng bên phải */}
          <Path
            d="M26.5 32V12C26.5 11.4477 26.9477 11 27.5 11H31C31.5523 11 32 11.4477 32 12V32C32 32.5523 31.5523 33 31 33H27.5C26.9477 33 26.5 32.5523 26.5 32Z"
            fill="url(#nexaRightGrad)"
          />

          {/* Điểm nhấn hạt ngọc kết nối (Smart Node) */}
          <Rect x="28.5" y="11" width="3.5" height="3.5" rx="1.75" fill="#FFFFFF" />
        </Svg>
      </View>

      {/* Tên thương hiệu & Tagline */}
      {showText ? (
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.brandName,
              { color: isDark ? '#FFFFFF' : '#1E164B' },
            ]}
          >
            NEXA
          </Text>
          <Text
            style={[
              styles.tagline,
              { color: isDark ? '#C4B5FD' : '#635BFF' },
            ]}
          >
            SMART USER PLATFORM
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#635BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  textContainer: {
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 1.5,
    lineHeight: 24,
  },
  tagline: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 2,
    textTransform: 'uppercase',
  },
});

