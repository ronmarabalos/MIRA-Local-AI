/**
 * Documents in Ask MIRA: pick a file, read its text on the phone, and answer
 * requests from the passages that fit them. Nothing is stored: the document
 * lasts as long as the Ask MIRA screen is open.
 */
import { pickPassages, splitPassages } from '../core/document';
import type { ModelService } from './contracts';
import { MiraModule } from './native/miraModule';

export interface OpenDocument {
  name: string;
  pages: number;
  /** Read with text recognition (a scan or a photo), so small mistakes are possible. */
  usedOcr: boolean;
  passages: string[];
}

/** Opens the picker and reads the file. Null when the user cancels; throws with a `code` otherwise. */
export async function pickDocument(): Promise<OpenDocument | null> {
  if (!MiraModule?.pickDocument) {
    throw Object.assign(new Error('Documents can only be read on the phone.'), { code: 'no_picker' });
  }
  const picked = await MiraModule.pickDocument();
  if (!picked) return null;
  const passages = splitPassages(picked.text);
  if (passages.length === 0) {
    throw Object.assign(new Error('No text in that file.'), { code: 'empty' });
  }
  return { name: picked.name, pages: picked.pages, usedOcr: picked.usedOcr, passages };
}

/**
 * MIRA's answer to a request about the document, with the passages it was
 * given. The answer is null when the model has none or fails; the passages
 * are still shown, so nothing is invented.
 */
export async function askDocument(
  request: string,
  document: OpenDocument,
  model: Pick<ModelService, 'answerDocument'>,
): Promise<{ answer: string | null; passages: string[] }> {
  const passages = pickPassages(request, document.passages);
  try {
    const answer = await model.answerDocument(request, { name: document.name, passages });
    return { answer, passages };
  } catch {
    return { answer: null, passages };
  }
}
