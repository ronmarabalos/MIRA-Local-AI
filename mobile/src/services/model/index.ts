import { parseExtraction } from '../../core/verify';
import type { ModelService } from '../contracts';
import { MiraModule } from '../native/miraModule';
import { ModelError } from '../../core/modelErrors';
import { complete, isModelLoaded, loadModel, unloadModel } from './llama';
import {
  ANSWER_SYSTEM,
  DOCUMENT_SYSTEM,
  DRAFT_SYSTEM,
  EXTRACT_GRAMMAR,
  EXTRACT_SYSTEM,
  answerBlock,
  documentBlock,
  cleanAnswer,
  cleanDraft,
  expandShortRecord,
  messageBlock,
} from './prompts';
import { createTurnQueue } from './queue';

/** Time limits per call, so one message can never hold the queue (backend rules 4). */
const LIMITS = { extract: 30_000, draft: 30_000, answer: 60_000, document: 90_000, warmUp: 60_000 };

/**
 * The model on the phone. Loads the file on first use (or on warm-up) and
 * runs one request at a time, with a question from the user ahead of
 * background reading. With no model file nothing is made up: every call
 * fails with MODEL_NOT_INSTALLED, and messages wait to be read.
 */
export function createDeviceModel(): ModelService {
  let loading: Promise<void> | null = null;
  const inTurn = createTurnQueue();

  /** Loads the file once; a second caller waits for the same load. */
  const ensureLoaded = async (): Promise<void> => {
    if (isModelLoaded()) return;
    if (!loading) {
      loading = (async () => {
        const path = await MiraModule.getModelPath();
        if (!path) throw new ModelError('MODEL_NOT_INSTALLED');
        try {
          await loadModel(path);
        } catch {
          throw new ModelError('MODEL_LOAD_FAILED');
        }
      })();
      // A failed load is tried again on the next call.
      loading.catch(() => {}).finally(() => {
        loading = null;
      });
    }
    return loading;
  };

  return {
    extract: (message, context) =>
      inTurn(async () => {
        await ensureLoaded();
        const { text } = await complete(
          EXTRACT_SYSTEM,
          messageBlock(message, context),
          {
            grammar: EXTRACT_GRAMMAR,
            maxTokens: 160,
            timeoutMs: LIMITS.extract,
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
        await ensureLoaded();
        const { text } = await complete(
          DRAFT_SYSTEM,
          messageBlock(message, context),
          {
            maxTokens: 110,
            timeoutMs: LIMITS.draft,
          },
        );
        return cleanDraft(text);
      }),
    answer: (question, sources) =>
      inTurn(async () => {
        await ensureLoaded();
        const { text } = await complete(
          ANSWER_SYSTEM,
          answerBlock(question, sources),
          // Two to four sentences: a summary, not a single quoted fact.
          { maxTokens: 160, timeoutMs: LIMITS.answer },
        );
        return cleanAnswer(text);
      }, 'user'),
    answerDocument: (request, document) =>
      inTurn(async () => {
        await ensureLoaded();
        const { text } = await complete(
          DOCUMENT_SYSTEM,
          documentBlock(request, document),
          // Room for a short list or a small reviewer.
          { maxTokens: 260, timeoutMs: LIMITS.document },
        );
        return cleanAnswer(text);
      }, 'user'),
    warmUp: () =>
      inTurn(async () => {
        const started = Date.now();
        await ensureLoaded();
        // One tiny local request proves the model answers on this phone.
        await complete('Reply with the single word OK.', 'Ready?', { maxTokens: 4, timeoutMs: LIMITS.warmUp });
        return { ms: Date.now() - started };
      }, 'user'),
    reload: () =>
      // Queued, so a request in progress is never cut off.
      inTurn(async () => {
        await unloadModel();
      }, 'user'),
  };
}
