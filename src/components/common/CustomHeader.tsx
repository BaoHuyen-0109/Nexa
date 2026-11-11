import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { ArrowLeft } from '../../icons';
import { theme } from '../../theme';

export interface CustomHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  backgroundColor?: string;
  titleColor?: string;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  rightAction,
  backgroundColor = theme.colors.surface,
  titleColor = theme.colors.textPrimary,
  style,
  titleStyle,
}) => {
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <View style={styles.leftSection}>
        {showBackButton ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBackPress}
            style={styles.backButton}
          >
            <ArrowLeft size={22} color={titleColor} />
          </TouchableOpacity>
        ) : null}
        <View style={styles.titleWrapper}>
          <Text
            numberOfLines={1}
            style={[styles.title, { color: titleColor }, titleStyle]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {rightAction ? <View style={styles.rightSection}>{rightAction}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: theme.spacing.md,
    padding: theme.spacing.xs,
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    ...theme.typography.h3,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  rightSection: {
    marginLeft: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

