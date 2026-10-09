import './global.css';

import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation';
import palette from './src/theme/palette';
import { PrefsProvider } from './src/theme/prefs';

const theme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: palette.silk.base, primary: palette.navy.DEFAULT, text: palette.ink.DEFAULT },
};

function App() {
  return (
    <SafeAreaProvider>
      <PrefsProvider>
        <StatusBar barStyle="dark-content" />
        <NavigationContainer theme={theme}>
          <RootNavigator />
        </NavigationContainer>
      </PrefsProvider>
    </SafeAreaProvider>
  );
}

export default App;
