import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Statistics } from '../screen/statistics';
import { SafeAreaView } from 'react-native-safe-area-context';

const TopTab = createMaterialTopTabNavigator();

export default function ExploreTopTab() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <TopTab.Navigator
        screenOptions={{
          tabBarIndicatorStyle: { backgroundColor: '#198754' },
          tabBarLabelStyle: { fontWeight: '600' },
          tabBarActiveTintColor: '#198754',
        }}
      >
        <TopTab.Screen
          name="Dân số"
          component={Statistics}
          initialParams={{ table: 'population' }}
        />

        <TopTab.Screen
          name="Đối tượng"
          component={Statistics}
          initialParams={{ table: 'crime' }}
        />
      </TopTab.Navigator>
    </SafeAreaView>
  );
}
