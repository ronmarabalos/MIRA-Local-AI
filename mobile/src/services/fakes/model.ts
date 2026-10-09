import type { ExtractedRecord } from '../../core/types';
import type { ModelService } from '../contracts';

const DEFAULT_RECORD: ExtractedRecord = {
  type: 'other',
  summary: '',
  needs_user: false,
  urgency: 'normal',
  request: null,
  date_text: null,
  amount: null,
  sensitive: false,
  instruction_like: false,
};

/** A model that answers from a table keyed by message text. */
export function createFakeModel(
  canned: Record<string, Partial<ExtractedRecord>> = {},
): ModelService {
  return {
    async extract(message) {
      return {
        ...DEFAULT_RECORD,
        summary: message.text.slice(0, 120),
        ...canned[message.text],
      };
    },
    async draftReply(message) {
      return `Thanks ${message.sender}, I'll get back to you on this.`;
    },
  };
}
