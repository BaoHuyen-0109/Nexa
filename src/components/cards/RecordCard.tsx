import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Edit3, Trash2 } from '../../icons';
import { theme } from '../../theme';
import { IconButton } from '../common/IconButton';
import { BadgeStatusType, StatusBadge } from '../common/StatusBadge';
import { CustomCard } from './CustomCard';

export interface RecordCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  badgeLabel?: string;
  badgeStatus?: BadgeStatusType;
  metaText?: string;
  onPress?: () => void;
  onEditPress?: () => void;
  onDeletePress?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Thẻ hiển thị bản ghi tổng quát (RecordCard)
 * Nhận hoàn toàn dữ liệu qua Props, dễ dàng tái sử dụng cho mọi loại bảng dữ liệu.
 */
export const RecordCard: React.FC<RecordCardProps> = ({
  title,
  subtitle,
  description,
  badgeLabel,
  badgeStatus = 'default',
  metaText,
  onPress,
  onEditPress,
  onDeletePress,
  children,
  style,
}) => {
  return (
    <CustomCard onPress={onPress} style={[styles.card, style]}>
      <View style={styles.topRow}>
        <View style={styles.titleSection}>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {badgeLabel ? (
          <StatusBadge label={badgeLabel} status={badgeStatus} />
        ) : null}
      </View>

      {description ? (
        <Text numberOfLines={2} style={styles.description}>
          {description}
        </Text>
      ) : null}

      {children ? <View style={styles.customContent}>{children}</View> : null}

      {metaText || onEditPress || onDeletePress ? (
        <View style={styles.footerRow}>
          <Text numberOfLines={1} style={styles.metaText}>
            {metaText ?? ''}
          </Text>
          <View style={styles.actionRow}>
            {onEditPress ? (
              <IconButton
                size={34}
                onPress={onEditPress}
                accessibilityLabel="Chỉnh sửa"
                icon={<Edit3 size={16} color={theme.colors.textPrimary} />}
              />
            ) : null}
            {onDeletePress ? (
              <IconButton
                size={34}
                onPress={onDeletePress}
                accessibilityLabel="Xóa"
                backgroundColor={theme.colors.errorLight}
                borderColor={theme.colors.errorLight}
                icon={<Trash2 size={16} color={theme.colors.error} />}
              />
            ) : null}
          </View>
        </View>
      ) : null}
    </CustomCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  description: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  customContent: {
    marginTop: theme.spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  metaText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
});

