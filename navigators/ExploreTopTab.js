import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import NoteScreen from '../screen/component/noteComponent';
// import ScreenB from '../screen/component/noteB';

const TopTab = createMaterialTopTabNavigator();


export default function ExploreTopTab() {
  return (
    <TopTab.Navigator
      screenOptions={{
        tabBarIndicatorStyle: { backgroundColor: '#FF6B00' },
        tabBarLabelStyle: { fontWeight: '600' },
      }}
    >
      <TopTab.Screen
    name="Hình sự"
    component={NoteScreen}
    initialParams={{ type: 'HS' }}
  />

  <TopTab.Screen
    name="Ma túy"
    component={NoteScreen}
    initialParams={{ type: 'MT' }}
  />
    </TopTab.Navigator>
  );
}