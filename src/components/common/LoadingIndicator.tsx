import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { theme } from '../../theme';

export interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Đang tải dữ liệu...',
  size = 'large',
  color = theme.colors.primary,
  fullScreen = false,
  style,
}) => {
  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        style,
      ]}
    >
      <ActivityIndicator size={size} color={color} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  message: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
});

