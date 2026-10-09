/**
 * The SQLite schema (spec 5.1), as numbered migrations applied at start-up.
 * Never edit a migration once it has shipped to a phone; add a new one.
 * Not yet stored: `memory` (P1) and per-chat switches.
 */

export type Scalar = string | number | null;
export type Row = Record<string, unknown>;

/** The part of a database that storage needs. op-sqlite's `DB` fits it. */
export interface SqlExecutor {
  execute(sql: string, params?: Scalar[]): Promise<{ rows: Row[]; rowsAffected: number }>;
}

export interface SqlDatabase extends SqlExecutor {
  transaction(fn: (tx: SqlExecutor) => Promise<void>): Promise<void>;
}

export const MIGRATIONS: string[][] = [
  // 1: the first schema
  [
    `CREATE TABLE channels (
      package TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      enabled INTEGER NOT NULL,
      level INTEGER NOT NULL
    )`,
    `CREATE TABLE chats (
      id TEXT PRIMARY KEY,
      package TEXT NOT NULL,
      title TEXT NOT NULL,
      kind TEXT NOT NULL
    )`,
    `CREATE TABLE messages (
      id TEXT PRIMARY KEY,
      notification_key TEXT NOT NULL,
      package TEXT NOT NULL,
      chat_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      posted_at INTEGER NOT NULL,
      truncated INTEGER NOT NULL,
      can_reply INTEGER NOT NULL,
      status TEXT NOT NULL
    )`,
    // The same message is never stored twice (spec 4.3).
    'CREATE UNIQUE INDEX messages_identity ON messages (package, chat_id, sender, text, posted_at)',
    'CREATE INDEX messages_package_posted ON messages (package, posted_at)',
    'CREATE INDEX messages_status ON messages (status, posted_at)',
    `CREATE TABLE records (
      message_id TEXT PRIMARY KEY REFERENCES messages (id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      summary TEXT NOT NULL,
      needs_user INTEGER NOT NULL,
      urgency TEXT NOT NULL,
      request TEXT,
      amount TEXT,
      date_text TEXT,
      date_at INTEGER,
      sensitive INTEGER NOT NULL,
      instruction_like INTEGER NOT NULL,
      duplicate_of TEXT
    )`,
    'CREATE INDEX records_type_date ON records (type, date_at)',
    `CREATE TABLE rules (
      id TEXT PRIMARY KEY,
      sentence TEXT NOT NULL,
      definition TEXT NOT NULL,
      level TEXT NOT NULL,
      enabled INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE drafts (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      first_text TEXT NOT NULL,
      status TEXT NOT NULL
    )`,
    'CREATE INDEX drafts_status ON drafts (status)',
    `CREATE TABLE actions (
      id TEXT PRIMARY KEY,
      rule_id TEXT,
      message_id TEXT NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL,
      reason TEXT,
      created_at INTEGER NOT NULL,
      done_at INTEGER
    )`,
    'CREATE INDEX actions_status_created ON actions (status, created_at)',
  ],
  // 2: durable processing durations for Privacy proof; older items have no sample.
  [
    `CREATE TABLE processing_times (
      message_id TEXT PRIMARY KEY REFERENCES messages (id) ON DELETE CASCADE,
      duration_ms REAL NOT NULL CHECK(duration_ms >= 0)
    )`,
  ],
];

/** Applies every migration newer than the database, each in one transaction. */
export async function migrate(db: SqlDatabase): Promise<void> {
  await db.execute('PRAGMA foreign_keys = ON');
  const { rows } = await db.execute('PRAGMA user_version');
  const current = Number(rows[0]?.user_version ?? 0);

  for (let version = current + 1; version <= MIGRATIONS.length; version++) {
    await db.transaction(async tx => {
      for (const statement of MIGRATIONS[version - 1]) {
        await tx.execute(statement);
      }
      // PRAGMA takes no parameters; `version` is a loop counter, not input.
      await tx.execute(`PRAGMA user_version = ${version}`);
    });
  }
}
