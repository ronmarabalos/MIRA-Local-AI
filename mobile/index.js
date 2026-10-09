/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { withDevProbe } from './src/services/native/dev/DevProbe';

AppRegistry.registerComponent(appName, () =>
  __DEV__ ? withDevProbe(App) : App,
);
