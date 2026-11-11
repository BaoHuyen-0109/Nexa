import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';
import { CustomButton } from './CustomButton';
import { CustomModal } from './CustomModal';

export interface ConfirmDialogProps {
  visible: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title = 'Xác nhận thao tác',
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <CustomModal
      visible={visible}
      title={title}
      onClose={onCancel}
      dismissOnBackdropPress={!loading}
      footer={
        <View style={styles.actions}>
          <CustomButton
            title={cancelLabel}
            variant="outline"
            onPress={onCancel}
            disabled={loading}
            style={styles.button}
          />
          <CustomButton
            title={confirmLabel}
            variant={destructive ? 'danger' : 'primary'}
            onPress={onConfirm}
            loading={loading}
            style={styles.button}
          />
        </View>
      }
    >
      <Text style={styles.message}>{message}</Text>
    </CustomModal>
  );
};

const styles = StyleSheet.create({
  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  button: {
    flex: 1,
  },
});

