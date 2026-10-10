import { initLlama, releaseAllLlama } from 'llama.rn';

import { ModelError } from '../../core/modelErrors';
import { toModelUri } from './schema';

type LlamaContext = Awaited<ReturnType<typeof initLlama>>;

let context: LlamaContext | null = null;

export interface Completion {
  text: string;
  ms: number;
  promptTokens: number;
  outputTokens: number;
  tokensPerSecond: number;
}

/** The phone's four fast cores. More threads than that slows generation down. */
const THREADS = 4;

/** Loads one model file. The spec runs the model on the CPU, so no GPU layers. */
export async function loadModel(path: string): Promise<{ ms: number }> {
  // Always release: after a development reload this module forgets its
  // context while the native side still holds the model in memory.
  context = null;
  await releaseAllLlama();
  const started = Date.now();
  context = await initLlama({
    model: toModelUri(path),
    n_ctx: 2048,
    n_threads: THREADS,
    n_gpu_layers: 0,
  });
  return { ms: Date.now() - started };
}

export async function unloadModel(): Promise<void> {
  if (context) {
    context = null;
    await releaseAllLlama();
  }
}

export function isModelLoaded(): boolean {
  return context !== null;
}

/** One request. A grammar or a schema constrains the output to that form. */
export async function complete(
  system: string,
  user: string,
  options: { schema?: object; grammar?: string; maxTokens?: number; timeoutMs?: number } = {},
): Promise<Completion> {
  if (!context) {
    throw new Error('No model is loaded.');
  }
  const started = Date.now();
  const running = context;
  const request = running.completion({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    // The model's own chat template. Without it the reply starts with a
    // stray chat marker and the JSON form is not enforced.
    jinja: true,
    n_predict: options.maxTokens ?? 200,
    temperature: 0,
    ...(options.grammar
      ? { grammar: options.grammar }
      : options.schema
      ? {
          response_format: {
            type: 'json_schema' as const,
            json_schema: { strict: true, schema: options.schema },
          },
        }
      : {}),
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limit = options.timeoutMs
    ? new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          // Stop the work on the phone too, so the next request can start.
          running.stopCompletion().catch(() => {});
          reject(new ModelError('MODEL_TIMEOUT'));
        }, options.timeoutMs);
      })
    : null;
  let result: Awaited<typeof request>;
  try {
    result = await (limit ? Promise.race([request, limit]) : request);
  } finally {
    if (timer) clearTimeout(timer);
  }
  return {
    // `text` is the raw output and can carry the chat template's opening
    // marker; `content` is the message alone.
    text: result.content || result.text,
    ms: Date.now() - started,
    promptTokens: result.timings.prompt_n,
    outputTokens: result.timings.predicted_n,
    tokensPerSecond: result.timings.predicted_per_second,
  };
}
