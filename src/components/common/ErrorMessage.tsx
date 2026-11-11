import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AlertCircle } from '../../icons';
import { theme } from '../../theme';
import { CustomButton } from './CustomButton';

export interface ErrorMessageProps {
  message?: string | null;
  onRetry?: () => void;
  retryLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  retryLabel = 'Thử lại',
  style,
}) => {
  if (!message) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <AlertCircle size={20} color={theme.colors.error} />
        <Text style={styles.text}>{message}</Text>
      </View>
      {onRetry ? (
        <CustomButton
          title={retryLabel}
          variant="outline"
          size="sm"
          onPress={onRetry}
          borderColor={theme.colors.error}
          textColor={theme.colors.error}
          style={styles.retryButton}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.errorLight,
    borderColor: theme.colors.error,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  text: {
    ...theme.typography.bodySmall,
    color: theme.colors.error,
    flex: 1,
  },
  retryButton: {
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
});

