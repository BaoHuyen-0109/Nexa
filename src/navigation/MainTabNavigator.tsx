import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, List, User, Users } from '../icons';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ListScreen } from '../screens/list/ListScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { theme } from '../theme';
import { MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * THANH ĐIỀU HƯỚNG CHÍNH (MAIN TAB NAVIGATOR)
 *
 * - Trên Web: Ẩn thanh Bottom Tab để hiển thị trọn vẹn bố cục Desktop Admin Dashboard (Sidebar + Header).
 * - Trên Mobile (Android / Expo Go):
 *   + Tab 1: Danh sách Người dùng Nexa (ListScreen)
 *   + Tab 2: Tài khoản Quản trị & Cấu hình (ProfileScreen)
 */
export const MainTabNavigator: React.FC = () => {
  const isWeb = Platform.OS === 'web';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#635BFF',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: isWeb
          ? { display: 'none' }
          : {
              backgroundColor: '#FFFFFF',
              borderTopColor: '#ECEAF6',
              borderTopWidth: 1,
              height: 60,
              paddingBottom: 8,
              paddingTop: 6,
            },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={isWeb ? HomeScreen : ListScreen}
        options={{
          tabBarLabel: isWeb ? 'Quản trị' : 'Người dùng',
          tabBarIcon: ({ color, size }) =>
            isWeb ? <Home size={size} color={color} /> : <Users size={size} color={color} />,
        }}
      />
      {isWeb && (
        <Tab.Screen
          name="ListTab"
          component={ListScreen}
          options={{
            tabBarLabel: 'Danh sách',
            tabBarIcon: ({ color, size }) => <List size={size} color={color} />,
          }}
        />
      )}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Tài khoản',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
