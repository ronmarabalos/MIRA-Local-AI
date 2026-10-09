import { parseExtraction } from '../../core/verify';
import type { ModelService } from '../contracts';
import { MiraModule } from '../native/miraModule';
import { complete, isModelLoaded, loadModel } from './llama';
import {
  DRAFT_SYSTEM,
  EXTRACT_GRAMMAR,
  EXTRACT_SYSTEM,
  cleanDraft,
  expandShortRecord,
  messageBlock,
} from './prompts';

/**
 * The model on the phone. Loads the file on first use and runs one request
 * at a time. When no model file has been copied to the phone it answers
 * through `fallback`, so the app still runs on an emulator.
 */
export function createDeviceModel(fallback: ModelService): ModelService {
  let ready: Promise<boolean> | null = null;
  let queue: Promise<unknown> = Promise.resolve();

  const ensureLoaded = () => {
    if (!ready || (ready && !isModelLoaded())) {
      ready = MiraModule.getModelPath().then(async path => {
        if (!path) {
          return false;
        }
        await loadModel(path);
        return true;
      });
    }
    return ready;
  };

  const inTurn = <T>(task: () => Promise<T>): Promise<T> => {
    const result = queue.then(task, task);
    queue = result.catch(() => {});
    return result;
  };

  return {
    extract: (message, context) =>
      inTurn(async () => {
        if (!(await ensureLoaded())) {
          return fallback.extract(message, context);
        }
        const { text } = await complete(
          EXTRACT_SYSTEM,
          messageBlock(message, context),
          {
            grammar: EXTRACT_GRAMMAR,
            maxTokens: 160,
          },
        );
        const parsed = parseExtraction(expandShortRecord(text));
        if (!parsed.ok) {
          throw new Error(
            `The model output could not be read (${parsed.reason}).`,
          );
        }
        return parsed.value;
      }),
    draftReply: (message, context) =>
      inTurn(async () => {
        if (!(await ensureLoaded())) {
          return fallback.draftReply(message, context);
        }
        const { text } = await complete(
          DRAFT_SYSTEM,
          messageBlock(message, context),
          {
            maxTokens: 110,
          },
        );
        return cleanDraft(text);
      }),
  };
}
