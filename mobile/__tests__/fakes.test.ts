import type { CapturedNotification, Message } from '../src/core/types';
import { createFakeBridge } from '../src/services/fakes/bridge';
import { createFakeModel } from '../src/services/fakes/model';

const notification: CapturedNotification = {
  key: 'n1',
  packageName: 'com.facebook.orca',
  postedAt: 1,
  title: 'Maya',
  text: 'Can we move the meeting?',
  bigText: null,
  conversationTitle: null,
  isGroup: false,
  messages: [],
  category: 'msg',
  isOngoing: false,
  canReply: true,
};

const message: Message = {
  id: 'm1',
  notificationKey: 'n1',
  packageName: 'com.facebook.orca',
  chatId: 'c1',
  sender: 'Maya',
  text: 'Can we move the meeting?',
  postedAt: 1,
  truncated: false,
  canReply: true,
  status: 'new',
};

const context = { chatTitle: 'Maya', chatKind: 'private' as const };

describe('fake bridge', () => {
  test('hands each notification over once', async () => {
    const bridge = createFakeBridge([notification]);
    expect(await bridge.drainInbox()).toEqual([notification]);
    expect(await bridge.drainInbox()).toEqual([]);
  });

  test('tells listeners when a notification arrives, until they unsubscribe', () => {
    const bridge = createFakeBridge();
    const listener = jest.fn();
    const unsubscribe = bridge.onNotification(listener);
    bridge.push(notification);
    unsubscribe();
    bridge.push({ ...notification, key: 'n2' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('drops notifications from apps that are switched off', async () => {
    const bridge = createFakeBridge();
    await bridge.setEnabledPackages(['com.google.android.gm']);
    bridge.push(notification);
    expect(await bridge.drainInbox()).toEqual([]);
  });

  test('sends a reply only while the notification is known and can be answered', async () => {
    const bridge = createFakeBridge([notification]);
    expect(await bridge.sendReply('n1', 'Sure')).toBe('sent');
    expect(await bridge.sendReply('missing', 'Sure')).toBe('gone');
    expect(bridge.sentReplies).toEqual([{ key: 'n1', text: 'Sure' }]);
  });

  test('reports going offline to listeners', async () => {
    const bridge = createFakeBridge();
    const listener = jest.fn();
    bridge.onOnlineChange(listener);
    bridge.setOnline(false);
    expect(listener).toHaveBeenCalledWith(false);
    expect(await bridge.isOnline()).toBe(false);
  });
});

describe('fake model', () => {
  test('returns the canned record for a message text, or a default', async () => {
    const model = createFakeModel({
      'Can we move the meeting?': { type: 'question', needs_user: true },
    });
    const known = await model.extract(message, context);
    expect(known.type).toBe('question');
    expect(known.needs_user).toBe(true);
    const unknown = await model.extract(
      { ...message, text: 'hello there friend' },
      context,
    );
    expect(unknown.type).toBe('other');
  });

  test('answers from the first source, naming who sent it', async () => {
    const model = createFakeModel();
    const answer = await model.answer('When is it due?', [
      { message, context },
    ]);
    expect(answer).toContain('Maya');
    expect(answer).toContain('Can we move the meeting?');
  });
});
