import React from 'react';
import { Text, TouchableOpacity, View, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Population } from '../screen/population';
import { Crime } from '../screen/crime';
import { AddCrime } from '../screen/addCrime';
import { MapScreen } from '../screen/mapScreen';
import { GetOneFamily } from '../screen/getOneFamily';
import { CameraComponent } from '../screen/component/Camera';
import { Login } from '../screen/login';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ================================
// Custom Bottom Tab Bar
// ================================
function CustomTabBar({ navigation, state }) {
  const insets = useSafeAreaInsets();

  const tabs = [
    { name: 'Tìm công dân', ref: 'SearchPopulationRef' },
    { name: 'Tìm đối tượng', ref: 'SearchCrimeRef' },
    { name: 'Bản đồ' },
    { name: 'Thêm đối tượng', ref: 'SearchCrimeRef' },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#111',
        borderTopWidth: 1,
        borderTopColor: '#2c2c2c',
        height: 58 + insets.bottom / 3,
        paddingBottom: insets.bottom / 3,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Tab 1 */}
      <TabItem
        tab={tabs[0]}
        index={0}
        state={state}
        navigation={navigation}
        totalTabs={tabs.length}
      />

      {/* Tab 2 */}
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
          width: 55,
          height: 55,
          borderRadius: 40,
          backgroundColor: '#00c853',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20, // tạo hiệu ứng nổi
          shadowColor: '#00c853',
          shadowOpacity: 0.6,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 26 ,top:-2}}>📷</Text>
      </TouchableOpacity>

      {/* Tab 3 */}
      <TabItem
        tab={tabs[2]}
        index={2}
        state={state}
        navigation={navigation}
        totalTabs={tabs.length}
      />

      {/* Tab 4 */}
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
        if (isActive && global[tab.ref]) {
          global[tab.ref].scrollToOffset({ offset: 0 });
        }
      }}
    >
      <Animated.Text
        style={{
          color: isActive ? '#00c853' : '#bdbdbd',
          fontSize: isActive ? 15 : 13,
          fontWeight: isActive ? 'bold' : '500',
          textAlign: 'center',
          top:isActive?-5:0,
          // backgroundColor:'red'
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
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Tìm công dân" component={Population} />
      <Tab.Screen name="Tìm đối tượng" component={Crime} />
      <Tab.Screen name="Bản đồ" component={MapScreen} />
      <Tab.Screen name="Thêm đối tượng" component={AddCrime} />
    </Tab.Navigator>
  );
}

// ================================
// Stack Navigator
// ================================
const StackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#007b55' },
        headerTintColor: 'white',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />

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
        name="getOneFamily"
        component={GetOneFamily}
        options={({ navigation }) => ({
          headerTitleAlign: 'center',
          animation: 'simple_push',
          headerTitle: () => (
            <Text style={{ fontWeight: 'bold', fontSize: 20, color: 'white' }}>
              Thông tin hộ
            </Text>
          ),
          headerLeft: () => (
            <TouchableOpacity onPressIn={() => navigation.goBack()}>
              <Text style={{ color: 'white', fontSize: 16 }}>← Quay lại</Text>
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;
