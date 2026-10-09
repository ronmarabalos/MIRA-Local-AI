import { createStore } from '../src/services/db/store';
import {
  migrate,
  type Row,
  type Scalar,
  type SqlDatabase,
} from '../src/services/db/schema';

export async function testStore() {
  const { DatabaseSync } = require('node:sqlite');
  const raw = new DatabaseSync(':memory:');
  const execute = async (sql: string, params: Scalar[] = []) => {
    const statement = raw.prepare(sql);
    return statement.columns().length
      ? { rows: statement.all(...params) as Row[], rowsAffected: 0 }
      : { rows: [], rowsAffected: Number(statement.run(...params).changes) };
  };
  const db: SqlDatabase = {
    execute,
    async transaction(fn) {
      raw.exec('BEGIN');
      try {
        await fn({ execute });
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
  };
  await migrate(db);
  return { store: createStore(db), close: () => raw.close() };
}
