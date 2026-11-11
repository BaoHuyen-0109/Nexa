import React, { useState } from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { theme } from '../../theme';

export interface CustomInputProps extends TextInputProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputWrapperStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  required = false,
  error,
  helperText,
  leftIcon,
  rightIcon,
  disabled = false,
  editable,
  containerStyle,
  inputWrapperStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...restProps
}) => {
  const [focused, setFocused] = useState(false);
  const isEditable = editable !== undefined ? editable : !disabled;

  const getBorderColor = (): string => {
    if (error) return theme.colors.error;
    if (focused) return theme.colors.primary;
    return theme.colors.border;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required ? <Text style={styles.requiredMark}> *</Text> : null}
        </View>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: isEditable
              ? theme.colors.surface
              : theme.colors.disabled,
          },
          inputWrapperStyle,
          {
            borderColor: getBorderColor(),
          },
          focused && !error && styles.inputWrapperFocused,
        ]}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          editable={isEditable}
          placeholderTextColor={theme.colors.textMuted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            !isEditable && { color: theme.colors.disabledText },
            inputStyle,
          ]}
          {...restProps}
        />
        {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
  },
  requiredMark: {
    ...theme.typography.label,
    color: theme.colors.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    minHeight: 46,
  },
  inputWrapperFocused: {
    borderColor: '#635BFF',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 0 0 3px rgba(99, 91, 255, 0.15)',
        } as unknown as ViewStyle)
      : {}),
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.sm,
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          outlineWidth: 0,
        } as unknown as TextStyle)
      : {}),
  },
  leftIcon: {
    marginRight: theme.spacing.sm,
  },
  rightIcon: {
    marginLeft: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  helperText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});

