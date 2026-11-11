import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Search, X } from '../../icons';
import { theme } from '../../theme';
import { CustomInput } from './CustomInput';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Tìm kiếm bản ghi...',
  onClear,
  containerStyle,
}) => {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <CustomInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      containerStyle={[styles.container, containerStyle]}
      leftIcon={<Search size={18} color={theme.colors.textSecondary} />}
      rightIcon={
        value.length > 0 ? (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ) : undefined
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
});

