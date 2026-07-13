import { Text, TouchableOpacity, View, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';

import { Population } from '../screen/population';
import { Crime } from '../screen/crime';
import { AddCrime } from '../screen/addCrime';
import { EditCrime } from '../screen/editCrime';
import { MapScreen } from '../screen/mapScreen';
import { GetOneFamily } from '../screen/getOneFamily';
import { CameraComponent } from '../screen/component/Camera';
import { Login } from '../screen/login';
import ExploreTopTab from './ExploreTopTab';
import { supabase } from '../screen/lib.js';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ================================
// Custom Bottom Tab Bar
// ================================
function CustomTabBar({ navigation, state }) {
  const tabs = [
    { name: 'Tìm công dân', ref: 'SearchPopulationRef' },
    { name: 'Tìm đối tượng', ref: 'SearchCrimeRef' },
    { name: 'Bản đồ' },
    { name: 'Thống kê' },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#111',
        borderTopWidth: 1,
        borderTopColor: '#2c2c2c',
        height: 58,
        paddingBottom: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <TabItem
        tab={tabs[0]}
        index={0}
        state={state}
        navigation={navigation}
        totalTabs={tabs.length}
      />
      <TabItem
        tab={tabs[1]}
        index={1}
        state={state}
        navigation={navigation}
        totalTabs={tabs.length}
      />

      {/* 🔸 Nút giữa mở Camera */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Camera')}
        style={{
          width: 50,
          height: 50,
          borderRadius: 40,
          backgroundColor: '#00c853',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          shadowColor: '#00c853',
          shadowOpacity: 0.6,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 26, top: -4 }}>📷</Text>
      </TouchableOpacity>

      <TabItem
        tab={tabs[2]}
        index={2}
        state={state}
        navigation={navigation}
        totalTabs={tabs.length}
      />
      <TabItem
        tab={tabs[3]}
        index={3}
        state={state}
        navigation={navigation}
        totalTabs={tabs.length}
      />
    </View>
  );
}

// ================================
// Tách TabItem để gọn hơn
// ================================
const TabItem = ({ tab, index, state, navigation, totalTabs }) => {
  const isActive = state.index === index;
  return (
    <TouchableOpacity
      key={tab.name}
      activeOpacity={0.8}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: index < totalTabs - 1 ? 0.6 : 0,
        borderRightColor: '#333',
        backgroundColor: isActive ? '#1a1a1a' : '#111',
      }}
      onPress={() => {
        navigation.navigate(tab.name);
        if (isActive && tab.ref && global[tab.ref]) {
          const list = global[tab.ref];
          // FlatList dùng scrollToOffset, KeyboardAwareFlatList dùng scrollToPosition
          if (typeof list.scrollToOffset === 'function') {
            list.scrollToOffset({ offset: 0 });
          } else if (typeof list.scrollToPosition === 'function') {
            list.scrollToPosition(0, 0);
          }
        }
      }}
    >
      <Animated.Text
        style={{
          color: isActive ? '#00c853' : '#bdbdbd',
          fontSize: isActive ? 15 : 13,
          fontWeight: isActive ? 'bold' : '500',
          textAlign: 'center',
          top: isActive ? -5 : 0,
        }}
      >
        {tab.name}
      </Animated.Text>
      {isActive && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            width: '60%',
            height: 3,
            borderRadius: 2,
            backgroundColor: '#00c853',
          }}
        />
      )}
    </TouchableOpacity>
  );
};

// ================================
// Bottom Tab Navigator
// ================================
export function AppNavigators() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Tìm công dân" component={Population} />
      <Tab.Screen name="Tìm đối tượng" component={Crime} />
      <Tab.Screen name="Bản đồ" component={MapScreen} />
      <Tab.Screen name="Thống kê" component={ExploreTopTab} />
    </Tab.Navigator>
  );
}

// ================================
// Stack Navigator
// 🔧 FIX: Check session ở đây thay vì trong Login
//    → tránh navigation.reset() khi navigator chưa mount xong
// ================================
const StackNavigator = () => {
  const [initialRoute, setInitialRoute] = useState(null); // null = đang check

  useEffect(() => {
    let mounted = true;

    // Fallback: nếu getSession treo (mạng chập chờn lúc refresh token),
    // sau 8s vẫn cho vào Login thay vì kẹt màn hình trắng.
    const timeout = setTimeout(() => {
      if (mounted) setInitialRoute(prev => (prev === null ? 'Login' : prev));
    }, 8000);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (mounted) setInitialRoute(session ? 'HomeStack' : 'Login');
      })
      .catch(err => {
        console.error('getSession failed:', err);
        if (mounted) setInitialRoute('Login');
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, []);

  // Đang check session → chưa render navigator (tránh flash + crash)
  if (initialRoute === null) return null;

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerStyle: { backgroundColor: '#007b55' },
        headerTintColor: 'white',
      }}
    >
      <Stack.Screen
        name="Login"
        component={Login}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HomeStack"
        component={AppNavigators}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Camera"
        component={CameraComponent}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="addCrime"
        component={AddCrime}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="editCrime"
        component={EditCrime}
        options={{
          headerShown: true,
          headerTitleAlign: 'center',
          animation: 'simple_push',
          headerTitle: 'Sửa đối tượng',
          headerBackTitle: 'Quay lại',
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen
        name="getOneFamily"
        component={GetOneFamily}
        options={{
          headerTitleAlign: 'center',
          animation: 'simple_push',
          headerTitle: 'Thông tin hộ',
          headerBackTitle: 'Quay lại',
          headerTintColor: 'white',
        }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;