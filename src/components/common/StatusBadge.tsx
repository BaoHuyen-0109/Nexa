import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { theme } from '../../theme';

export type BadgeStatusType = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface StatusBadgeProps {
  label: string;
  status?: BadgeStatusType;
  backgroundColor?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  status = 'default',
  backgroundColor,
  textColor,
  style,
  textStyle,
}) => {
  const getPalette = (): { bg: string; txt: string } => {
    switch (status) {
      case 'success':
        return {
          bg: backgroundColor ?? theme.colors.successLight,
          txt: textColor ?? theme.colors.success,
        };
      case 'warning':
        return {
          bg: backgroundColor ?? theme.colors.warningLight,
          txt: textColor ?? theme.colors.warning,
        };
      case 'error':
        return {
          bg: backgroundColor ?? theme.colors.errorLight,
          txt: textColor ?? theme.colors.error,
        };
      case 'info':
        return {
          bg: backgroundColor ?? theme.colors.secondaryLight,
          txt: textColor ?? theme.colors.secondary,
        };
      case 'default':
      default:
        return {
          bg: backgroundColor ?? theme.colors.primaryLight,
          txt: textColor ?? theme.colors.textPrimary,
        };
    }
  };

  const palette = getPalette();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: palette.bg },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: palette.txt },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  text: {
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.semibold,
  },
});

