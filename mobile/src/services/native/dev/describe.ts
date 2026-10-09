import type { CapturedNotification } from '../../../core/types';

const size = (value: string | null) =>
  value ? `${value.length} chars` : 'none';

/** What a notification exposes, for the device checks in spec section 11. */
export function describeNotification(n: CapturedNotification): string[] {
  return [
    n.packageName,
    `text ${size(n.text)}, expanded text ${size(n.bigText)}`,
    n.conversationTitle
      ? `chat name: yes (${n.isGroup ? 'group' : 'private'})`
      : 'chat name: no',
    `individual messages: ${n.messages.length}`,
    `reply box: ${n.canReply ? 'yes' : 'no'}`,
  ];
}
