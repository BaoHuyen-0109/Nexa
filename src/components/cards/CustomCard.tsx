import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { theme } from '../../theme';

export interface CustomCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  padding?: number;
  style?: StyleProp<ViewStyle>;
}

export const CustomCard: React.FC<CustomCardProps> = ({
  children,
  onPress,
  disabled = false,
  backgroundColor = theme.colors.surface,
  borderColor = theme.colors.border,
  padding = theme.spacing.lg,
  style,
}) => {
  const cardStyles: StyleProp<ViewStyle> = [
    styles.card,
    {
      backgroundColor,
      borderColor,
      padding,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        disabled={disabled}
        style={cardStyles}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
});

