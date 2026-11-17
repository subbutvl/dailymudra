import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

/**
 * Single on-device database (docs/SPEC.md §1.3). Schema version lives in
 * PRAGMA user_version; each entry in MIGRATIONS moves it up by one.
 */
const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS sessions (
     id            INTEGER PRIMARY KEY AUTOINCREMENT,
     mudra_id      TEXT    NOT NULL,
     started_at    INTEGER NOT NULL,
     ended_at      INTEGER NOT NULL,
     planned_sec   INTEGER NOT NULL,
     practiced_sec INTEGER NOT NULL,
     completed     INTEGER NOT NULL,
     local_day     TEXT    NOT NULL
   );
   CREATE INDEX IF NOT EXISTS idx_sessions_day ON sessions(local_day);`,
];

let db: SQLiteDatabase | null = null;

export function getDb(): SQLiteDatabase {
  if (!db) {
    db = openDatabaseSync('dailymudra.db');
    migrate(db);
  }
  return db;
}

function migrate(database: SQLiteDatabase) {
  const row = database.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    const sql = MIGRATIONS[version];
    database.withTransactionSync(() => {
      database.execSync(sql);
      database.execSync(`PRAGMA user_version = ${version + 1}`);
    });
    version += 1;
  }
}
