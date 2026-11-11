import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Database,
  Globe,
  Info,
  LogOut,
  Mail,
  Shield,
  ShieldCheck,
  User as UserIcon,
} from '../../icons';
import { NexaLogo } from '../../components';
import { AdminUserProfile, authService } from '../../services';

export const ProfileScreen: React.FC = () => {
  const [adminProfile, setAdminProfile] = useState<AdminUserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = authService.subscribeAdminAuth((profile) => {
      setAdminProfile(profile);
    });
    return unsubscribe;
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng Nexa Mobile?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await authService.logoutAdmin();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <NexaLogo size={38} showText theme="dark" />
        <Text style={styles.headerSub}>Tài khoản quản trị & Cấu hình</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Thẻ Quản trị viên */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {(adminProfile?.email || 'A').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.roleBadge}>
            <ShieldCheck size={14} color="#635BFF" />
            <Text style={styles.roleText}>Quản trị viên (Admin)</Text>
          </View>
          <Text style={styles.adminEmail}>{adminProfile?.email || 'Admin'}</Text>
          <Text style={styles.adminUidText}>
            UID: {adminProfile?.uid || '---'}
          </Text>
        </View>

        {/* Thông tin kết nối hệ thống */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Thông số hệ thống Nexa</Text>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Database size={18} color="#635BFF" />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Cơ sở dữ liệu đám mây</Text>
              <Text style={styles.infoVal}>Google Cloud Firestore (users, admins)</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Globe size={18} color="#635BFF" />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Firebase Project ID</Text>
              <Text style={styles.infoVal}>ptdnt-dc87f</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Shield size={18} color="#635BFF" />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Tiêu chuẩn dữ liệu 4 trường</Text>
              <Text style={styles.infoVal}>email, matkhau (null), hoten, hinhanh</Text>
            </View>
          </View>
        </View>

        {/* Nút Đăng xuất */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <LogOut size={18} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Đăng xuất khỏi ứng dụng</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>
          Nexa Mobile v1.0.0 • Nền tảng React Native Expo SDK 58
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E164B',
  },
  header: {
    backgroundColor: '#1E164B',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerSub: {
    fontSize: 13,
    color: '#DDD6FE',
    marginTop: 8,
  },
  content: {
    padding: 18,
    gap: 16,
    backgroundColor: '#F8F7FD',
    minHeight: '100%',
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAF6',
    shadowColor: '#1E164B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#635BFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#EDE9FE',
  },
  avatarLetter: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#635BFF',
  },
  adminEmail: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  adminUidText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#94A3B8',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECEAF6',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  infoVal: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  logoutButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#EF4444',
  },
  versionText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
  },
});
