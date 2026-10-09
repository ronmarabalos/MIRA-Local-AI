import type { CapturedNotification } from '../src/core/types';
import {
  RECORD_SCHEMA,
  parseJsonObject,
  toModelUri,
} from '../src/services/model/schema';
import { describeNotification } from '../src/services/native/dev/describe';

const base: CapturedNotification = {
  key: 'k',
  packageName: 'com.facebook.orca',
  postedAt: 0,
  title: 'CS 301',
  text: 'Proposal due Friday',
  bigText: null,
  conversationTitle: 'CS 301',
  isGroup: true,
  messages: [{ sender: 'Prof. Reyes', text: 'Proposal due Friday', time: 0 }],
  category: 'msg',
  isOngoing: false,
  canReply: true,
};

test('describes what a notification exposes, in lengths and yes/no facts', () => {
  expect(describeNotification(base)).toEqual([
    'com.facebook.orca',
    'text 19 chars, expanded text none',
    'chat name: yes (group)',
    'individual messages: 1',
    'reply box: yes',
  ]);
  expect(
    describeNotification({
      ...base,
      bigText: 'x'.repeat(240),
      conversationTitle: null,
      isGroup: false,
      messages: [],
      canReply: false,
    }),
  ).toEqual([
    'com.facebook.orca',
    'text 19 chars, expanded text 240 chars',
    'chat name: no',
    'individual messages: 0',
    'reply box: no',
  ]);
});

test('turns a file path into the form the model loader expects', () => {
  expect(toModelUri('/sdcard/model.gguf')).toBe('file:///sdcard/model.gguf');
  expect(toModelUri('file:///sdcard/model.gguf')).toBe(
    'file:///sdcard/model.gguf',
  );
});

test('the record schema requires every field in spec 5.2 and nothing else', () => {
  expect(RECORD_SCHEMA.required).toEqual([
    'type',
    'summary',
    'needs_user',
    'urgency',
    'request',
    'date_text',
    'amount',
    'sensitive',
    'instruction_like',
  ]);
  expect(Object.keys(RECORD_SCHEMA.properties)).toEqual(RECORD_SCHEMA.required);
  expect(RECORD_SCHEMA.additionalProperties).toBe(false);
});

test('reads the JSON object out of a reply that has a chat marker around it', () => {
  expect(
    parseJsonObject('<|im_start|>assistant\n{\n  "type": "announcement"\n}\n'),
  ).toEqual({
    type: 'announcement',
  });
  expect(() => parseJsonObject('no object here')).toThrow();
  expect(() => parseJsonObject('{"type": ')).toThrow();
});
