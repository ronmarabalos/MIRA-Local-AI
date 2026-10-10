import type {
  Action,
  ActionStatus,
  Channel,
  Chat,
  Draft,
  DraftStatus,
  Message,
  MessageStatus,
  MiraRecord,
  Rule,
} from '../../core/types';
import type { ReportItem } from '../../core/report';
import type { Row, SqlDatabase, SqlExecutor } from './schema';

/** A stored message with its chat and, once processed, its record. */
export type StoredItem = ReportItem;

export type Store = ReturnType<typeof createStore>;

const DEFAULT_LIMIT = 200;

/**
 * Every read and write MIRA makes, over any `SqlDatabase`. Writes that touch
 * more than one row or table run in a transaction. After each write the
 * store tells its subscribers, so screens can reload.
 */
export function createStore(db: SqlDatabase) {
  const listeners = new Set<() => void>();
  const changed = () => listeners.forEach(listener => listener());

  async function write(fn: (tx: SqlExecutor) => Promise<void>): Promise<void> {
    await db.transaction(fn);
    changed();
  }

  return {
    /** Calls `listener` after every write. Returns the unsubscribe function. */
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    // Channels

    async getChannels(): Promise<Channel[]> {
      const { rows } = await db.execute(
        'SELECT * FROM channels ORDER BY label',
      );
      return rows.map(toChannel);
    },

    async saveChannel(channel: Channel): Promise<void> {
      await write(tx =>
        tx
          .execute(
            `INSERT INTO channels (package, label, enabled, level) VALUES (?, ?, ?, ?)
             ON CONFLICT (package) DO UPDATE SET label = excluded.label,
               enabled = excluded.enabled, level = excluded.level`,
            [
              channel.packageName,
              channel.label,
              bit(channel.enabled),
              channel.level,
            ],
          )
          .then(() => undefined),
      );
    },

    // Messages and records

    async saveProcessingTime(
      messageId: string,
      durationMs: number,
    ): Promise<void> {
      if (!Number.isFinite(durationMs) || durationMs < 0)
        throw new Error('Invalid processing duration');
      await write(tx =>
        tx
          .execute(
            'INSERT OR REPLACE INTO processing_times (message_id, duration_ms) VALUES (?, ?)',
            [messageId, durationMs],
          )
          .then(() => undefined),
      );
    },

    async getProcessingStats(
      from: number,
      to: number,
    ): Promise<{
      processed: number;
      averageMs: number | null;
      samples: number;
    }> {
      const { rows } = await db.execute(
        `SELECT COUNT(*) AS processed, AVG(p.duration_ms) AS average_ms, COUNT(p.duration_ms) AS samples
        FROM messages m LEFT JOIN processing_times p ON p.message_id = m.id
        WHERE m.posted_at >= ? AND m.posted_at < ? AND m.status IN ('processed', 'filtered')`,
        [from, to],
      );
      return {
        processed: Number(rows[0]?.processed ?? 0),
        averageMs: optNum(rows[0]?.average_ms),
        samples: Number(rows[0]?.samples ?? 0),
      };
    },

    /**
     * Stores a message and its chat. Returns false, and stores nothing, when
     * the same message (app, chat, sender, text, and time) is already stored.
     */
    async addMessage(message: Message, chat: Chat): Promise<boolean> {
      let added = false;
      await write(async tx => {
        await tx.execute(
          `INSERT INTO chats (id, package, title, kind) VALUES (?, ?, ?, ?)
           ON CONFLICT (id) DO UPDATE SET title = excluded.title, kind = excluded.kind`,
          [chat.id, chat.packageName, chat.title, chat.kind],
        );
        const result = await tx.execute(
          `INSERT OR IGNORE INTO messages (id, notification_key, package, chat_id, sender, text,
             posted_at, truncated, can_reply, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            message.id,
            message.notificationKey,
            message.packageName,
            message.chatId,
            message.sender,
            message.text,
            message.postedAt,
            bit(message.truncated),
            bit(message.canReply),
            message.status,
          ],
        );
        added = result.rowsAffected === 1;
      });
      return added;
    },

    /** Messages waiting in a state, oldest first: intake's work queue. */
    async getMessagesByStatus(
      status: MessageStatus,
      limit = DEFAULT_LIMIT,
    ): Promise<Message[]> {
      const { rows } = await db.execute(
        'SELECT * FROM messages WHERE status = ? ORDER BY posted_at LIMIT ?',
        [status, limit],
      );
      return rows.map(toMessage);
    },

    async setMessageStatus(
      messageId: string,
      status: MessageStatus,
    ): Promise<void> {
      await write(tx =>
        tx
          .execute('UPDATE messages SET status = ? WHERE id = ?', [
            status,
            messageId,
          ])
          .then(() => undefined),
      );
    },

    /** Stores a message's record and marks the message with its final status. */
    async saveRecord(
      record: MiraRecord,
      status: 'processed' | 'failed' | 'filtered',
    ): Promise<void> {
      await write(async tx => {
        await tx.execute(
          `INSERT OR REPLACE INTO records (message_id, type, summary, needs_user, urgency, request,
             amount, date_text, date_at, sensitive, instruction_like, duplicate_of)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            record.messageId,
            record.type,
            record.summary,
            bit(record.needsUser),
            record.urgency,
            record.request,
            record.amount,
            record.dateText,
            record.dateAt,
            bit(record.sensitive),
            bit(record.instructionLike),
            record.duplicateOf,
          ],
        );
        await tx.execute('UPDATE messages SET status = ? WHERE id = ?', [
          status,
          record.messageId,
        ]);
      });
    },

    /** Messages posted in [from, to), newest first, with chat and record. */
    async getItems(
      from: number,
      to: number,
      limit = DEFAULT_LIMIT,
    ): Promise<StoredItem[]> {
      const { rows } = await db.execute(
        `${ITEM_SELECT} WHERE m.posted_at >= ? AND m.posted_at < ?
         ORDER BY m.posted_at DESC LIMIT ?`,
        [from, to, limit],
      );
      return rows.map(toItem);
    },

    /**
     * Messages posted in [from, to) whose record has a date phrase, newest
     * first. Filtered here, not after loading, so an old deadline is not
     * pushed out by newer chatter.
     */
    async getDatedItems(
      from: number,
      to: number,
      limit = DEFAULT_LIMIT,
    ): Promise<StoredItem[]> {
      const { rows } = await db.execute(
        `${ITEM_SELECT} WHERE m.posted_at >= ? AND m.posted_at < ? AND r.date_text IS NOT NULL
         ORDER BY m.posted_at DESC LIMIT ?`,
        [from, to, limit],
      );
      return rows.map(toItem);
    },

    async getItem(messageId: string): Promise<StoredItem | null> {
      const { rows } = await db.execute(`${ITEM_SELECT} WHERE m.id = ?`, [
        messageId,
      ]);
      return rows.length ? toItem(rows[0]) : null;
    },

    // Drafts

    async addDraft(draft: Draft): Promise<void> {
      await write(tx =>
        tx
          .execute(
            'INSERT INTO drafts (id, message_id, text, first_text, status) VALUES (?, ?, ?, ?, ?)',
            [
              draft.id,
              draft.messageId,
              draft.text,
              draft.firstText,
              draft.status,
            ],
          )
          .then(() => undefined),
      );
    },

    /** Changes a draft's text, its status, or both. `first_text` never changes. */
    async updateDraft(
      id: string,
      change: { text?: string; status?: DraftStatus },
    ): Promise<void> {
      await write(tx =>
        tx
          .execute(
            'UPDATE drafts SET text = COALESCE(?, text), status = COALESCE(?, status) WHERE id = ?',
            [change.text ?? null, change.status ?? null, id],
          )
          .then(() => undefined),
      );
    },

    async getDrafts(
      status: DraftStatus,
      limit = DEFAULT_LIMIT,
    ): Promise<Draft[]> {
      const { rows } = await db.execute(
        'SELECT * FROM drafts WHERE status = ? ORDER BY rowid LIMIT ?',
        [status, limit],
      );
      return rows.map(toDraft);
    },

    // Actions: the activity log

    async addAction(action: Action): Promise<void> {
      await write(tx =>
        tx
          .execute(
            `INSERT INTO actions (id, rule_id, message_id, kind, payload, status, reason, created_at, done_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              action.id,
              action.ruleId,
              action.messageId,
              action.kind,
              JSON.stringify(action.payload),
              action.status,
              action.reason,
              action.createdAt,
              action.doneAt,
            ],
          )
          .then(() => undefined),
      );
    },

    async updateAction(
      id: string,
      change: {
        status: ActionStatus;
        reason?: string | null;
        doneAt?: number | null;
      },
    ): Promise<void> {
      await write(tx =>
        tx
          .execute(
            'UPDATE actions SET status = ?, reason = ?, done_at = ? WHERE id = ?',
            [change.status, change.reason ?? null, change.doneAt ?? null, id],
          )
          .then(() => undefined),
      );
    },

    /** The log, newest first, one page at a time: pass the last `createdAt` seen. */
    async getActions(
      before = Number.MAX_SAFE_INTEGER,
      limit = 50,
    ): Promise<Action[]> {
      const { rows } = await db.execute(
        'SELECT * FROM actions WHERE created_at < ? ORDER BY created_at DESC LIMIT ?',
        [before, limit],
      );
      return rows.map(toAction);
    },

    /** Actions created in [from, to), for counts and "Handled for you". */
    async getActionsBetween(from: number, to: number): Promise<Action[]> {
      const { rows } = await db.execute(
        'SELECT * FROM actions WHERE created_at >= ? AND created_at < ? ORDER BY created_at',
        [from, to],
      );
      return rows.map(toAction);
    },

    // Rules

    async getRules(): Promise<Rule[]> {
      const { rows } = await db.execute(
        'SELECT * FROM rules ORDER BY created_at',
      );
      return rows.map(toRule);
    },

    async saveRule(rule: Rule): Promise<void> {
      await write(tx =>
        tx
          .execute(
            `INSERT OR REPLACE INTO rules (id, sentence, definition, level, enabled, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              rule.id,
              rule.sentence,
              JSON.stringify(rule.definition),
              rule.level,
              bit(rule.enabled),
              rule.createdAt,
            ],
          )
          .then(() => undefined),
      );
    },

    async setRuleEnabled(id: string, enabled: boolean): Promise<void> {
      await write(tx =>
        tx
          .execute('UPDATE rules SET enabled = ? WHERE id = ?', [
            bit(enabled),
            id,
          ])
          .then(() => undefined),
      );
    },

    // Preferences (name, theme, reduce motion)

    async getPrefs(): Promise<Record<string, string>> {
      const { rows } = await db.execute('SELECT key, value FROM prefs');
      return Object.fromEntries(
        rows.map(row => [str(row.key), str(row.value)]),
      );
    },

    /** Not a report change, so screens are not told to reload. */
    async setPref(key: string, value: string): Promise<void> {
      await db.execute(
        'INSERT INTO prefs (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
        [key, value],
      );
    },

    /** The words a message must contain to be kept (core/keep.ts); empty keeps everything. */
    async getKeepWords(): Promise<string[]> {
      const { rows } = await db.execute("SELECT value FROM prefs WHERE key = 'keepWords'");
      if (rows.length === 0) return [];
      try {
        const words = JSON.parse(str(rows[0].value));
        return Array.isArray(words) ? words.filter((w): w is string => typeof w === 'string') : [];
      } catch {
        return [];
      }
    },

    /** Saved like a report change, so Today's "Which messages" line updates. */
    async setKeepWords(words: string[]): Promise<void> {
      await write(tx =>
        tx
          .execute(
            `INSERT INTO prefs (key, value) VALUES ('keepWords', ?)
             ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
            [JSON.stringify(words)],
          )
          .then(() => undefined),
      );
    },

    /** Removes everything stored from one app, together. */
    async deleteAppData(packageName: string): Promise<void> {
      await write(async tx => {
        // Records, drafts, and actions go with their messages (ON DELETE CASCADE).
        await tx.execute('DELETE FROM messages WHERE package = ?', [
          packageName,
        ]);
        await tx.execute('DELETE FROM chats WHERE package = ?', [packageName]);
      });
    },
  };
}

const ITEM_SELECT = `SELECT m.*, c.title AS chat_title, c.kind AS chat_kind,
    r.message_id AS r_message_id, r.type AS r_type, r.summary AS r_summary,
    r.needs_user AS r_needs_user, r.urgency AS r_urgency, r.request AS r_request,
    r.amount AS r_amount, r.date_text AS r_date_text, r.date_at AS r_date_at,
    r.sensitive AS r_sensitive, r.instruction_like AS r_instruction_like,
    r.duplicate_of AS r_duplicate_of
  FROM messages m
  JOIN chats c ON c.id = m.chat_id
  LEFT JOIN records r ON r.message_id = m.id`;

const bit = (value: boolean) => (value ? 1 : 0);
const str = (value: unknown) => value as string;
const num = (value: unknown) => Number(value);
const optStr = (value: unknown) =>
  value === null || value === undefined ? null : String(value);
const optNum = (value: unknown) =>
  value === null || value === undefined ? null : Number(value);
const bool = (value: unknown) => Number(value) === 1;

function toChannel(row: Row): Channel {
  return {
    packageName: str(row.package),
    label: str(row.label),
    enabled: bool(row.enabled),
    level: num(row.level) === 2 ? 2 : 1,
  };
}

function toMessage(row: Row): Message {
  return {
    id: str(row.id),
    notificationKey: str(row.notification_key),
    packageName: str(row.package),
    chatId: str(row.chat_id),
    sender: str(row.sender),
    text: str(row.text),
    postedAt: num(row.posted_at),
    truncated: bool(row.truncated),
    canReply: bool(row.can_reply),
    status: str(row.status) as MessageStatus,
  };
}

function toItem(row: Row): StoredItem {
  return {
    message: toMessage(row),
    chat: {
      id: str(row.chat_id),
      packageName: str(row.package),
      title: str(row.chat_title),
      kind: str(row.chat_kind) as Chat['kind'],
    },
    record:
      row.r_message_id === null || row.r_message_id === undefined
        ? null
        : {
            messageId: str(row.r_message_id),
            type: str(row.r_type) as MiraRecord['type'],
            summary: str(row.r_summary),
            needsUser: bool(row.r_needs_user),
            urgency: str(row.r_urgency) as MiraRecord['urgency'],
            request: optStr(row.r_request),
            amount: optStr(row.r_amount),
            dateText: optStr(row.r_date_text),
            dateAt: optNum(row.r_date_at),
            sensitive: bool(row.r_sensitive),
            instructionLike: bool(row.r_instruction_like),
            duplicateOf: optStr(row.r_duplicate_of),
          },
  };
}

function toDraft(row: Row): Draft {
  return {
    id: str(row.id),
    messageId: str(row.message_id),
    text: str(row.text),
    firstText: str(row.first_text),
    status: str(row.status) as DraftStatus,
  };
}

function toAction(row: Row): Action {
  return {
    id: str(row.id),
    ruleId: optStr(row.rule_id),
    messageId: str(row.message_id),
    kind: str(row.kind) as Action['kind'],
    payload: JSON.parse(str(row.payload)),
    status: str(row.status) as ActionStatus,
    reason: optStr(row.reason),
    createdAt: num(row.created_at),
    doneAt: optNum(row.done_at),
  };
}

function toRule(row: Row): Rule {
  return {
    id: str(row.id),
    sentence: str(row.sentence),
    definition: JSON.parse(str(row.definition)),
    level: str(row.level) as Rule['level'],
    enabled: bool(row.enabled),
    createdAt: num(row.created_at),
  };
}
