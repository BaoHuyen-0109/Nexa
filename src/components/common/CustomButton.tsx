import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { theme } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface CustomButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  backgroundColor,
  textColor,
  borderColor,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  const getVariantStyles = (): {
    bg: string;
    txt: string;
    border?: string;
  } => {
    if (isDisabled) {
      return {
        bg: theme.colors.disabled,
        txt: theme.colors.disabledText,
        border: theme.colors.disabled,
      };
    }

    switch (variant) {
      case 'secondary':
        return {
          bg: backgroundColor ?? theme.colors.secondary,
          txt: textColor ?? theme.colors.onSecondary,
        };
      case 'outline':
        return {
          bg: backgroundColor ?? 'transparent',
          txt: textColor ?? theme.colors.primary,
          border: borderColor ?? theme.colors.border,
        };
      case 'danger':
        return {
          bg: backgroundColor ?? theme.colors.error,
          txt: textColor ?? theme.colors.onPrimary,
        };
      case 'ghost':
        return {
          bg: backgroundColor ?? 'transparent',
          txt: textColor ?? theme.colors.textPrimary,
        };
      case 'primary':
      default:
        return {
          bg: backgroundColor ?? theme.colors.primary,
          txt: textColor ?? theme.colors.onPrimary,
        };
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.borderRadius.sm,
        };
      case 'lg':
        return {
          paddingVertical: theme.spacing.lg,
          paddingHorizontal: theme.spacing.xl,
          borderRadius: theme.borderRadius.md,
        };
      case 'md':
      default:
        return {
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.borderRadius.md,
        };
    }
  };

  const variantColors = getVariantStyles();
  const sizeStyle = getSizeStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        sizeStyle,
        {
          backgroundColor: variantColors.bg,
          borderColor: variantColors.border ?? variantColors.bg,
          borderWidth: variant === 'outline' || Boolean(borderColor) ? 1 : 0,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantColors.txt} />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
          <Text
            style={[
              styles.text,
              size === 'sm' && { fontSize: theme.fontSizes.sm },
              size === 'lg' && { fontSize: theme.fontSizes.lg },
              { color: variantColors.txt },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...theme.typography.button,
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: theme.spacing.sm,
  },
  rightIcon: {
    marginLeft: theme.spacing.sm,
  },
});

