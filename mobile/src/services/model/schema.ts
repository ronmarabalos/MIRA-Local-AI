/** The JSON form the model's output is constrained to (spec 5.2). */
export const RECORD_SCHEMA = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: [
        'request',
        'question',
        'deadline',
        'payment',
        'schedule_change',
        'announcement',
        'chatter',
        'promotion',
        'other',
      ],
    },
    summary: { type: 'string', maxLength: 120 },
    needs_user: { type: 'boolean' },
    urgency: { type: 'string', enum: ['low', 'normal', 'high'] },
    request: { type: ['string', 'null'] },
    date_text: { type: ['string', 'null'] },
    amount: { type: ['string', 'null'] },
    sensitive: { type: 'boolean' },
    instruction_like: { type: 'boolean' },
  },
  required: [
    'type',
    'summary',
    'needs_user',
    'urgency',
    'request',
    'date_text',
    'amount',
    'sensitive',
    'instruction_like',
  ],
  additionalProperties: false,
} as const;

export function toModelUri(path: string): string {
  return path.startsWith('file://') ? path : `file://${path}`;
}

/**
 * The JSON object inside a model reply. Tolerates text before or after it,
 * such as a chat marker. Throws when there is no object or it does not parse.
 */
export function parseJsonObject(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new Error('No JSON object in the model output.');
  }
  return JSON.parse(text.slice(start, end + 1));
}
