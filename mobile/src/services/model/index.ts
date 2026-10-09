import { parseExtraction } from '../../core/verify';
import type { ModelService } from '../contracts';
import { MiraModule } from '../native/miraModule';
import { complete, isModelLoaded, loadModel } from './llama';
import {
  ANSWER_SYSTEM,
  DRAFT_SYSTEM,
  EXTRACT_GRAMMAR,
  EXTRACT_SYSTEM,
  answerBlock,
  cleanAnswer,
  cleanDraft,
  expandShortRecord,
  messageBlock,
} from './prompts';
import { createTurnQueue } from './queue';

/**
 * The model on the phone. Loads the file on first use and runs one request
 * at a time, with a question from the user ahead of background reading.
 * When no model file has been copied to the phone, reading and drafting go
 * through `fallback` so the app still runs on an emulator; answering does not.
 */
export function createDeviceModel(fallback: ModelService): ModelService {
  let ready: Promise<boolean> | null = null;
  const inTurn = createTurnQueue();

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
    answer: (question, sources) =>
      inTurn(async () => {
        // No fallback here: a made-up sentence must never be shown as MIRA's answer.
        if (!(await ensureLoaded())) {
          throw new Error('The model file is not on this phone.');
        }
        const { text } = await complete(
          ANSWER_SYSTEM,
          answerBlock(question, sources),
          { maxTokens: 80 },
        );
        return cleanAnswer(text);
      }, 'user'),
  };
}
