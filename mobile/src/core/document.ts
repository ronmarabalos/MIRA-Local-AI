/**
 * Documents in Ask MIRA: the text is cut into passages, and only the ones a
 * request needs go to the model, which reads about 1,500 words at a time.
 * Every answer is shown with the passages it came from.
 */
import { searchWords, textHas } from './ask';

/** About a third of what the model can read at once, so several fit. */
export const PASSAGE_CHARS = 700;
/** The passages sent with one request, in characters. */
export const PASSAGE_BUDGET = 3200;

/** Requests about the whole document rather than one detail. */
const WHOLE = /\b(summar|summer|buod|overview|main points?|key points?|reviewer|review|outline|explain this|what is this|tl;?dr|ibuod)/i;

function splitLong(paragraph: string, size: number): string[] {
  if (paragraph.length <= size) return [paragraph];
  const out: string[] = [];
  let current = '';
  for (const sentence of paragraph.match(/[^.!?]+[.!?]*\s*/g) ?? [paragraph]) {
    for (let piece = sentence; piece.length > 0; piece = piece.slice(size)) {
      const part = piece.slice(0, size);
      if ((current + part).length > size && current) {
        out.push(current.trim());
        current = '';
      }
      current += part;
    }
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

/** Paragraphs, tidied, with short ones joined up to `size` characters. */
export function splitPassages(text: string, size = PASSAGE_CHARS): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map(p =>
      p
        .split('\n')
        .map(line => line.replace(/[ \t]+/g, ' ').trim())
        .filter(Boolean)
        .join('\n'),
    )
    .filter(Boolean)
    .flatMap(p => splitLong(p, size));
  const out: string[] = [];
  for (const p of paragraphs) {
    const last = out[out.length - 1];
    if (last !== undefined && last.length + 1 + p.length <= size) {
      out[out.length - 1] = `${last}\n${p}`;
    } else {
      out.push(p);
    }
  }
  return out;
}

/** Passages spread evenly from start to end, as many as fit. */
function spread(passages: string[], budget: number): string[] {
  const total = passages.reduce((sum, p) => sum + p.length, 0);
  if (total <= budget) return passages;
  const count = Math.max(1, Math.floor(budget / Math.max(1, total / passages.length)));
  const picked = new Set<number>();
  for (let i = 0; i < count; i += 1) {
    picked.add(Math.round((i * (passages.length - 1)) / Math.max(1, count - 1)));
  }
  const out: string[] = [];
  let used = 0;
  for (const index of [...picked].sort((a, b) => a - b)) {
    if (used + passages[index].length > budget && out.length > 0) continue;
    out.push(passages[index]);
    used += passages[index].length;
  }
  return out;
}

/**
 * The passages to send for a request: the ones that match its words, best
 * first and then put back in document order; or, for a request about the
 * whole document or one nothing matches, a spread from start to end.
 */
export function pickPassages(request: string, passages: string[], budget = PASSAGE_BUDGET): string[] {
  const words = searchWords(request);
  if (WHOLE.test(request) || words.length === 0) return spread(passages, budget);
  const scored = passages
    .map((text, index) => ({ index, text, score: words.filter(word => textHas(text, word)).length }))
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);
  if (scored.length === 0) return spread(passages, budget);
  const chosen: typeof scored = [];
  let used = 0;
  for (const p of scored) {
    if (used + p.text.length > budget && chosen.length > 0) continue;
    chosen.push(p);
    used += p.text.length;
  }
  return chosen.sort((a, b) => a.index - b.index).map(p => p.text);
}
