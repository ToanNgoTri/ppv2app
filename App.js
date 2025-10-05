/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {
  Text,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './navigators/AppNavigators'
function App() {
  
  
  return (
<NavigationContainer>
<StackNavigator/>
</NavigationContainer>
);
}

export default App;
