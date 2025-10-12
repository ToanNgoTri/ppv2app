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
      }}
    >
      {tabs.map((tab, index) => {
        const isActive = state.index === index;
        return (
          <TouchableOpacity
            key={tab.name}
            activeOpacity={0.8}
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              borderRightWidth: index < tabs.length - 1 ? 0.6 : 0,
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
      })}
    </View>
  );
}

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


      <Stack.Screen name="Camera" component={CameraComponent} options={{ headerShown: false }} />

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
