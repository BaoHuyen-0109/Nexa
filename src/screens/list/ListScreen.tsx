import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  CheckCircle2,
  ChevronRight,
  Edit2,
  Filter,
  ImageIcon,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from '../../icons';
import {
  CustomInput,
  EmptyState,
  ErrorMessage,
  LoadingIndicator,
  NexaLogo,
  UserFormModal,
} from '../../components';
import { UserEntity } from '../../models/UserModel';
import { userService } from '../../services';
import { MainTabParamList, RootStackParamList } from '../../types';
import { extractErrorMessage } from '../../utils/errorHandler';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList>,
  NativeStackScreenProps<RootStackParamList>
>;

type ImageFilterType = 'all' | 'base64' | 'url';

/**
 * MÀN HÌNH QUẢN LÝ NGƯỜI DÙNG MOBILE (NEXA MOBILE USER MANAGEMENT)
 * - Đầy đủ 100% chức năng CRUD (Thêm, Sửa, Xóa, Chi tiết) đồng nhất với Web Dashboard.
 * - Nhận diện thương hiệu Nexa: tím đậm #1E164B, tím thương hiệu #635BFF, trắng và tím lavender.
 * - Tương tác Firestore collection `/users` đồng bộ thời gian thực.
 * - Hỗ trợ chọn/nén ảnh từ thiết bị iOS / Android qua `expo-image-picker`.
 */
export const ListScreen: React.FC<Props> = ({ navigation }) => {
  const [users, setUsers] = useState<UserEntity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'info';
    message: string;
  } | null>(null);

  // Tìm kiếm, Bộ lọc và Form Modal
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [imageFilter, setImageFilter] = useState<ImageFilterType>('all');
  const [brokenAvatarIds, setBrokenAvatarIds] = useState<Record<string, boolean>>({});
  const [formModalVisible, setFormModalVisible] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserEntity | null>(null);

  const fetchUsers = useCallback(async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      setError(
        extractErrorMessage(err, 'Không thể tải danh sách người dùng từ Firestore.')
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Lắng nghe thời gian thực trực tiếp từ Firestore (/users)
    // Khi thêm người dùng trên điện thoại hoặc Web, dữ liệu tự động cập nhật ngay lập tức
    const unsubscribe = userService.subscribeRealtime(
      (realtimeUsers) => {
        setUsers(realtimeUsers);
        setLoading(false);
        setRefreshing(false);
        setError(null);
      },
      (err) => {
        setError(
          extractErrorMessage(
            err,
            'Không thể đồng bộ dữ liệu người dùng từ Firestore.'
          )
        );
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Thống kê nhanh số lượng
  const stats = useMemo(() => {
    const total = users.length;
    const base64Count = users.filter((u) =>
      u.hinhanh.startsWith('data:image/')
    ).length;
    const urlCount = users.filter((u) => /^https?:\/\//i.test(u.hinhanh)).length;
    return { total, base64Count, urlCount };
  }, [users]);

  // Lọc dữ liệu theo từ khóa tìm kiếm và bộ lọc loại ảnh
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      const matchesKeyword =
        !q ||
        u.hoten.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);

      if (!matchesKeyword) return false;

      if (imageFilter === 'base64') {
        return u.hinhanh.startsWith('data:image/');
      }
      if (imageFilter === 'url') {
        return /^https?:\/\//i.test(u.hinhanh);
      }
      return true;
    });
  }, [users, searchQuery, imageFilter]);

  // Mở modal thêm người dùng mới
  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormModalVisible(true);
  };

  // Mở modal chỉnh sửa người dùng
  const handleOpenEdit = (user: UserEntity) => {
    setEditingUser(user);
    setFormModalVisible(true);
  };

  // Xử lý sau khi lưu thành công từ Modal
  const handleFormSuccess = (savedUser: UserEntity, mode: 'create' | 'edit') => {
    setFeedbackBanner({
      type: 'success',
      message:
        mode === 'create'
          ? `Đã thêm người dùng "${savedUser.hoten}" thành công.`
          : `Đã cập nhật thông tin "${savedUser.hoten}" thành công.`,
    });
    void fetchUsers(true);
  };

  // Xóa người dùng kèm hộp thoại xác nhận an toàn
  const handleDeleteUser = (user: UserEntity) => {
    Alert.alert(
      'Xác nhận xóa người dùng',
      `Bạn có chắc chắn muốn xóa "${user.hoten}" (${user.email}) khỏi Cloud Firestore?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa ngay',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.delete(user.id);
              setFeedbackBanner({
                type: 'info',
                message: `Đã xóa người dùng "${user.hoten}" thành công.`,
              });
              await fetchUsers(true);
            } catch (err) {
              Alert.alert(
                'Lỗi xóa',
                extractErrorMessage(err, 'Không thể xóa hồ sơ người dùng.')
              );
            }
          },
        },
      ]
    );
  };

  const renderUserItem = ({ item }: { item: UserEntity }) => {
    const isBroken = Boolean(brokenAvatarIds[item.id]);
    const hasImage = Boolean(item.hinhanh) && !isBroken;
    const isBase64 = item.hinhanh.startsWith('data:image/');

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Detail', { id: item.id })}
        style={styles.userCard}
      >
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {hasImage ? (
            <Image
              source={{ uri: item.hinhanh }}
              style={styles.avatarImage}
              onError={() =>
                setBrokenAvatarIds((prev) => ({ ...prev, [item.id]: true }))
              }
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>
                {item.hoten.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Badge loại ảnh nhỏ */}
          {hasImage ? (
            <View
              style={[
                styles.imageTypeDot,
                { backgroundColor: isBase64 ? '#10B981' : '#3B82F6' },
              ]}
            />
          ) : null}
        </View>

        {/* Thông tin chính */}
        <View style={styles.userInfo}>
          <Text numberOfLines={1} style={styles.userName}>
            {item.hoten}
          </Text>
          <Text numberOfLines={1} style={styles.userEmail}>
            {item.email}
          </Text>
          <View style={styles.userMetaRow}>
            <View
              style={[
                styles.metaBadge,
                isBase64 ? styles.metaBadgeBase64 : styles.metaBadgeUrl,
              ]}
            >
              <Text
                style={[
                  styles.metaBadgeText,
                  isBase64 ? styles.metaBadgeTextBase64 : styles.metaBadgeTextUrl,
                ]}
              >
                {isBase64 ? 'Ảnh Base64' : 'Ảnh URL'}
              </Text>
            </View>
          </View>
        </View>

        {/* Cụm nút Thao tác: SỬA, XÓA, CHI TIẾT */}
        <View style={styles.cardActionsGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleOpenEdit(item)}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            style={styles.actionBtnEdit}
          >
            <Edit2 size={16} color="#635BFF" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleDeleteUser(item)}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            style={styles.actionBtnDelete}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>

          <View style={styles.actionArrow}>
            <ChevronRight size={18} color="#94A3B8" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER MOBILE NEXA ĐẬM CHẤT SAAS */}
      <View style={styles.header}>
        {/* Hàng 1: Logo Nexa + Nút Thêm mới + Nút Làm mới */}
        <View style={styles.headerBrandRow}>
          <NexaLogo size={36} showText theme="dark" />
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleOpenCreate}
              style={styles.headerAddBtn}
            >
              <UserPlus size={16} color="#FFFFFF" />
              <Text style={styles.headerAddBtnText}>Thêm mới</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => void fetchUsers(true)}
              style={styles.headerRefreshBtn}
            >
              <RefreshCw size={17} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hàng 2: Thống kê nhanh 3 thẻ mini */}
        <View style={styles.statsRow}>
          <View style={styles.statMiniCard}>
            <Text style={styles.statMiniNumber}>{stats.total}</Text>
            <Text style={styles.statMiniLabel}>Người dùng</Text>
          </View>

          <View style={styles.statMiniCard}>
            <Text style={[styles.statMiniNumber, { color: '#34D399' }]}>
              {stats.base64Count}
            </Text>
            <Text style={styles.statMiniLabel}>Ảnh Base64</Text>
          </View>

          <View style={styles.statMiniCard}>
            <Text style={[styles.statMiniNumber, { color: '#60A5FA' }]}>
              {stats.urlCount}
            </Text>
            <Text style={styles.statMiniLabel}>Ảnh URL</Text>
          </View>
        </View>
      </View>

      {/* THANH TÌM KIẾM VÀ BỘ LỌC */}
      <View style={styles.searchFilterContainer}>
        {/* Banner phản hồi thành công */}
        {feedbackBanner ? (
          <View style={styles.feedbackBanner}>
            <CheckCircle2 size={16} color="#16A34A" />
            <Text style={styles.feedbackBannerText}>{feedbackBanner.message}</Text>
            <TouchableOpacity onPress={() => setFeedbackBanner(null)}>
              <X size={15} color="#16A34A" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Ô tìm kiếm */}
        <CustomInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Tìm theo tên hoặc email..."
          leftIcon={<Search size={18} color="#635BFF" />}
          rightIcon={
            searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            ) : undefined
          }
          containerStyle={styles.searchInputContainer}
          inputWrapperStyle={styles.searchInputWrapper}
        />

        {/* Thanh chip bộ lọc loại ảnh */}
        <View style={styles.filterChipRow}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setImageFilter('all')}
            style={[
              styles.filterChip,
              imageFilter === 'all' && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                imageFilter === 'all' && styles.filterChipTextActive,
              ]}
            >
              Tất cả ({users.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setImageFilter('base64')}
            style={[
              styles.filterChip,
              imageFilter === 'base64' && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                imageFilter === 'base64' && styles.filterChipTextActive,
              ]}
            >
              Base64 ({stats.base64Count})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setImageFilter('url')}
            style={[
              styles.filterChip,
              imageFilter === 'url' && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                imageFilter === 'url' && styles.filterChipTextActive,
              ]}
            >
              URL ({stats.urlCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Thông báo lỗi nếu có */}
      <ErrorMessage message={error} onRetry={() => void fetchUsers()} />

      {/* DANH SÁCH NGƯỜI DÙNG */}
      {loading && !refreshing && users.length === 0 ? (
        <View style={styles.inlineLoadingContainer}>
          <ActivityIndicator size="large" color="#635BFF" />
          <Text style={styles.inlineLoadingText}>
            Đang đồng bộ dữ liệu người dùng Nexa...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={[
            styles.listContent,
            filteredUsers.length === 0 && styles.listEmptyContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void fetchUsers(true)}
              colors={['#635BFF']}
              tintColor="#635BFF"
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="Chưa có người dùng phù hợp"
              description={
                searchQuery || imageFilter !== 'all'
                  ? 'Không tìm thấy người dùng nào khớp với bộ lọc hoặc từ khóa tìm kiếm.'
                  : 'Chưa có dữ liệu người dùng trong cơ sở dữ liệu Firestore.'
              }
              actionLabel="Thêm người dùng mới"
              onActionPress={handleOpenCreate}
            />
          }
        />
      )}

      {/* NÚT NỔI THÊM NGƯỜI DÙNG (FAB) TIỆN DỤNG TRÊN MOBILE */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleOpenCreate}
        style={styles.fabButton}
      >
        <Plus size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* MODAL THÊM / SỬA NGƯỜI DÙNG ĐỒNG BỘ VỚI WEB */}
      <UserFormModal
        visible={formModalVisible}
        editingUser={editingUser}
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
  /* HEADER */
  header: {
    backgroundColor: '#1E164B',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#635BFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#635BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  headerAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRefreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  statMiniCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  statMiniNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statMiniLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#C4B5FD',
    marginTop: 2,
  },

  /* SEARCH & FILTER */
  searchFilterContainer: {
    backgroundColor: '#F8F7FD',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 6,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  feedbackBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#15803D',
    marginRight: 8,
  },
  searchInputContainer: {
    marginBottom: 10,
  },
  searchInputWrapper: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 48,
    shadowColor: '#1E164B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  filterChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#635BFF',
    borderColor: '#635BFF',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* INLINE LOADING */
  inlineLoadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  inlineLoadingText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#635BFF',
  },
  /* LIST CONTENT */
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 90,
    gap: 12,
    backgroundColor: '#F8F7FD',
    minHeight: '100%',
  },
  listEmptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  /* USER CARD */
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECEAF6',
    shadowColor: '#1E164B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarWrapper: {
    position: 'relative',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#EDE9FE',
    overflow: 'hidden',
    backgroundColor: '#F5F3FF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarFallback: {
    flex: 1,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#635BFF',
  },
  imageTypeDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 5,
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  metaBadgeBase64: {
    backgroundColor: '#ECFDF5',
  },
  metaBadgeUrl: {
    backgroundColor: '#EFF6FF',
  },
  metaBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  metaBadgeTextBase64: {
    color: '#059669',
  },
  metaBadgeTextUrl: {
    color: '#2563EB',
  },

  /* CARD ACTIONS */
  cardActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnEdit: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDelete: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8F7FD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* FAB BUTTON */
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#635BFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#635BFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
});
