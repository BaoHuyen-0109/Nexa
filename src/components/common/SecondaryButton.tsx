import React from 'react';
import { CustomButton, CustomButtonProps } from './CustomButton';

export type SecondaryButtonProps = Omit<CustomButtonProps, 'variant'> & {
  outlined?: boolean;
};

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  outlined = true,
  ...props
}) => {
  return (
    <CustomButton
      {...props}
      variant={outlined ? 'outline' : 'secondary'}
    />
  );
};

