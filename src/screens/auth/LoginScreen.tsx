import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  Sparkles,
  Zap,
} from '../../icons';
import {
  CustomInput,
  ErrorMessage,
  NexaLogo,
  PasswordInput,
} from '../../components';
import { isFirebaseConfigured } from '../../config/firebase';
import { useForm } from '../../hooks';
import { authService } from '../../services';
import { commonPatterns } from '../../utils/validators';

interface LoginFormValues {
  email: string;
  password: string;
}

export const LoginScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 900;
  const firebaseReady = isFirebaseConfigured();

  const {
    values,
    errors,
    isSubmitting,
    submitError,
    setFieldValue,
    handleSubmit,
  } = useForm<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: {
      email: {
        required: true,
        requiredMessage: 'Vui lòng nhập email quản trị viên.',
        pattern: {
          regex: commonPatterns.email,
          message: 'Định dạng địa chỉ email không hợp lệ.',
        },
      },
      password: {
        required: true,
        requiredMessage: 'Vui lòng nhập mật khẩu.',
        minLength: {
          value: 6,
          message: 'Mật khẩu tối thiểu 6 ký tự.',
        },
      },
    },
    onSubmit: async (formValues) => {
      await authService.loginAdmin(formValues.email, formValues.password);
    },
  });

  return (
    <View style={styles.outerBackground}>
      {/* Các quầng sáng trang trí nền tạo hiệu ứng chiều sâu cao cấp (Ambient Glow Orbs) */}
      <View style={styles.glowOrbTopLeft} />
      <View style={styles.glowOrbBottomRight} />
      <View style={styles.glowOrbCenter} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              isDesktopWeb && styles.scrollContentDesktop,
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {/* CONTAINER CHÍNH */}
            <View
              style={[
                styles.mainContainer,
                isDesktopWeb && styles.mainContainerDesktop,
              ]}
            >
              {isDesktopWeb ? (
                /* CỘT TRÁI: HERO SHOWCASE TRÊN DESKTOP WEB */
                <View style={styles.heroShowcaseDesktop}>
                  {/* Logo Nexa */}
                  <View style={styles.logoBadgeContainer}>
                    <NexaLogo size={46} showText theme="dark" />
                  </View>

                  <View style={styles.heroTextSection}>
                    <View style={styles.categoryPill}>
                      <Sparkles size={13} color="#C4B5FD" />
                      <Text style={styles.categoryPillText}>
                        NEXT-GEN USER MANAGEMENT
                      </Text>
                    </View>

                    <Text style={styles.heroTitle}>
                      Nền tảng quản trị người dùng thông minh.
                    </Text>
                    <Text style={styles.heroDescription}>
                      Hệ thống quản lý dữ liệu thời gian thực, bảo mật cấp độ đám mây
                      và tối ưu hóa liền mạch cho cả trải nghiệm Web và Di động.
                    </Text>
                  </View>

                  {/* Danh sách tính năng nổi bật */}
                  <View style={styles.featureList}>
                    <View style={styles.featureItem}>
                      <View style={styles.featureIconCircle}>
                        <Zap size={16} color="#A78BFA" />
                      </View>
                      <View style={styles.featureTextWrapper}>
                        <Text style={styles.featureTitle}>Đồng bộ thời gian thực</Text>
                        <Text style={styles.featureSub}>
                          Cập nhật dữ liệu tức thì giữa Web Dashboard và Mobile App.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.featureItem}>
                      <View style={styles.featureIconCircle}>
                        <ShieldCheck size={16} color="#A78BFA" />
                      </View>
                      <View style={styles.featureTextWrapper}>
                        <Text style={styles.featureTitle}>Bảo mật đa tầng</Text>
                        <Text style={styles.featureSub}>
                          Xác thực chặt chẽ qua Firebase Auth & Firestore Rules.
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Footer bản quyền */}
                  <Text style={styles.heroFooterText}>
                    © 2026 NEXA PLATFORM • SMART USER PLATFORM
                  </Text>
                </View>
              ) : (
                /* HEADER TINH GỌN TRÊN MOBILE (IPHONE / ANDROID) */
                <View style={styles.mobileBrandHeader}>
                  <NexaLogo size={44} showText theme="dark" />
                  <View style={styles.mobilePillBadge}>
                    <Sparkles size={12} color="#DDD6FE" />
                    <Text style={styles.mobilePillBadgeText}>
                      SMART USER PLATFORM
                    </Text>
                  </View>
                </View>
              )}

              {/* CARD ĐĂNG NHẬP CHUYÊN NGHIỆP */}
              <View
                style={[
                  styles.formCard,
                  isDesktopWeb && styles.formCardDesktop,
                ]}
              >
                {/* Header trong Card */}
                <View style={styles.cardHeader}>
                  <View style={styles.lockBadge}>
                    <Shield size={20} color="#635BFF" />
                  </View>
                  <View style={styles.cardTitleBox}>
                    <Text style={styles.cardMainTitle}>Đăng nhập Quản trị viên</Text>
                    <Text style={styles.cardSubtitle}>
                      Vui lòng nhập tài khoản quản trị để truy cập bảng điều khiển.
                    </Text>
                  </View>
                </View>

                {/* Cảnh báo cấu hình .env (nếu thiếu) */}
                {!firebaseReady ? (
                  <View style={styles.envWarningBox}>
                    <View style={styles.envWarningHeader}>
                      <AlertTriangle size={18} color="#B45309" />
                      <Text style={styles.envWarningTitle}>
                        Chưa cấu hình biến môi trường Firebase (.env)
                      </Text>
                    </View>
                    <Text style={styles.envWarningText}>
                      Vui lòng điền <Text style={styles.codeInline}>EXPO_PUBLIC_FIREBASE_*</Text> trong file .env và khởi động lại server.
                    </Text>
                  </View>
                ) : null}

                {/* Thông báo lỗi khi đăng nhập sai */}
                <ErrorMessage message={submitError} />

                {/* Ô nhập Email */}
                <View style={styles.inputSpacing}>
                  <CustomInput
                    label="Email Quản trị"
                    required
                    placeholder="admin@ptdnt.edu.vn"
                    value={values.email}
                    onChangeText={(text) => setFieldValue('email', text)}
                    error={errors.email}
                    autoCapitalize="none"
                    autoComplete="off"
                    keyboardType="email-address"
                    leftIcon={<Mail size={18} color="#635BFF" />}
                    onSubmitEditing={() => void handleSubmit()}
                    inputWrapperStyle={styles.enhancedInputWrapper}
                  />
                </View>

                {/* Ô nhập Mật khẩu */}
                <View style={styles.inputSpacing}>
                  <PasswordInput
                    label="Mật khẩu"
                    required
                    placeholder="••••••••"
                    value={values.password}
                    onChangeText={(text) => setFieldValue('password', text)}
                    error={errors.password}
                    autoComplete="new-password"
                    leftIcon={<Lock size={18} color="#635BFF" />}
                    onSubmitEditing={() => void handleSubmit()}
                    inputWrapperStyle={styles.enhancedInputWrapper}
                  />
                </View>

                {/* Nút Đăng nhập Nổi bật */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => void handleSubmit()}
                  disabled={isSubmitting || !firebaseReady}
                  style={[
                    styles.primarySubmitBtn,
                    (!firebaseReady || isSubmitting) && styles.submitBtnDisabled,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primarySubmitText}>
                        Đăng nhập hệ thống
                      </Text>
                      <ArrowRight size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Footer cam kết bảo mật */}
                <View style={styles.cardFooterNotice}>
                  <CheckCircle2 size={14} color="#10B981" />
                  <Text style={styles.cardFooterNoticeText}>
                    Kết nối mã hóa bảo mật thời gian thực
                  </Text>
                </View>
              </View>

              {/* Footer bản quyền trên mobile */}
              {!isDesktopWeb ? (
                <Text style={styles.mobileFooterText}>
                  © 2026 NEXA PLATFORM • SMART USER PLATFORM
                </Text>
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerBackground: {
    flex: 1,
    backgroundColor: '#0E0926',
    position: 'relative',
    overflow: 'hidden',
  },
  /* Quầng sáng trang trí nền (Ambient Light Orbs) */
  glowOrbTopLeft: {
    position: 'absolute',
    top: -120,
    left: -100,
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: 'rgba(99, 91, 255, 0.22)',
  },
  glowOrbBottomRight: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  glowOrbCenter: {
    position: 'absolute',
    top: '35%',
    left: '25%',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  scrollContentDesktop: {
    padding: 36,
  },
  /* Container chính bao bọc 2 cột trên Desktop */
  mainContainer: {
    width: '100%',
    maxWidth: 460,
    flexDirection: 'column',
    gap: 20,
  },
  mainContainerDesktop: {
    maxWidth: 980,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.45,
    shadowRadius: 40,
  },
  /* Header tinh gọn trên Mobile */
  mobileBrandHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    gap: 8,
  },
  mobilePillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(167, 139, 250, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.28)',
  },
  mobilePillBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#DDD6FE',
    letterSpacing: 1.1,
  },
  mobileFooterText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(196, 181, 253, 0.55)',
    textAlign: 'center',
    letterSpacing: 0.6,
    marginTop: 8,
  },
  /* CỘT TRÁI: HERO SHOWCASE */
  heroShowcase: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  heroShowcaseDesktop: {
    flex: 1.15,
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  logoBadgeContainer: {
    marginBottom: 20,
  },
  heroTextSection: {
    marginBottom: 24,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(167, 139, 250, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.25)',
  },
  categoryPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#DDD6FE',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
    lineHeight: 36,
    marginBottom: 10,
  },
  heroDescription: {
    fontSize: 14,
    color: '#C4B5FD',
    lineHeight: 22,
  },
  /* Danh sách tính năng */
  featureList: {
    gap: 16,
    marginBottom: 28,
    paddingTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureTextWrapper: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 12,
    color: '#A5B4FC',
    lineHeight: 17,
  },
  heroFooterText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(196, 181, 253, 0.6)',
    letterSpacing: 0.8,
  },
  /* CỘT PHẢI: FORM CARD */
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 26,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  formCardDesktop: {
    flex: 1,
    padding: 32,
    borderRadius: 22,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
  },
  lockBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleBox: {
    flex: 1,
  },
  cardMainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E164B',
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 17,
  },
  inputSpacing: {
    marginBottom: 4,
  },
  enhancedInputWrapper: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 50,
  },
  primarySubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#635BFF',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 14,
    shadowColor: '#635BFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  primarySubmitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  cardFooterNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
  },
  cardFooterNoticeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  envWarningBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  envWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  envWarningTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#92400E',
    flex: 1,
  },
  envWarningText: {
    fontSize: 11.5,
    color: '#78350F',
    lineHeight: 16,
  },
  codeInline: {
    fontWeight: '700',
  },
});
