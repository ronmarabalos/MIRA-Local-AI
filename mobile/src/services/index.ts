/**
 * The one place that chooses real or fake services. Only Lane A edits this
 * file (tasks A2.3 and A3.4 in docs/PLAN.md).
 *
 * On a phone or emulator the real bridge is used. The model answers from the
 * file on the phone, or from the fake when no file has been copied over.
 * Under Jest there is no native module, so both are fakes.
 */
import { NativeModules } from 'react-native';

import type { ModelService, NativeBridge } from './contracts';
import { createFakeBridge } from './fakes/bridge';
import { createFakeModel } from './fakes/model';
import { SEED_NOTIFICATIONS } from './fakes/seed';

const onDevice = NativeModules.MiraModule != null;

function deviceBridge(): NativeBridge {
  // Required here so tests never load the native-backed modules.
  return require('./native/bridge').createNativeBridge();
}

function deviceModel(): ModelService {
  return require('./model').createDeviceModel();
}

export const bridge: NativeBridge = onDevice
  ? deviceBridge()
  : createFakeBridge(SEED_NOTIFICATIONS);

export const model: ModelService = onDevice ? deviceModel() : createFakeModel();
