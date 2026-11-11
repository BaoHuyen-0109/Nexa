import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Edit2,
  FileText,
  HardDrive,
  Image as ImageIcon,
  KeyRound,
  Mail,
  RefreshCw,
  Save,
  Shield,
  Trash2,
  Upload,
  User as UserIcon,
  X,
} from '../../icons';
import { ErrorMessage, LoadingIndicator, UserFormModal } from '../../components';
import { UserEntity } from '../../models/UserModel';
import { imageService, userService } from '../../services';
import { RootStackParamList } from '../../types';
import { extractErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

/**
 * MÀN HÌNH CHI TIẾT NGƯỜI DÙNG & CẬP NHẬT ẢNH THIẾT BỊ DI ĐỘNG (NEXA MOBILE DETAIL)
 * - Hiển thị avatar kích thước lớn và toàn bộ thông tin người dùng từ Firestore.
 * - Tích hợp `expo-image-picker` qua `imageService` để chọn ảnh từ thư viện Android.
 * - Kiểm tra MIME type, nén Base64 <= 700 KB, hiển thị ảnh xem trước và cập nhật vào Firestore.
 */
export const DetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { id } = route.params;

  const [user, setUser] = useState<UserEntity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Trạng thái chọn và cập nhật ảnh mới từ thiết bị
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewSizeInfo, setPreviewSizeInfo] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState<boolean>(false);
  const [isSavingImage, setIsSavingImage] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<boolean>(false);
  const [formModalVisible, setFormModalVisible] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Tải thông tin người dùng từ Firestore
  const loadUserDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetched = await userService.getById(id);
      if (!fetched) {
        setError('Không tìm thấy người dùng này trong cơ sở dữ liệu Firestore.');
      } else {
        setUser(fetched);
        setAvatarError(false);
      }
    } catch (err) {
      setError(
        extractErrorMessage(err, 'Lỗi khi tải thông tin người dùng từ Firestore.')
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadUserDetail();
  }, [loadUserDetail]);

  /**
   * Chọn ảnh từ thư viện thiết bị Android qua expo-image-picker (đã đóng gói trong imageService)
   */
  const handlePickImageFromDevice = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsPicking(true);

    try {
      const result = await imageService.pickAndEncodeImage();
      if (!result.cancelled && result.dataUrl) {
        setPreviewDataUrl(result.dataUrl);
        setAvatarError(false);

        if (result.encodedBytes) {
          const kb = Math.round(result.encodedBytes / 1024);
          setPreviewSizeInfo(`Đã nén Base64: ${kb} KB / 700 KB (Hợp lệ)`);
        } else {
          setPreviewSizeInfo('Ảnh đã được xử lý và sẵn sàng lưu.');
        }
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'Không thể chọn ảnh từ thiết bị.');
      setError(msg);
      Alert.alert('Thông báo', msg);
    } finally {
      setIsPicking(false);
    }
  };

  /**
   * Lưu ảnh mới vào Firestore collection /users/{id}
   */
  const handleSaveNewImage = async () => {
    if (!user || !previewDataUrl) return;

    setIsSavingImage(true);
    setError(null);

    try {
      // Cập nhật trường `hinhanh` của người dùng vào Firestore
      const updatedUser = await userService.update(user.id, {
        hinhanh: previewDataUrl,
      });

      setUser(updatedUser);
      setPreviewDataUrl(null);
      setPreviewSizeInfo(null);
      setSuccessMessage('Đã cập nhật ảnh đại diện mới thành công vào Firestore!');
      Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện thành công vào Firestore!');
    } catch (err) {
      const msg = extractErrorMessage(
        err,
        'Lỗi khi cập nhật hình ảnh vào cơ sở dữ liệu.'
      );
      setError(msg);
      Alert.alert('Lỗi cập nhật', msg);
    } finally {
      setIsSavingImage(false);
    }
  };

  /**
   * Hủy ảnh xem trước
   */
  const handleCancelPreview = () => {
    setPreviewDataUrl(null);
    setPreviewSizeInfo(null);
  };

  /**
   * Xóa hồ sơ người dùng khỏi Firestore
   */
  const handleDeleteUser = () => {
    if (!user) return;
    Alert.alert(
      'Xác nhận xóa tài khoản',
      `Bạn có chắc chắn muốn xóa hồ sơ người dùng "${user.hoten}" (${user.email}) khỏi Cloud Firestore? Thao tác này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa ngay',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await userService.delete(user.id);
              Alert.alert('Thành công', `Đã xóa người dùng "${user.hoten}" thành công.`, [
                {
                  text: 'Đồng ý',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (err) {
              const msg = extractErrorMessage(err, 'Không thể xóa hồ sơ người dùng.');
              setError(msg);
              Alert.alert('Lỗi', msg);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  /**
   * Xử lý sau khi chỉnh sửa thông tin thành công qua Modal
   */
  const handleFormSuccess = (updatedUser: UserEntity) => {
    setUser(updatedUser);
    setSuccessMessage(`Đã cập nhật thông tin "${updatedUser.hoten}" thành công.`);
  };

  if (loading && !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingIndicator
          fullScreen
          message="Đang tải hồ sơ người dùng từ Firestore..."
          color="#635BFF"
        />
      </SafeAreaView>
    );
  }

  const activeImage = previewDataUrl || user?.hinhanh || '';
  const isBase64 = activeImage.startsWith('data:image/');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header Điều Hướng */}
      <View style={styles.topBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Hồ sơ người dùng</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => void loadUserDetail()}
          style={styles.reloadBtn}
        >
          <RefreshCw size={18} color="#C4B5FD" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner thông báo */}
        {successMessage ? (
          <View style={styles.successBanner}>
            <CheckCircle2 size={18} color="#16A34A" />
            <Text style={styles.successBannerText}>{successMessage}</Text>
            <TouchableOpacity onPress={() => setSuccessMessage(null)}>
              <X size={16} color="#16A34A" />
            </TouchableOpacity>
          </View>
        ) : null}

        <ErrorMessage message={error} onRetry={() => void loadUserDetail()} />

        {user ? (
          <>
            {/* KHU VỰC AVATAR LỚN VÀ CHỌN ẢNH TỪ THIẾT BỊ */}
            <View style={styles.avatarCard}>
              <View style={styles.avatarContainer}>
                {activeImage && !avatarError ? (
                  <Image
                    source={{ uri: activeImage }}
                    style={styles.largeAvatar}
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <View style={styles.largeAvatarFallback}>
                    <Text style={styles.fallbackLetter}>
                      {user.hoten.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                {/* Nút bấm camera nhanh góc avatar */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => void handlePickImageFromDevice()}
                  disabled={isPicking || isSavingImage}
                  style={styles.cameraIconBtn}
                >
                  {isPicking ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Camera size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>

                {/* Huy hiệu ảnh mới chờ lưu */}
                {previewDataUrl ? (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>Ảnh mới xem trước</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.profileName}>{user.hoten}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>

              {/* Thông tin dung lượng nén */}
              {previewSizeInfo ? (
                <View style={styles.sizeInfoBox}>
                  <HardDrive size={14} color="#10B981" />
                  <Text style={styles.sizeInfoText}>{previewSizeInfo}</Text>
                </View>
              ) : null}

              {/* Nút chọn ảnh từ thiết bị Android */}
              {!previewDataUrl ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => void handlePickImageFromDevice()}
                  disabled={isPicking}
                  style={styles.pickImageBtn}
                >
                  {isPicking ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Upload size={18} color="#FFFFFF" />
                      <Text style={styles.pickImageBtnText}>
                        Chọn ảnh từ thiết bị
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                /* Nhóm nút xác nhận lưu ảnh vào Firestore hoặc hủy */
                <View style={styles.confirmBtnRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleCancelPreview}
                    disabled={isSavingImage}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelBtnText}>Hủy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => void handleSaveNewImage()}
                    disabled={isSavingImage}
                    style={styles.saveImageBtn}
                  >
                    {isSavingImage ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Save size={18} color="#FFFFFF" />
                        <Text style={styles.saveImageBtnText}>
                          Lưu ảnh vào Firestore
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* THẺ THÔNG TIN CHI TIẾT NGƯỜI DÙNG TỪ FIRESTORE */}
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Chi tiết tài khoản Firestore</Text>

              {/* Trường 1: Họ tên */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <UserIcon size={18} color="#635BFF" />
                </View>
                <View style={styles.infoTextBox}>
                  <Text style={styles.infoLabel}>Họ và tên</Text>
                  <Text style={styles.infoValue}>{user.hoten}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Trường 2: Email */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Mail size={18} color="#635BFF" />
                </View>
                <View style={styles.infoTextBox}>
                  <Text style={styles.infoLabel}>Địa chỉ Email</Text>
                  <Text style={styles.infoValue}>{user.email}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Trường 3: Mật khẩu (Luôn bảo mật/null) */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <KeyRound size={18} color="#635BFF" />
                </View>
                <View style={styles.infoTextBox}>
                  <Text style={styles.infoLabel}>Mật khẩu</Text>
                  <View style={styles.passwordPill}>
                    <Text style={styles.passwordDots}>••••••••</Text>
                    <Text style={styles.passwordNotice}>Được bảo mật</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Trường 4: Hình ảnh & Định dạng */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <ImageIcon size={18} color="#635BFF" />
                </View>
                <View style={styles.infoTextBox}>
                  <Text style={styles.infoLabel}>Định dạng lưu trữ hình ảnh</Text>
                  <Text style={styles.infoValue}>
                    {isBase64
                      ? 'Chuỗi Base64 Data URL nén (Lưu trong Firestore)'
                      : 'Đường dẫn liên kết URL trực tiếp'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Mã UID Document Firestore */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <FileText size={18} color="#635BFF" />
                </View>
                <View style={styles.infoTextBox}>
                  <Text style={styles.infoLabel}>UID Document ID</Text>
                  <Text style={styles.uidValue}>{user.id}</Text>
                </View>
              </View>
            </View>

            {/* Thẻ thao tác quản trị viên: SỬA VÀ XÓA ĐỒNG BỘ VỚI WEB */}
            <View style={styles.actionCard}>
              <Text style={styles.actionCardTitle}>Thao tác Quản trị viên</Text>
              <View style={styles.actionBtnsColumn}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setFormModalVisible(true)}
                  style={styles.actionEditBtn}
                >
                  <Edit2 size={18} color="#635BFF" />
                  <Text style={styles.actionEditBtnText}>
                    Chỉnh sửa thông tin người dùng
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleDeleteUser}
                  disabled={isDeleting}
                  style={styles.actionDeleteBtn}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <>
                      <Trash2 size={18} color="#EF4444" />
                      <Text style={styles.actionDeleteBtnText}>
                        Xóa hồ sơ người dùng này
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Thẻ ghi chú tiêu chuẩn kỹ thuật */}
            <View style={styles.securityNoteCard}>
              <Shield size={20} color="#635BFF" />
              <Text style={styles.securityNoteText}>
                Dữ liệu được đồng bộ thời gian thực với Cloud Firestore collection{' '}
                <Text style={styles.boldText}>/users</Text> của dự án Nexa.
              </Text>
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* MODAL CHỈNH SỬA NGƯỜI DÙNG */}
      <UserFormModal
        visible={formModalVisible}
        editingUser={user}
        onClose={() => setFormModalVisible(false)}
        onSuccess={handleFormSuccess}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E164B',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E164B',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reloadBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 18,
    gap: 16,
    backgroundColor: '#F8F7FD',
    minHeight: '100%',
    paddingBottom: 40,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  successBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
    fontWeight: '600',
  },
  avatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAF6',
    shadowColor: '#1E164B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  largeAvatar: {
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 4,
    borderColor: '#EDE9FE',
    backgroundColor: '#F5F3FF',
    resizeMode: 'cover',
  },
  largeAvatarFallback: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: '#EDE9FE',
    borderWidth: 4,
    borderColor: '#C4B5FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackLetter: {
    fontSize: 48,
    fontWeight: '800',
    color: '#635BFF',
  },
  cameraIconBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#635BFF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#635BFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  newBadge: {
    position: 'absolute',
    top: -6,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'center',
  },
  newBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  sizeInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },
  sizeInfoText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  pickImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#635BFF',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 18,
    shadowColor: '#635BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  pickImageBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confirmBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginTop: 18,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  saveImageBtn: {
    flex: 1.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveImageBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ECEAF6',
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextBox: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  uidValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#475569',
  },
  passwordPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passwordDots: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  passwordNotice: {
    fontSize: 11,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECEAF6',
    gap: 12,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  actionBtnsColumn: {
    gap: 10,
  },
  actionEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionEditBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#635BFF',
  },
  actionDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionDeleteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  securityNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  securityNoteText: {
    flex: 1,
    fontSize: 12.5,
    color: '#4338CA',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
  },
});
