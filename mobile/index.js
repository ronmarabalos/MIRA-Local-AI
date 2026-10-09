/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { startIntake } from './src/services/intake/start';
import { withDevProbe } from './src/services/native/dev/DevProbe';

// Captured notifications are taken in for as long as the app is running.
startIntake();

AppRegistry.registerComponent(appName, () =>
  __DEV__ ? withDevProbe(App) : App,
);
