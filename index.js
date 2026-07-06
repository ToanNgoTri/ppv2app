import { AppRegistry } from 'react-native';
import App from './App';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from './utils/ErrorBoundary';
import { name as appName } from './app.json';

const Root = () => (
  <SafeAreaProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </SafeAreaProvider>
);

AppRegistry.registerComponent(appName, () => Root);
