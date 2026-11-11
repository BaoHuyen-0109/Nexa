import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoadingIndicator } from '../components';
import { CreateScreen } from '../screens/detail/CreateScreen';
import { DetailScreen } from '../screens/detail/DetailScreen';
import { EditScreen } from '../screens/detail/EditScreen';
import { AdminUserProfile, authService } from '../services';
import { RootStackParamList } from '../types';
import { AuthStack } from './AuthStack';
import { MainTabNavigator } from './MainTabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * ROOT NAVIGATOR - BẢO VỆ ROUTE QUẢN TRỊ (PROTECTED ADMIN ROUTES)
 *
 * - Lắng nghe trạng thái xác thực Admin qua `authService.subscribeAdminAuth`.
 * - Khi chưa đăng nhập hoặc tài khoản không có quyền Admin: chỉ hiển thị `AuthStack` (`LoginScreen`).
 * - Khi đã xác thực quyền Admin hợp lệ: mở khóa các màn hình quản trị (`MainTabs`, `Detail`, `Create`, `Edit`).
 */
export const RootNavigator: React.FC = () => {
  const [adminUser, setAdminUser] = useState<AdminUserProfile | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = authService.subscribeAdminAuth((profile) => {
      setAdminUser(profile);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) {
    return (
      <LoadingIndicator
        fullScreen
        message="Đang xác thực phiên làm việc Quản trị viên..."
      />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {adminUser ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="Detail" component={DetailScreen} />
            <Stack.Screen name="Create" component={CreateScreen} />
            <Stack.Screen name="Edit" component={EditScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
