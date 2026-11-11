import React from 'react';
import { StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { CustomInput, CustomInputProps } from './CustomInput';

export interface TextAreaProps extends CustomInputProps {
  minHeight?: number;
}

export const TextArea: React.FC<TextAreaProps> = ({
  minHeight = 100,
  numberOfLines = 4,
  inputWrapperStyle,
  inputStyle,
  ...restProps
}) => {
  return (
    <CustomInput
      {...restProps}
      multiline
      numberOfLines={numberOfLines}
      textAlignVertical="top"
      inputWrapperStyle={[
        styles.wrapper,
        { minHeight },
        inputWrapperStyle,
      ]}
      inputStyle={[styles.input, inputStyle]}
    />
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.xs,
  },
  input: {
    minHeight: 84,
  },
});

