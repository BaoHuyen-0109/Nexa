import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  CustomCard,
  CustomHeader,
  CustomInput,
  ErrorMessage,
  PrimaryButton,
  SecondaryButton,
  TextArea,
} from '../../components';
import { useCrud, useForm } from '../../hooks';
import { GenericRecord, RecordStatus } from '../../models';
import { recordService } from '../../services';
import { theme } from '../../theme';
import { RootStackParamList } from '../../types';
import { notifier } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'Create'>;

interface GenericFormValues {
  title: string;
  subtitle: string;
  description: string;
  status: RecordStatus;
}

/**
 * MÀN HÌNH TẠO MỚI KHUNG (CREATE SCREEN SKELETON)
 *
 * KHI NHẬN ĐỀ THI:
 * Thay thế các trường trong `GenericFormValues` và `CustomInput` bên dưới
 * bằng các cột thực tế của bảng Database đề thi.
 */
export const CreateScreen: React.FC<Props> = ({ navigation }) => {
  const { createItem } = useCrud<GenericRecord>(recordService);

  const {
    values,
    errors,
    isSubmitting,
    submitError,
    setFieldValue,
    handleSubmit,
    handleCancel,
  } = useForm<GenericFormValues>({
    initialValues: {
      title: '',
      subtitle: '',
      description: '',
      status: 'active',
    },
    validationSchema: {
      title: {
        required: true,
        requiredMessage: 'Vui lòng nhập tiêu đề bản ghi.',
        minLength: {
          value: 3,
          message: 'Tiêu đề cần có ít nhất 3 ký tự.',
        },
      },
      subtitle: {
        maxLength: {
          value: 100,
          message: 'Phụ đề không vượt quá 100 ký tự.',
        },
      },
    },
    onSubmit: async (formData) => {
      const created = await createItem({
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim() || undefined,
        description: formData.description.trim() || undefined,
        status: formData.status,
      });

      if (created) {
        notifier.showSuccess('Đã thêm bản ghi mới thành công.', 'Thành công', () => {
          navigation.goBack();
        });
      }
    },
    onCancel: () => {
      navigation.goBack();
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <CustomHeader
        title="Tạo bản ghi mới (Khung)"
        subtitle="Kiểm tra Form & Validation dùng chung"
        showBackButton
        onBackPress={handleCancel}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <CustomCard>
            <Text style={styles.hintText}>
              Đây là Form khung trung tính. Khi nhận đề thi, chỉ cần cập nhật
              các trường dữ liệu theo bảng Database yêu cầu.
            </Text>

            <ErrorMessage message={submitError} />

            <CustomInput
              label="Trường tiêu đề (Title)"
              required
              placeholder="Nhập tiêu đề bản ghi..."
              value={values.title}
              onChangeText={(text) => setFieldValue('title', text)}
              error={errors.title}
            />

            <CustomInput
              label="Trường phụ đề (Subtitle)"
              placeholder="Nhập thông tin phụ (tùy chọn)..."
              value={values.subtitle}
              onChangeText={(text) => setFieldValue('subtitle', text)}
              error={errors.subtitle}
            />

            <TextArea
              label="Trường mô tả (Description)"
              placeholder="Nhập nội dung mô tả..."
              value={values.description}
              onChangeText={(text) => setFieldValue('description', text)}
              error={errors.description}
            />

            <View style={styles.buttonRow}>
              <SecondaryButton
                title="Hủy"
                onPress={handleCancel}
                disabled={isSubmitting}
                style={styles.button}
              />
              <PrimaryButton
                title="Lưu bản ghi"
                onPress={() => void handleSubmit()}
                loading={isSubmitting}
                style={styles.button}
              />
            </View>
          </CustomCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  hintText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  button: {
    flex: 1,
  },
});

