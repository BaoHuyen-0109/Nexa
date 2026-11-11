import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { theme } from '../../theme';
import { CustomCard } from './CustomCard';

export interface StatCardProps {
  label: string;
  value: string | number;
  caption?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  caption,
  icon,
  onPress,
  style,
}) => {
  return (
    <CustomCard onPress={onPress} style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <Text numberOfLines={1} style={styles.label}>
          {label}
        </Text>
        {icon ? <View style={styles.iconBox}>{icon}</View> : null}
      </View>
      <Text style={styles.value}>{String(value)}</Text>
      {caption ? (
        <Text numberOfLines={1} style={styles.caption}>
          {caption}
        </Text>
      ) : null}
    </CustomCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 130,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  iconBox: {
    marginLeft: theme.spacing.xs,
  },
  value: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
  },
  caption: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xxs,
  },
});

