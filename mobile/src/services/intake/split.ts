/* eslint-disable no-bitwise */
import type { CapturedNotification, Chat, Message } from '../../core/types';

export interface IncomingMessage {
  message: Message;
  chat: Chat;
}

/** A short, stable id from a message's identity, so a re-posted message gets the same one. */
function idFor(parts: string[]): string {
  let a = 0x811c9dc5;
  let b = 0x1b873593;
  for (const ch of parts.join('\u0001')) {
    const code = ch.codePointAt(0) ?? 0;
    a = Math.imul(a ^ code, 0x01000193);
    b = Math.imul(b ^ code, 0x85ebca6b) ^ (b >>> 13);
  }
  return (
    (a >>> 0).toString(16).padStart(8, '0') +
    (b >>> 0).toString(16).padStart(8, '0')
  );
}

/**
 * Splits a notification into its individual messages (spec 4.3). Chat apps
 * list them one by one; anything else is one message made of the title and
 * text. Messages with no text are left out.
 */
export function splitNotification(n: CapturedNotification): IncomingMessage[] {
  const title = n.conversationTitle ?? n.title ?? n.packageName;
  const chat: Chat = {
    id: `${n.packageName}:${title}`,
    packageName: n.packageName,
    title,
    kind: n.isGroup ? 'group' : 'private',
  };

  const parts =
    n.messages.length > 0
      ? n.messages.map(m => ({
          sender: m.sender || title,
          text: m.text,
          time: m.time,
        }))
      : [single(n, title)];

  return parts
    .filter(part => part.text.trim() !== '')
    .map(part => ({
      chat,
      message: {
        id: idFor([
          n.packageName,
          chat.id,
          part.sender,
          part.text,
          String(part.time),
        ]),
        notificationKey: n.key,
        packageName: n.packageName,
        chatId: chat.id,
        sender: part.sender,
        text: part.text,
        postedAt: part.time,
        truncated: false,
        canReply: n.canReply,
        status: 'new',
      },
    }));
}

/** The one message in a notification that does not list its messages. */
function single(n: CapturedNotification, title: string) {
  const text = n.bigText ?? n.text ?? '';
  // A group notification without a message list writes "Sender: text".
  const prefixed = n.isGroup ? /^([^:\n]{1,60}): ([\s\S]+)$/.exec(text) : null;
  return prefixed
    ? { sender: prefixed[1], text: prefixed[2], time: n.postedAt }
    : { sender: n.title ?? title, text, time: n.postedAt };
}
