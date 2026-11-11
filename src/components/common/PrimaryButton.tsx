import React from 'react';
import { CustomButton, CustomButtonProps } from './CustomButton';

export type PrimaryButtonProps = Omit<CustomButtonProps, 'variant'>;

export const PrimaryButton: React.FC<PrimaryButtonProps> = (props) => {
  return <CustomButton {...props} variant="primary" />;
};

