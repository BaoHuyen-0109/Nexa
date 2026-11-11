import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { theme } from '../../theme';

export interface IconButtonProps {
  icon: React.ReactNode;
  onPress?: () => void;
  size?: number;
  backgroundColor?: string;
  borderColor?: string;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 40,
  backgroundColor = theme.colors.surfaceVariant,
  borderColor = theme.colors.border,
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: theme.borderRadius.md,
          backgroundColor: isDisabled ? theme.colors.disabled : backgroundColor,
          borderColor: isDisabled ? theme.colors.disabled : borderColor,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.textSecondary} />
      ) : (
        icon
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

