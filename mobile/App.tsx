import './global.css';

import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from './src/components/ErrorBoundary';
import { RootNavigator } from './src/navigation';
import palette from './src/theme/palette';
import { getStore } from './src/services/db';
import { PrefsProvider, type PrefsStorage } from './src/theme/prefs';

const theme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: palette.silk.base, primary: palette.navy.DEFAULT, text: palette.ink.DEFAULT },
};

const prefsStorage: PrefsStorage = {
  load: () => getStore().then(store => store.getPrefs()),
  save: (key, value) => getStore().then(store => store.setPref(key, value)),
};

function App() {
  return (
    <SafeAreaProvider>
      <PrefsProvider storage={prefsStorage}>
        <StatusBar barStyle="dark-content" />
        <ErrorBoundary>
          <NavigationContainer theme={theme}>
            <RootNavigator />
          </NavigationContainer>
        </ErrorBoundary>
      </PrefsProvider>
    </SafeAreaProvider>
  );
}

export default App;
