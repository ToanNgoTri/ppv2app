/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './navigators/AppNavigators'
import { SafeAreaView } from 'react-native-safe-area-context';

function App() {
  
  
  return (
<NavigationContainer>
   <SafeAreaView  style={{ flex: 1 }} edges={['bottom']}>
<StackNavigator/>
</SafeAreaView>
</NavigationContainer>
);
}

export default App;
