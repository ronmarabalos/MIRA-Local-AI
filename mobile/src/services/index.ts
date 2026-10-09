/**
 * The one place that chooses real or fake services. Only Lane A edits this
 * file, once per integration (tasks A2.3 and A3.4 in docs/PLAN.md).
 */
import type { ModelService, NativeBridge } from './contracts';
import { createFakeBridge } from './fakes/bridge';
import { createFakeModel } from './fakes/model';
import { SEED_NOTIFICATIONS } from './fakes/seed';

export const bridge: NativeBridge = createFakeBridge(SEED_NOTIFICATIONS);
export const model: ModelService = createFakeModel();
