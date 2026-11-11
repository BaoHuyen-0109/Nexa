import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit2,
  Eye,
  Filter,
  Home,
  Image as ImageIcon,
  Key,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Trash2,
  User as UserIcon,
  Users,
  X,
} from '../../icons';
import {
  ConfirmDialog,
  CustomModal,
  EmptyState,
  ErrorMessage,
  NexaLogo,
  UserFormModal,
} from '../../components';
import { isFirebaseConfigured } from '../../config/firebase';
import { UserEntity } from '../../models/UserModel';
import { authService, databaseExportService, userService } from '../../services';
import { extractErrorMessage } from '../../utils/errorHandler';

const PAGE_SIZE = 5;

type ImageFilterType = 'all' | 'base64' | 'url';
type ActiveSidebarSection = 'overview' | 'users';

export const HomeScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isCompactLayout = width < 900;

  const [activeSection, setActiveSection] =
    useState<ActiveSidebarSection>('users');
  const [adminEmail, setAdminEmail] = useState<string>('Admin');

  // Dữ liệu tổng để tính toán 4 thẻ thống kê thực tế và lọc nhanh không cần tải lại nhiều lần
  const [allUsers, setAllUsers] = useState<UserEntity[]>([]);
  // Đếm tổng số từ server metadata để hiển thị số lượng và phân trang tức thì
  const [serverTotalCount, setServerTotalCount] = useState<number>(0);
  // Dữ liệu trang hiện tại được lấy qua Firestore limit() + startAfter() khi không bật bộ lọc
  const [cursorPageItems, setCursorPageItems] = useState<UserEntity[]>([]);
  const [pageCursors, setPageCursors] = useState<
    Record<number, QueryDocumentSnapshot<DocumentData> | null>
  >({ 1: null });

  const [loading, setLoading] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'info';
    message: string;
  } | null>(null);

  // Tìm kiếm, Lọc và Phân trang
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [imageFilter, setImageFilter] = useState<ImageFilterType>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Trạng thái Modal Thêm/Sửa, Xem ảnh lớn và Xác nhận xóa
  const [formModalVisible, setFormModalVisible] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserEntity | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserEntity | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [viewingUser, setViewingUser] = useState<UserEntity | null>(null);
  const [previewUserImage, setPreviewUserImage] = useState<UserEntity | null>(
    null
  );
  const [brokenAvatarIds, setBrokenAvatarIds] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const unsubscribe = authService.subscribeAdminAuth((profile) => {
      if (profile) {
        setAdminEmail(profile.email || profile.displayName || 'Admin');
      }
    });
    return unsubscribe;
  }, []);

  // ĐĂNG KÝ ĐỒNG BỘ THỜI GIAN THỰC TỪ CLOUD FIRESTORE (/users)
  // Khi người dùng được thêm, sửa hoặc xóa trên điện thoại, Firestore tự động cập nhật ngay trên Web
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setError(
        'Chưa cấu hình đầy đủ biến môi trường Firebase trong file .env (project: ptdnt-dc87f).'
      );
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = userService.subscribeRealtime(
      (realtimeUsers) => {
        setAllUsers(realtimeUsers);
        setServerTotalCount(realtimeUsers.length);
        setCursorPageItems(realtimeUsers.slice(0, PAGE_SIZE));
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(
          extractErrorMessage(
            err,
            'Không thể đồng bộ dữ liệu thời gian thực từ Firestore.'
          )
        );
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Làm mới danh sách thủ công khi bấm nút refresh trên Topbar
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getAll();
      setAllUsers(data);
      setServerTotalCount(data.length);
      setCursorPageItems(data.slice(0, PAGE_SIZE));
      setError(null);
    } catch (err) {
      setError(
        extractErrorMessage(err, 'Không thể làm mới danh sách từ Firestore.')
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Kiểm tra có đang áp dụng tìm kiếm hoặc bộ lọc phía client hay không
  const isFilteringOrSearching =
    searchQuery.trim().length > 0 || imageFilter !== 'all';

  // Danh sách đã lọc theo từ khóa tìm kiếm và loại ảnh
  const filteredUsers = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return allUsers.filter((user) => {
      const matchesKeyword =
        !keyword ||
        user.hoten.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword);

      if (!matchesKeyword) return false;

      if (imageFilter === 'base64') {
        return user.hinhanh.startsWith('data:image/');
      }
      if (imageFilter === 'url') {
        return /^https?:\/\//i.test(user.hinhanh);
      }
      return true;
    });
  }, [allUsers, searchQuery, imageFilter]);

  // Đồng bộ thống kê thực tế từ dữ liệu (4 Stat Cards)
  const stats = useMemo(() => {
    const total =
      allUsers.length > 0
        ? allUsers.length
        : serverTotalCount || cursorPageItems.length;
    const base64Count =
      allUsers.length > 0
        ? allUsers.filter((u) => u.hinhanh.startsWith('data:image/')).length
        : cursorPageItems.filter((u) => u.hinhanh.startsWith('data:image/')).length;
    const urlCount =
      allUsers.length > 0
        ? allUsers.filter((u) => /^https?:\/\//i.test(u.hinhanh)).length
        : cursorPageItems.filter((u) => /^https?:\/\//i.test(u.hinhanh)).length;
    const filteredCount = isFilteringOrSearching ? filteredUsers.length : total;

    return {
      total,
      base64Count,
      urlCount,
      filteredCount,
    };
  }, [
    allUsers,
    cursorPageItems,
    filteredUsers.length,
    isFilteringOrSearching,
    serverTotalCount,
  ]);

  // Khi thay đổi từ khóa tìm kiếm hoặc bộ lọc, đưa về trang 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, imageFilter]);

  const totalItemsCount = isFilteringOrSearching
    ? filteredUsers.length
    : allUsers.length > 0
      ? allUsers.length
      : serverTotalCount;

  const totalPages = Math.max(1, Math.ceil(totalItemsCount / PAGE_SIZE));

  /**
   * Chuyển trang:
   * - Khi không lọc/tìm kiếm và có sẵn con trỏ Firestore (`startAfter`), ưu tiên gọi
   *   `userService.getPaginatedPage(PAGE_SIZE, cursor)` để phân trang chuẩn Firestore.
   * - Nếu nhảy tới trang bất kỳ hoặc đang tìm kiếm/lọc, cắt trang từ bộ đệm đã đồng bộ.
   */
  const handleSelectPage = useCallback(
    async (targetPage: number) => {
      if (targetPage < 1 || targetPage > totalPages || targetPage === currentPage) {
        return;
      }

      setCurrentPage(targetPage);

      if (!isFilteringOrSearching && targetPage in pageCursors) {
        setPageLoading(true);
        try {
          const cursor = pageCursors[targetPage];
          const pageRes = await userService.getPaginatedPage(PAGE_SIZE, cursor);
          setCursorPageItems(pageRes.items);
          if (pageRes.lastCursor) {
            setPageCursors((prev) => ({
              ...prev,
              [targetPage + 1]: pageRes.lastCursor,
            }));
          }
          return;
        } catch {
          // Fallback cắt từ bộ đệm nếu mất kết nối tạm thời
        } finally {
          setPageLoading(false);
        }
      }

      const startIdx = (targetPage - 1) * PAGE_SIZE;
      setCursorPageItems(allUsers.slice(startIdx, startIdx + PAGE_SIZE));
    },
    [allUsers, currentPage, isFilteringOrSearching, pageCursors, totalPages]
  );

  // Dữ liệu 5 dòng hiển thị trên bảng ở trang hiện tại (tự động đồng bộ thời gian thực từ Firestore)
  const displayedUsers = useMemo(() => {
    if (isFilteringOrSearching) {
      const startIndex = (currentPage - 1) * PAGE_SIZE;
      return filteredUsers.slice(startIndex, startIndex + PAGE_SIZE);
    }
    if (allUsers.length > 0) {
      const startIndex = (currentPage - 1) * PAGE_SIZE;
      return allUsers.slice(startIndex, startIndex + PAGE_SIZE);
    }
    return cursorPageItems;
  }, [
    allUsers,
    currentPage,
    cursorPageItems,
    filteredUsers,
    isFilteringOrSearching,
  ]);

  const startRecordNumber =
    totalItemsCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endRecordNumber = Math.min(
    currentPage * PAGE_SIZE,
    totalItemsCount
  );

  // Tạo danh sách các nút số trang (ví dụ: 1, 2, 3 ... N)
  const paginationNumbers = useMemo(() => {
    const pages: Array<number | 'ellipsis'> = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(1);
    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }
    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormModalVisible(true);
  };

  const handleOpenEditModal = (user: UserEntity) => {
    setEditingUser(user);
    setFormModalVisible(true);
  };

  const handleFormSuccess = (savedUser: UserEntity, mode: 'create' | 'edit') => {
    setFeedbackBanner({
      type: 'success',
      message:
        mode === 'create'
          ? `Đã thêm người dùng "${savedUser.hoten}" thành công.`
          : `Đã cập nhật thông tin người dùng "${savedUser.hoten}" thành công.`,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    setError(null);
    try {
      const targetName = deletingUser.hoten;
      await userService.delete(deletingUser.id);
      setDeletingUser(null);
      setFeedbackBanner({
        type: 'info',
        message: `Đã xóa người dùng "${targetName}" thành công.`,
      });
    } catch (err) {
      setError(extractErrorMessage(err, 'Không thể xóa hồ sơ người dùng.'));
      setDeletingUser(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportJson = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const result = await databaseExportService.exportAndDownloadJson('PTDNT_Database.json');
      setFeedbackBanner({
        type: 'success',
        message:
          result.totalExported === 0
            ? 'Đã tải xuống file PTDNT_Database.json (Hiện chưa có người dùng nào trong cơ sở dữ liệu).'
            : `Đã xuất thành công toàn bộ ${result.totalExported} người dùng vào file PTDNT_Database.json.`,
      });
    } catch (err) {
      setError(
        extractErrorMessage(
          err,
          'Lỗi khi xuất dữ liệu JSON từ Firestore. Vui lòng kiểm tra quyền Admin hoặc kết nối mạng.'
        )
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleLogout = async () => {
    await authService.logoutAdmin();
  };

  const getFilterLabel = (filter: ImageFilterType): string => {
    switch (filter) {
      case 'base64':
        return 'Ảnh tải lên (Base64)';
      case 'url':
        return 'Ảnh liên kết (URL)';
      case 'all':
      default:
        return 'Tất cả';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View
        style={[
          styles.dashboardRoot,
          isCompactLayout && styles.dashboardRootCompact,
        ]}
      >
        {/* ================= SIDEBAR TÍM ĐẬM ================= */}
        <View
          style={[
            styles.sidebar,
            isCompactLayout && styles.sidebarCompact,
          ]}
        >
          <View>
            {/* Logo NEXA */}
            <View style={styles.brandRow}>
              <NexaLogo size={42} showText theme="dark" />
            </View>

            <View style={styles.sidebarDivider} />

            {/* Menu điều hướng */}
            <View
              style={[
                styles.navMenu,
                isCompactLayout && styles.navMenuCompact,
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveSection('overview')}
                style={[
                  styles.navItem,
                  activeSection === 'overview' && styles.navItemActive,
                ]}
              >
                <Home
                  size={18}
                  color={activeSection === 'overview' ? '#FFFFFF' : '#CBD5E1'}
                />
                <Text
                  style={[
                    styles.navItemText,
                    activeSection === 'overview' && styles.navItemTextActive,
                  ]}
                >
                  Tổng quan
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveSection('users')}
                style={[
                  styles.navItem,
                  activeSection === 'users' && styles.navItemActive,
                ]}
              >
                <Users
                  size={18}
                  color={activeSection === 'users' ? '#FFFFFF' : '#CBD5E1'}
                />
                <Text
                  style={[
                    styles.navItemText,
                    activeSection === 'users' && styles.navItemTextActive,
                  ]}
                >
                  Quản lý người dùng
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => void handleLogout()}
                style={styles.navItem}
              >
                <LogOut size={18} color="#FDA4AF" />
                <Text style={[styles.navItemText, { color: '#FECDD3' }]}>
                  Đăng xuất
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Mascot Card trên Desktop */}
          {!isCompactLayout ? (
            <View style={styles.sidebarPromoCard}>
              <View style={styles.mascotCircle}>
                <Sparkles size={28} color="#A78BFA" />
              </View>
              <Text style={styles.sidebarPromoTitle}>Quản lý dễ dàng</Text>
              <Text style={styles.sidebarPromoSub}>Hiệu quả hơn!</Text>
            </View>
          ) : null}
        </View>

        {/* ================= MAIN CONTENT AREA ================= */}
        <View style={styles.mainArea}>
          {/* Top Header */}
          <View style={styles.topHeader}>
            <View style={styles.breadcrumbRow}>
              <Home size={16} color="#635BFF" />
              <Text style={styles.breadcrumbMuted}>Tổng quan</Text>
              <Text style={styles.breadcrumbSeparator}>&gt;</Text>
              <Text style={styles.breadcrumbActive}>
                {activeSection === 'overview'
                  ? 'Bảng điều khiển'
                  : 'Quản lý người dùng'}
              </Text>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={() => void handleRefresh()}
                style={styles.iconActionBtn}
                accessibilityLabel="Làm mới dữ liệu"
              >
                <RefreshCw size={18} color="#475569" />
              </TouchableOpacity>

              <View style={styles.bellWrapper}>
                <Bell size={19} color="#475569" />
                <View style={styles.bellDot} />
              </View>

              <View style={styles.adminProfilePill}>
                <View style={styles.adminAvatarCircle}>
                  <Text style={styles.adminAvatarInitial}>
                    {adminEmail.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text numberOfLines={1} style={styles.adminNameText}>
                  {adminEmail}
                </Text>
                <ChevronDown size={14} color="#64748B" />
              </View>
            </View>
          </View>

          {/* Main Scrollable Content */}
          <ScrollView
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
          >
            {/* Page Title + Add User Button */}
            <View style={styles.titleBannerRow}>
              <View style={styles.titleLeftGroup}>
                <View style={styles.bigUsersIconBox}>
                  <Users size={28} color="#635BFF" />
                </View>
                <View>
                  <Text style={styles.pageMainTitle}>Quản lý người dùng</Text>
                  <Text style={styles.pageSubTitle}>
                    Quản lý và theo dõi thông tin người dùng trong hệ thống
                  </Text>
                </View>
              </View>

              <View style={styles.headerButtonGroup}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => void handleExportJson()}
                  disabled={isExporting}
                  style={styles.exportButton}
                >
                  {isExporting ? (
                    <ActivityIndicator size="small" color="#4F46E5" />
                  ) : (
                    <Download size={17} color="#4F46E5" />
                  )}
                  <Text style={styles.exportButtonText}>
                    {isExporting ? 'Đang xuất JSON...' : 'Xuất dữ liệu JSON'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleOpenCreateModal}
                  style={styles.addUserButton}
                >
                  <Plus size={18} color="#FFFFFF" />
                  <Text style={styles.addUserButtonText}>Thêm người dùng</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Feedback Banner */}
            {feedbackBanner ? (
              <View
                style={[
                  styles.feedbackBox,
                  feedbackBanner.type === 'info' && styles.feedbackBoxInfo,
                ]}
              >
                <Text
                  style={[
                    styles.feedbackText,
                    feedbackBanner.type === 'info' && styles.feedbackTextInfo,
                  ]}
                >
                  {feedbackBanner.message}
                </Text>
                <TouchableOpacity onPress={() => setFeedbackBanner(null)}>
                  <X size={16} color="#475569" />
                </TouchableOpacity>
              </View>
            ) : null}

            <ErrorMessage
              message={error}
              onRetry={() => void handleRefresh()}
            />

            {/* ================= 4 THẺ THỐNG KÊ DỮ LIỆU THỰC TẾ ================= */}
            <View style={styles.statsGrid}>
              {/* Card 1: Tổng người dùng */}
              <View style={styles.statCardItem}>
                <View
                  style={[
                    styles.statIconCircle,
                    { backgroundColor: '#EDE9FE' },
                  ]}
                >
                  <Users size={22} color="#635BFF" />
                </View>
                <View style={styles.statTextGroup}>
                  <Text style={styles.statNumber}>{stats.total}</Text>
                  <Text style={styles.statLabel}>Tổng người dùng</Text>
                </View>
              </View>

              {/* Card 2: Ảnh tải lên Base64 */}
              <View style={styles.statCardItem}>
                <View
                  style={[
                    styles.statIconCircle,
                    { backgroundColor: '#DCFCE7' },
                  ]}
                >
                  <CheckCircle2 size={22} color="#10B981" />
                </View>
                <View style={styles.statTextGroup}>
                  <Text style={styles.statNumber}>{stats.base64Count}</Text>
                  <Text style={styles.statLabel}>Ảnh tải lên (Base64)</Text>
                </View>
              </View>

              {/* Card 3: Ảnh liên kết URL */}
              <View style={styles.statCardItem}>
                <View
                  style={[
                    styles.statIconCircle,
                    { backgroundColor: '#FFEDD5' },
                  ]}
                >
                  <ImageIcon size={22} color="#F97316" />
                </View>
                <View style={styles.statTextGroup}>
                  <Text style={styles.statNumber}>{stats.urlCount}</Text>
                  <Text style={styles.statLabel}>Ảnh liên kết (URL)</Text>
                </View>
              </View>

              {/* Card 4: Kết quả đang hiển thị */}
              <View style={styles.statCardItem}>
                <View
                  style={[
                    styles.statIconCircle,
                    { backgroundColor: '#DBEAFE' },
                  ]}
                >
                  <Calendar size={22} color="#3B82F6" />
                </View>
                <View style={styles.statTextGroup}>
                  <Text style={styles.statNumber}>
                    {stats.filteredCount}/{stats.total}
                  </Text>
                  <Text style={styles.statLabel}>Kết quả lọc hiện tại</Text>
                </View>
              </View>
            </View>

            {/* ================= THANH TÌM KIẾM & BỘ LỌC ================= */}
            <View style={styles.searchFilterRow}>
              <View style={styles.searchBox}>
                <Search size={18} color="#94A3B8" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Tìm kiếm theo email hoặc họ tên..."
                  placeholderTextColor="#94A3B8"
                  style={styles.searchInput}
                />
                {searchQuery.length > 0 ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={16} color="#94A3B8" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Bộ lọc loại ảnh */}
              <View style={styles.filterWrapper}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowFilterDropdown((prev) => !prev)}
                  style={styles.filterButton}
                >
                  <Filter size={16} color="#475569" />
                  <Text style={styles.filterButtonText}>
                    {getFilterLabel(imageFilter)}
                  </Text>
                  <ChevronDown size={16} color="#64748B" />
                </TouchableOpacity>

                {showFilterDropdown ? (
                  <View style={styles.filterDropdownMenu}>
                    {(['all', 'base64', 'url'] as ImageFilterType[]).map(
                      (option) => (
                        <TouchableOpacity
                          key={option}
                          onPress={() => {
                            setImageFilter(option);
                            setShowFilterDropdown(false);
                          }}
                          style={[
                            styles.filterDropdownItem,
                            imageFilter === option &&
                              styles.filterDropdownItemActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.filterDropdownItemText,
                              imageFilter === option &&
                                styles.filterDropdownItemTextActive,
                            ]}
                          >
                            {getFilterLabel(option)}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                ) : null}
              </View>
            </View>

            {/* ================= BẢNG DỮ LIỆU NGƯỜI DÙNG ================= */}
            <View style={styles.tableCard}>
              {/* Header Bảng */}
              <View style={styles.tableHeaderRow}>
                <View style={styles.colAvatar}>
                  <Text style={styles.tableHeaderText}>Ảnh đại diện</Text>
                </View>
                <View style={styles.colName}>
                  <Text style={styles.tableHeaderText}>Họ tên</Text>
                </View>
                <View style={styles.colEmail}>
                  <Text style={styles.tableHeaderText}>Email</Text>
                </View>
                <View style={styles.colPassword}>
                  <Text style={styles.tableHeaderText}>Mật khẩu</Text>
                </View>
                <View style={styles.colActions}>
                  <Text style={[styles.tableHeaderText, { textAlign: 'center' }]}>
                    Thao tác
                  </Text>
                </View>
              </View>

              {/* Nội dung Bảng */}
              {loading || pageLoading ? (
                <View style={styles.tableLoadingBox}>
                  <ActivityIndicator size="large" color="#635BFF" />
                  <Text style={styles.tableLoadingText}>
                    Đang tải dữ liệu người dùng từ Firestore...
                  </Text>
                </View>
              ) : displayedUsers.length === 0 ? (
                <EmptyState
                  title="Chưa có người dùng phù hợp"
                  description={
                    isFilteringOrSearching
                      ? 'Không tìm thấy bản ghi nào khớp với từ khóa hoặc bộ lọc hiện tại.'
                      : 'Danh sách người dùng trong Firestore hiện đang trống.'
                  }
                  actionLabel="Thêm người dùng mới"
                  onActionPress={handleOpenCreateModal}
                />
              ) : (
                displayedUsers.map((user, idx) => {
                  const isBroken = Boolean(brokenAvatarIds[user.id]);
                  return (
                    <View
                      key={user.id}
                      style={[
                        styles.tableDataRow,
                        idx === displayedUsers.length - 1 && {
                          borderBottomWidth: 0,
                        },
                      ]}
                    >
                      {/* Cột 1: Ảnh đại diện */}
                      <View style={styles.colAvatar}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setViewingUser(user)}
                          style={styles.avatarContainer}
                        >
                          {user.hinhanh && !isBroken ? (
                            <Image
                              source={{ uri: user.hinhanh }}
                              style={styles.avatarImg}
                              onError={() =>
                                setBrokenAvatarIds((prev) => ({
                                   ...prev,
                                   [user.id]: true,
                                 }))
                              }
                            />
                          ) : (
                            <View style={styles.avatarFallback}>
                              <Text style={styles.avatarFallbackText}>
                                {user.hoten.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* Cột 2: Họ tên (Click để xem chi tiết) */}
                      <View style={styles.colName}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => setViewingUser(user)}
                          style={styles.clickableNameWrapper}
                        >
                          <Text numberOfLines={1} style={styles.cellNameText}>
                            {user.hoten}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Cột 3: Email (Click để xem chi tiết) */}
                      <View style={styles.colEmail}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => setViewingUser(user)}
                          style={styles.clickableNameWrapper}
                        >
                          <Text numberOfLines={1} style={styles.cellEmailText}>
                            {user.email}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Cột 4: Mật khẩu (Được bảo mật) */}
                      <View style={styles.colPassword}>
                        <View style={styles.passwordMaskBadge}>
                          <Shield size={13} color="#635BFF" />
                          <Text style={styles.cellPasswordDots}>••••••••</Text>
                          <Text style={styles.cellPasswordLabel}>
                            Được bảo mật
                          </Text>
                        </View>
                      </View>

                      {/* Cột 5: Thao tác (Xem chi tiết, Sửa, Xóa) */}
                      <View style={styles.colActions}>
                        <View style={styles.actionBtnGroup}>
                          <TouchableOpacity
                            activeOpacity={0.75}
                            onPress={() => setViewingUser(user)}
                            style={styles.viewDetailIconBtn}
                            accessibilityLabel="Xem chi tiết người dùng"
                          >
                            <Eye size={15} color="#2563EB" />
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.75}
                            onPress={() => handleOpenEditModal(user)}
                            style={styles.editIconBtn}
                            accessibilityLabel="Chỉnh sửa người dùng"
                          >
                            <Edit2 size={15} color="#635BFF" />
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.75}
                            onPress={() => setDeletingUser(user)}
                            style={styles.deleteIconBtn}
                            accessibilityLabel="Xóa người dùng"
                          >
                            <Trash2 size={15} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}

              {/* Footer Phân trang */}
              <View style={styles.paginationFooter}>
                <Text style={styles.paginationInfoText}>
                  Hiển thị {startRecordNumber} – {endRecordNumber} trong{' '}
                  {totalItemsCount} người dùng
                </Text>

                <View style={styles.paginationControls}>
                  <TouchableOpacity
                    disabled={currentPage <= 1}
                    onPress={() => void handleSelectPage(currentPage - 1)}
                    style={[
                      styles.pageBtn,
                      currentPage <= 1 && styles.pageBtnDisabled,
                    ]}
                  >
                    <ChevronLeft size={16} color="#475569" />
                  </TouchableOpacity>

                  {paginationNumbers.map((item, idx) =>
                    item === 'ellipsis' ? (
                      <View key={`ellipsis_${idx}`} style={styles.ellipsisBox}>
                        <Text style={styles.ellipsisText}>...</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        key={item}
                        onPress={() => void handleSelectPage(item)}
                        style={[
                          styles.pageBtn,
                          currentPage === item && styles.pageBtnActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pageBtnText,
                            currentPage === item && styles.pageBtnTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}

                  <TouchableOpacity
                    disabled={currentPage >= totalPages}
                    onPress={() => void handleSelectPage(currentPage + 1)}
                    style={[
                      styles.pageBtn,
                      currentPage >= totalPages && styles.pageBtnDisabled,
                    ]}
                  >
                    <ChevronRight size={16} color="#475569" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Modal Thêm / Chỉnh sửa người dùng */}
      <UserFormModal
        visible={formModalVisible}
        editingUser={editingUser}
        onClose={() => setFormModalVisible(false)}
        onSuccess={handleFormSuccess}
      />

      {/* Modal Xem chi tiết người dùng trên Web */}
      <CustomModal
        visible={viewingUser !== null}
        title="Thông tin chi tiết người dùng"
        onClose={() => setViewingUser(null)}
        contentStyle={styles.detailModalCard}
      >
        {viewingUser ? (
          <View style={styles.detailModalBody}>
            {/* Header: Avatar lớn + Tên + Email */}
            <View style={styles.detailHeaderSection}>
              <View style={styles.detailAvatarWrapper}>
                {viewingUser.hinhanh && !brokenAvatarIds[viewingUser.id] ? (
                  <Image
                    source={{ uri: viewingUser.hinhanh }}
                    style={styles.detailAvatarImg}
                  />
                ) : (
                  <View style={styles.detailAvatarFallback}>
                    <Text style={styles.detailAvatarFallbackText}>
                      {viewingUser.hoten.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.detailNameText}>{viewingUser.hoten}</Text>
              <Text style={styles.detailEmailText}>{viewingUser.email}</Text>
            </View>

            {/* Danh sách thông tin chi tiết */}
            <View style={styles.detailFieldsContainer}>
              {/* Họ tên */}
              <View style={styles.detailFieldItem}>
                <View style={styles.detailFieldIconWrap}>
                  <UserIcon size={16} color="#635BFF" />
                </View>
                <View style={styles.detailFieldContent}>
                  <Text style={styles.detailFieldLabel}>Họ và tên</Text>
                  <Text style={styles.detailFieldValue}>{viewingUser.hoten}</Text>
                </View>
              </View>

              {/* Email */}
              <View style={styles.detailFieldItem}>
                <View style={styles.detailFieldIconWrap}>
                  <Mail size={16} color="#635BFF" />
                </View>
                <View style={styles.detailFieldContent}>
                  <Text style={styles.detailFieldLabel}>Địa chỉ Email</Text>
                  <Text style={styles.detailFieldValue}>{viewingUser.email}</Text>
                </View>
              </View>

              {/* Mật khẩu */}
              <View style={styles.detailFieldItem}>
                <View style={styles.detailFieldIconWrap}>
                  <Key size={16} color="#635BFF" />
                </View>
                <View style={styles.detailFieldContent}>
                  <Text style={styles.detailFieldLabel}>Mật khẩu</Text>
                  <View style={styles.detailPasswordRow}>
                    <Text style={styles.detailPasswordText}>••••••••</Text>
                    <View style={styles.detailSecurityBadge}>
                      <Shield size={11} color="#059669" />
                      <Text style={styles.detailSecurityBadgeText}>Được bảo mật</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Định dạng ảnh */}
              <View style={styles.detailFieldItem}>
                <View style={styles.detailFieldIconWrap}>
                  <ImageIcon size={16} color="#635BFF" />
                </View>
                <View style={styles.detailFieldContent}>
                  <Text style={styles.detailFieldLabel}>Định dạng ảnh</Text>
                  <Text style={styles.detailFieldValue}>
                    {viewingUser.hinhanh.startsWith('data:image/')
                      ? 'Chuỗi Base64 Data URL (Lưu trong Firestore)'
                      : viewingUser.hinhanh.startsWith('http')
                      ? 'Liên kết hình ảnh Web (URL)'
                      : 'Chưa có ảnh'}
                  </Text>
                </View>
              </View>

              {/* Document ID */}
              <View style={styles.detailFieldItem}>
                <View style={styles.detailFieldIconWrap}>
                  <Sparkles size={16} color="#635BFF" />
                </View>
                <View style={styles.detailFieldContent}>
                  <Text style={styles.detailFieldLabel}>Mã định danh (UID Firestore)</Text>
                  <Text style={styles.detailUidText} numberOfLines={1}>
                    {viewingUser.id}
                  </Text>
                </View>
              </View>
            </View>

            {/* Nút hành động */}
            <View style={styles.detailActionsRow}>
              <TouchableOpacity
                style={styles.detailCloseBtn}
                onPress={() => setViewingUser(null)}
              >
                <Text style={styles.detailCloseBtnText}>Đóng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailEditBtn}
                onPress={() => {
                  const target = viewingUser;
                  setViewingUser(null);
                  handleOpenEditModal(target);
                }}
              >
                <Edit2 size={15} color="#FFFFFF" />
                <Text style={styles.detailEditBtnText}>Chỉnh sửa thông tin</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </CustomModal>

      {/* Modal Xem trước ảnh đại diện kích thước lớn */}
      <CustomModal
        visible={previewUserImage !== null}
        title={
          previewUserImage
            ? `Ảnh đại diện: ${previewUserImage.hoten}`
            : 'Xem trước ảnh'
        }
        onClose={() => setPreviewUserImage(null)}
      >
        {previewUserImage ? (
          <View style={styles.largePreviewContainer}>
            <Image
              source={{ uri: previewUserImage.hinhanh }}
              style={styles.largePreviewImg}
            />
            <Text style={styles.largePreviewMeta}>
              Email: {previewUserImage.email}
            </Text>
            <Text style={styles.largePreviewMeta}>
              Định dạng lưu trữ:{' '}
              {previewUserImage.hinhanh.startsWith('data:image/')
                ? 'Chuỗi Base64 trong Firestore'
                : 'Liên kết URL trực tiếp'}
            </Text>
          </View>
        ) : null}
      </CustomModal>

      {/* Hộp thoại Xác nhận xóa */}
      <ConfirmDialog
        visible={deletingUser !== null}
        title="Xác nhận xóa người dùng"
        message={
          deletingUser
            ? `Bạn có chắc chắn muốn xóa người dùng "${deletingUser.hoten}" khỏi hệ thống không?`
            : ''
        }
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        destructive
        loading={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeletingUser(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E164B',
  },
  dashboardRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F7F7FC',
  },
  dashboardRootCompact: {
    flexDirection: 'column',
  },
  /* SIDEBAR */
  sidebar: {
    width: 245,
    backgroundColor: '#1E164B',
    paddingVertical: 24,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  sidebarCompact: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  brandRow: {
    paddingHorizontal: 4,
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 18,
  },
  navMenu: {
    gap: 8,
  },
  navMenuCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.3)',
  },
  navItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CBD5E1',
  },
  navItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sidebarPromoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mascotCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(167, 139, 250, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  sidebarPromoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sidebarPromoSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C4B5FD',
    marginTop: 2,
  },

  /* MAIN AREA */
  mainArea: {
    flex: 1,
    backgroundColor: '#F7F7FC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEAF6',
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breadcrumbMuted: {
    fontSize: 13,
    color: '#64748B',
  },
  breadcrumbSeparator: {
    fontSize: 13,
    color: '#94A3B8',
  },
  breadcrumbActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconActionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  bellWrapper: {
    position: 'relative',
    padding: 4,
  },
  bellDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  adminProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxWidth: 220,
  },
  adminAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#635BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminAvatarInitial: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  adminNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    flexShrink: 1,
  },

  /* SCROLL CONTENT */
  scrollBody: {
    padding: 28,
    gap: 20,
  },
  titleBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  titleLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bigUsersIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageMainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E164B',
  },
  pageSubTitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  addUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#635BFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#635BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  addUserButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* FEEDBACK BANNER */
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  feedbackBoxInfo: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  feedbackText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  feedbackTextInfo: {
    color: '#3730A3',
  },

  /* 4 STAT CARDS */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCardItem: {
    flex: 1,
    minWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEAF6',
  },
  statIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextGroup: {
    flex: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  /* SEARCH & FILTER BAR */
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
    zIndex: 20,
  },
  searchBox: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 46,
  },
  searchInput: {
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
  filterWrapper: {
    position: 'relative',
    zIndex: 30,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 46,
    minWidth: 165,
    justifyContent: 'space-between',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  filterDropdownMenu: {
    position: 'absolute',
    top: 52,
    right: 0,
    width: 210,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  filterDropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  filterDropdownItemActive: {
    backgroundColor: '#EEF2FF',
  },
  filterDropdownItemText: {
    fontSize: 13,
    color: '#334155',
  },
  filterDropdownItemTextActive: {
    fontWeight: '700',
    color: '#635BFF',
  },

  /* DATA TABLE */
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEAF6',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2EFFE',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E0FA',
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#312E81',
  },
  tableLoadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  tableLoadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  colAvatar: {
    width: 110,
  },
  colName: {
    flex: 1.3,
    paddingRight: 12,
  },
  colEmail: {
    flex: 1.6,
    paddingRight: 12,
  },
  colPassword: {
    flex: 1.1,
    paddingRight: 12,
  },
  colActions: {
    width: 100,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#EDE9FE',
    backgroundColor: '#F3F4F6',
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' } as unknown as Record<string, unknown>)
      : {}),
  },
  avatarImg: {
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
    fontSize: 16,
    fontWeight: '700',
    color: '#635BFF',
  },
  cellNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  cellEmailText: {
    fontSize: 14,
    color: '#475569',
  },
  passwordMaskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cellPasswordDots: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 1,
  },
  cellPasswordLabel: {
    fontSize: 11,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  actionBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' } as unknown as Record<string, unknown>)
      : {}),
  },
  deleteIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' } as unknown as Record<string, unknown>)
      : {}),
  },

  /* PAGINATION FOOTER */
  paginationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  paginationInfoText: {
    fontSize: 13,
    color: '#64748B',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageBtn: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBtnActive: {
    backgroundColor: '#635BFF',
    borderColor: '#635BFF',
  },
  pageBtnDisabled: {
    opacity: 0.45,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  pageBtnTextActive: {
    color: '#FFFFFF',
  },
  ellipsisBox: {
    paddingHorizontal: 4,
  },
  ellipsisText: {
    fontSize: 13,
    color: '#94A3B8',
  },

  /* LARGE IMAGE PREVIEW MODAL */
  largePreviewContainer: {
    alignItems: 'center',
    gap: 10,
  },
  largePreviewImg: {
    width: 220,
    height: 220,
    borderRadius: 16,
    resizeMode: 'cover',
    backgroundColor: '#F1F5F9',
  },
  largePreviewMeta: {
    fontSize: 13,
    color: '#475569',
  },

  /* DETAIL MODAL */
  detailModalCard: {
    maxWidth: 480,
    width: '95%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  detailModalBody: {
    gap: 16,
  },
  detailHeaderSection: {
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailAvatarWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#C4B5FD',
    backgroundColor: '#F3F4F6',
    marginBottom: 10,
    shadowColor: '#635BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  detailAvatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  detailAvatarFallback: {
    flex: 1,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailAvatarFallbackText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#635BFF',
  },
  detailNameText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  detailEmailText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  detailFieldsContainer: {
    gap: 10,
  },
  detailFieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailFieldIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailFieldContent: {
    flex: 1,
  },
  detailFieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailFieldValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  detailPasswordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailPasswordText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 2,
  },
  detailSecurityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  detailSecurityBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  detailUidText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#635BFF',
    fontWeight: '600',
  },
  detailActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 8,
  },
  detailCloseBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' } as unknown as Record<string, unknown>)
      : {}),
  },
  detailCloseBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  detailEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#635BFF',
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' } as unknown as Record<string, unknown>)
      : {}),
  },
  detailEditBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clickableNameWrapper: {
    justifyContent: 'center',
    paddingVertical: 4,
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' } as unknown as Record<string, unknown>)
      : {}),
  },
  viewDetailIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' } as unknown as Record<string, unknown>)
      : {}),
  },
});
