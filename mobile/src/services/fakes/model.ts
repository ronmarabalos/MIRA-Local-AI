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
    async warmUp() {
      return { ms: 0 };
    },
    async reload() {},
    async answerDocument(_request, document) {
      const first = document.passages[0];
      if (!first) return 'There is nothing to answer from.';
      return `From ${document.name}: ${first.slice(0, 160)}`;
    },
    async answer(_question, sources) {
      const first = sources[0];
      if (!first) return 'There is nothing to answer from.';
      const more = sources.length > 1 ? ` I found ${sources.length - 1} more message${sources.length > 2 ? 's' : ''} that may help.` : '';
      return `${first.message.sender} says: ${first.record?.summary ?? first.message.text}${more}`;
    },
  };
}
