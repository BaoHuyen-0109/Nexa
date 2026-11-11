import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from '../../icons';
import { theme } from '../../theme';
import { CustomInput, CustomInputProps } from './CustomInput';

export type PasswordInputProps = Omit<
  CustomInputProps,
  'secureTextEntry' | 'rightIcon'
>;

export const PasswordInput: React.FC<PasswordInputProps> = (props) => {
  const [visible, setVisible] = useState(false);

  return (
    <CustomInput
      {...props}
      secureTextEntry={!visible}
      autoCapitalize="none"
      rightIcon={
        <TouchableOpacity
          onPress={() => setVisible((prev) => !prev)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {visible ? (
            <EyeOff size={18} color={theme.colors.textSecondary} />
          ) : (
            <Eye size={18} color={theme.colors.textSecondary} />
          )}
        </TouchableOpacity>
      }
    />
  );
};

