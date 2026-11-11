import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../../theme';

export interface CustomDividerProps {
  color?: string;
  thickness?: number;
  verticalSpacing?: number;
  style?: StyleProp<ViewStyle>;
}

export const CustomDivider: React.FC<CustomDividerProps> = ({
  color = theme.colors.border,
  thickness = 1,
  verticalSpacing = theme.spacing.md,
  style,
}) => {
  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: color,
          height: thickness,
          marginVertical: verticalSpacing,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    width: '100%',
  },
});

