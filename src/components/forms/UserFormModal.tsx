import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertCircle,
  CloudUpload,
  Eye,
  EyeOff,
  Link2,
  Save,
  UserCheck,
  UserPlus,
  X,
} from '../../icons';
import { UserEntity } from '../../models/UserModel';
import { imageService, userService } from '../../services';
import { extractErrorMessage } from '../../utils/errorHandler';
import { commonPatterns } from '../../utils/validators';

export interface UserFormModalProps {
  visible: boolean;
  editingUser: UserEntity | null;
  onClose: () => void;
  onSuccess: (savedUser: UserEntity, mode: 'create' | 'edit') => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  visible,
  editingUser,
  onClose,
  onSuccess,
}) => {
  const isEditMode = Boolean(editingUser);

  const [hoten, setHoten] = useState('');
  const [email, setEmail] = useState('');
  const [matkhau, setMatkhau] = useState('');
  const [hinhanh, setHinhanh] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    hoten?: string;
    email?: string;
    matkhau?: string;
    hinhanh?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [imageSizeInfo, setImageSizeInfo] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingUser) {
        setHoten(editingUser.hoten);
        setEmail(editingUser.email);
        setMatkhau('');
        setHinhanh(editingUser.hinhanh);
        setShowUrlInput(editingUser.hinhanh.startsWith('http'));
      } else {
        setHoten('');
        setEmail('');
        setMatkhau('');
        setHinhanh('');
        setShowUrlInput(false);
      }
      setFieldErrors({});
      setSubmitError(null);
      setImageSizeInfo(null);
      setPreviewError(false);
      setShowPassword(false);
    }
  }, [visible, editingUser]);

  const handlePickImage = async () => {
    setSubmitError(null);
    setFieldErrors((prev) => ({ ...prev, hinhanh: undefined }));
    setIsPickingImage(true);
    try {
      const result = await imageService.pickAndEncodeImage();
      if (!result.cancelled && result.dataUrl) {
        setHinhanh(result.dataUrl);
        setPreviewError(false);
        if (result.encodedBytes) {
          setImageSizeInfo(
            `Đã nén Base64: ${Math.round(result.encodedBytes / 1024)} KB / 700 KB`
          );
        }
      }
    } catch (err) {
      setFieldErrors((prev) => ({
        ...prev,
        hinhanh: extractErrorMessage(err, 'Không thể chọn ảnh.'),
      }));
    } finally {
      setIsPickingImage(false);
    }
  };

  const validateFields = (): boolean => {
    const nextErrors: {
      hoten?: string;
      email?: string;
      matkhau?: string;
      hinhanh?: string;
    } = {};

    if (!hoten.trim() || hoten.trim().length < 2) {
      nextErrors.hoten = 'Vui lòng nhập họ tên (tối thiểu 2 ký tự).';
    }

    if (!isEditMode) {
      if (!email.trim()) {
        nextErrors.email = 'Vui lòng nhập địa chỉ email.';
      } else if (!commonPatterns.email.test(email.trim())) {
        nextErrors.email = 'Định dạng email không hợp lệ.';
      }

      if (!matkhau || matkhau.length < 6) {
        nextErrors.matkhau = 'Mật khẩu khởi tạo phải có ít nhất 6 ký tự.';
      }
    }

    const imgCheck = imageService.validateImageSource(hinhanh);
    if (!imgCheck.isValid) {
      nextErrors.hinhanh = imgCheck.error ?? 'Hình ảnh không hợp lệ.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    setSubmitError(null);
    if (!validateFields()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && editingUser) {
        const updated = await userService.update(editingUser.id, {
          hoten: hoten.trim(),
          hinhanh: hinhanh.trim(),
        });
        onSuccess(updated, 'edit');
      } else {
        const created = await userService.create({
          email: email.trim().toLowerCase(),
          matkhau,
          hoten: hoten.trim(),
          hinhanh: hinhanh.trim(),
        });
        onSuccess(created, 'create');
      }
      onClose();
    } catch (err) {
      setSubmitError(
        extractErrorMessage(err, 'Không thể lưu thông tin người dùng.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hỗ trợ kéo thả file ảnh trực tiếp trên trình duyệt Web
  interface WebDropEvent {
    preventDefault: () => void;
    dataTransfer?: {
      files?: ArrayLike<File>;
    };
  }

  const webDropProps =
    Platform.OS === 'web'
      ? ({
          onDragOver: (e: WebDropEvent) => {
            e.preventDefault();
          },
          onDrop: async (e: WebDropEvent) => {
            e.preventDefault();
            const file = e.dataTransfer?.files?.[0];
            if (!file || !imageService.encodeWebFile) return;
            setIsPickingImage(true);
            setFieldErrors((prev) => ({ ...prev, hinhanh: undefined }));
            try {
              const res = await imageService.encodeWebFile(file);
              if (!res.cancelled && res.dataUrl) {
                setHinhanh(res.dataUrl);
                setPreviewError(false);
                if (res.encodedBytes) {
                  setImageSizeInfo(
                    `Đã nén Base64: ${Math.round(res.encodedBytes / 1024)} KB / 700 KB`
                  );
                }
              }
            } catch (err) {
              setFieldErrors((prev) => ({
                ...prev,
                hinhanh: extractErrorMessage(err, 'Không thể xử lý ảnh kéo thả.'),
              }));
            } finally {
              setIsPickingImage(false);
            }
          },
        } as Record<string, unknown>)
      : {};

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isSubmitting ? undefined : onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          onPress={isSubmitting ? undefined : onClose}
        />

        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconBadge}>
                {isEditMode ? (
                  <UserCheck size={20} color="#635BFF" />
                ) : (
                  <UserPlus size={20} color="#635BFF" />
                )}
              </View>
              <Text style={styles.headerTitle}>
                {isEditMode ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={isSubmitting}
              style={styles.closeBtn}
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            {submitError ? (
              <View style={styles.errorBanner}>
                <AlertCircle size={18} color="#DC2626" />
                <Text style={styles.errorBannerText}>{submitError}</Text>
              </View>
            ) : null}

            {/* Row 1: Họ tên */}
            <View style={styles.formRow}>
              <View style={styles.labelColumn}>
                <Text style={styles.label}>
                  Họ tên <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <View style={styles.inputColumn}>
                <TextInput
                  value={hoten}
                  onChangeText={(text) => {
                    setHoten(text);
                    if (fieldErrors.hoten) {
                      setFieldErrors((prev) => ({ ...prev, hoten: undefined }));
                    }
                  }}
                  placeholder="Nguyễn Thị Bích"
                  placeholderTextColor="#94A3B8"
                  editable={!isSubmitting}
                  style={[
                    styles.textInput,
                    fieldErrors.hoten ? styles.inputError : null,
                  ]}
                />
                {fieldErrors.hoten ? (
                  <Text style={styles.fieldErrorText}>{fieldErrors.hoten}</Text>
                ) : null}
              </View>
            </View>

            {/* Row 2: Email */}
            <View style={styles.formRow}>
              <View style={styles.labelColumn}>
                <Text style={styles.label}>
                  Email <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <View style={styles.inputColumn}>
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  placeholder="bichnguyen@example.com"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoComplete="off"
                  keyboardType="email-address"
                  editable={!isEditMode && !isSubmitting}
                  style={[
                    styles.textInput,
                    isEditMode ? styles.readonlyInput : null,
                    fieldErrors.email ? styles.inputError : null,
                  ]}
                />
                {isEditMode ? (
                  <Text style={styles.helperNote}>
                    Email định danh không thể thay đổi.
                  </Text>
                ) : fieldErrors.email ? (
                  <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>
                ) : null}
              </View>
            </View>

            {/* Row 3: Mật khẩu */}
            <View style={styles.formRow}>
              <View style={styles.labelColumn}>
                <Text style={styles.label}>
                  Mật khẩu <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <View style={styles.inputColumn}>
                {isEditMode ? (
                  <View style={[styles.textInput, styles.readonlyInput, styles.passwordWrapper]}>
                    <Text style={styles.protectedPasswordText}>
                      ••••••••
                    </Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.passwordWrapper,
                      styles.textInput,
                      fieldErrors.matkhau ? styles.inputError : null,
                    ]}
                  >
                    <TextInput
                      value={matkhau}
                      onChangeText={(text) => {
                        setMatkhau(text);
                        if (fieldErrors.matkhau) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            matkhau: undefined,
                          }));
                        }
                      }}
                      placeholder="••••••••"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="new-password"
                      editable={!isSubmitting}
                      style={styles.passwordInnerInput}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword((prev) => !prev)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {showPassword ? (
                        <EyeOff size={18} color="#64748B" />
                      ) : (
                        <Eye size={18} color="#64748B" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
                {fieldErrors.matkhau ? (
                  <Text style={styles.fieldErrorText}>
                    {fieldErrors.matkhau}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Row 4: Hình ảnh */}
            <View style={[styles.formRow, styles.formRowTopAlign]}>
              <View style={styles.labelColumn}>
                <Text style={styles.label}>
                  Hình ảnh <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <View style={styles.inputColumn}>
                <View
                  {...webDropProps}
                  style={[
                    styles.uploadDropzone,
                    fieldErrors.hinhanh ? styles.inputError : null,
                  ]}
                >
                  {/* Thumbnail Preview */}
                  <View style={styles.previewBox}>
                    {hinhanh && !previewError ? (
                      <Image
                        source={{ uri: hinhanh }}
                        style={styles.previewImage}
                        onError={() => setPreviewError(true)}
                      />
                    ) : (
                      <View style={styles.previewPlaceholder}>
                        <Text style={styles.previewPlaceholderText}>
                          {previewError ? 'Ảnh lỗi' : 'Chưa có ảnh'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Upload Trigger */}
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => void handlePickImage()}
                    disabled={isPickingImage || isSubmitting}
                    style={styles.uploadActionArea}
                  >
                    {isPickingImage ? (
                      <ActivityIndicator size="small" color="#635BFF" />
                    ) : (
                      <View style={styles.uploadIconCircle}>
                        <CloudUpload size={22} color="#635BFF" />
                      </View>
                    )}
                    <Text style={styles.uploadMainText}>Chọn ảnh</Text>
                    <Text style={styles.uploadSubText}>
                      hoặc kéo thả ảnh vào đây
                    </Text>
                    <Text style={styles.uploadHintText}>
                      JPG, PNG, WEBP (tự động nén &lt;= 700KB)
                    </Text>
                  </TouchableOpacity>
                </View>

                {imageSizeInfo ? (
                  <Text style={styles.sizeInfoText}>{imageSizeInfo}</Text>
                ) : null}

                {/* Nút bật/tắt nhập URL ảnh trực tiếp */}
                <TouchableOpacity
                  onPress={() => setShowUrlInput((prev) => !prev)}
                  style={styles.toggleUrlBtn}
                >
                  <Link2 size={14} color="#635BFF" />
                  <Text style={styles.toggleUrlText}>
                    {showUrlInput
                      ? 'Ẩn ô nhập URL ảnh trực tiếp'
                      : 'Hoặc dán đường dẫn URL ảnh trực tiếp (http/https)'}
                  </Text>
                </TouchableOpacity>

                {showUrlInput ? (
                  <View>
                    <TextInput
                      value={hinhanh.startsWith('data:') ? '' : hinhanh}
                      onChangeText={(url) => {
                        setHinhanh(url);
                        setPreviewError(false);
                        setImageSizeInfo(null);
                        if (fieldErrors.hinhanh) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            hinhanh: undefined,
                          }));
                        }
                      }}
                      placeholder="Dán link ảnh trực tiếp (VD: https://.../avatar.jpg)"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      autoComplete="off"
                      editable={!isSubmitting}
                      style={[styles.textInput, styles.urlInput]}
                    />
                    <Text style={styles.urlHintText}>
                      * Mẹo: Nhấp chuột phải vào ảnh trên mạng rồi chọn "Sao chép địa chỉ hình ảnh" (link kết thúc bằng .jpg, .png hoặc link ảnh trực tiếp, không dùng link bài báo).
                    </Text>
                  </View>
                ) : null}

                {fieldErrors.hinhanh ? (
                  <Text style={styles.fieldErrorText}>
                    {fieldErrors.hinhanh}
                  </Text>
                ) : null}
              </View>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={onClose}
              disabled={isSubmitting}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => void handleSave()}
              disabled={isSubmitting}
              style={[
                styles.saveButton,
                isSubmitting && styles.saveButtonDisabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Save size={16} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Lưu người dùng</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E164B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  formRowTopAlign: {
    alignItems: 'flex-start',
  },
  labelColumn: {
    width: 95,
    paddingTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  required: {
    color: '#EF4444',
  },
  inputColumn: {
    flex: 1,
  },
  textInput: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          outlineWidth: 0,
        } as unknown as Record<string, unknown>)
      : {}),
  },
  readonlyInput: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF5F5',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordInnerInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    paddingVertical: 0,
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          outlineWidth: 0,
        } as unknown as Record<string, unknown>)
      : {}),
  },
  protectedPasswordText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  helperNote: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  uploadDropzone: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C4B5FD',
    borderRadius: 12,
    backgroundColor: '#FAF8FF',
    padding: 12,
    gap: 14,
  },
  previewBox: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  previewPlaceholderText: {
    fontSize: 11,
    color: '#6D28D9',
    textAlign: 'center',
  },
  uploadActionArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  uploadIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  uploadMainText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4338CA',
  },
  uploadSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  uploadHintText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  sizeInfoText: {
    fontSize: 11,
    color: '#16A34A',
    marginTop: 4,
    fontWeight: '500',
  },
  toggleUrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  toggleUrlText: {
    fontSize: 12,
    color: '#635BFF',
    fontWeight: '500',
  },
  urlInput: {
    marginTop: 6,
  },
  urlHintText: {
    fontSize: 11,
    color: '#6366F1',
    marginTop: 4,
    lineHeight: 15,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  cancelButton: {
    minWidth: 100,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  saveButton: {
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 10,
    backgroundColor: '#635BFF',
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
