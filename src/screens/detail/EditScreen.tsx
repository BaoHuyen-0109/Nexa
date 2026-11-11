import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  CustomCard,
  CustomHeader,
  CustomInput,
  EmptyState,
  ErrorMessage,
  LoadingIndicator,
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

type Props = NativeStackScreenProps<RootStackParamList, 'Edit'>;

interface EditFormValues {
  title: string;
  subtitle: string;
  description: string;
  status: RecordStatus;
}

/**
 * MÀN HÌNH CẬP NHẬT BẢN GHI KHUNG (EDIT SCREEN SKELETON)
 */
export const EditScreen: React.FC<Props> = ({ route, navigation }) => {
  const { id } = route.params;
  const { getById, updateItem, loading } =
    useCrud<GenericRecord>(recordService);

  const [notFound, setNotFound] = useState(false);

  const {
    values,
    errors,
    isSubmitting,
    submitError,
    setFieldValue,
    setValues,
    handleSubmit,
    handleCancel,
  } = useForm<EditFormValues>({
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
    },
    onSubmit: async (formData) => {
      const updated = await updateItem(id, {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim() || undefined,
        description: formData.description.trim() || undefined,
        status: formData.status,
      });

      if (updated) {
        notifier.showSuccess('Đã cập nhật bản ghi thành công.', 'Thành công', () => {
          navigation.goBack();
        });
      }
    },
    onCancel: () => {
      navigation.goBack();
    },
  });

  useEffect(() => {
    let mounted = true;
    const loadExisting = async () => {
      const existing = await getById(id);
      if (!mounted) return;
      if (!existing) {
        setNotFound(true);
        return;
      }
      setValues({
        title: existing.title,
        subtitle: existing.subtitle ?? '',
        description: existing.description ?? '',
        status: existing.status ?? 'active',
      });
    };
    void loadExisting();
    return () => {
      mounted = false;
    };
  }, [getById, id, setValues]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <CustomHeader
        title="Cập nhật bản ghi (Khung)"
        subtitle={`ID: ${String(id)}`}
        showBackButton
        onBackPress={handleCancel}
      />

      {loading && !values.title && !notFound ? (
        <LoadingIndicator fullScreen />
      ) : notFound ? (
        <EmptyState
          title="Không tìm thấy dữ liệu"
          description="Bản ghi cần chỉnh sửa không tồn tại."
          actionLabel="Quay lại"
          onActionPress={() => navigation.goBack()}
        />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <CustomCard>
              <ErrorMessage message={submitError} />

              <CustomInput
                label="Trường tiêu đề (Title)"
                required
                placeholder="Nhập tiêu đề..."
                value={values.title}
                onChangeText={(text) => setFieldValue('title', text)}
                error={errors.title}
              />

              <CustomInput
                label="Trường phụ đề (Subtitle)"
                placeholder="Nhập thông tin phụ..."
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
                  title="Lưu thay đổi"
                  onPress={() => void handleSubmit()}
                  loading={isSubmitting}
                  style={styles.button}
                />
              </View>
            </CustomCard>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
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
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  button: {
    flex: 1,
  },
});

