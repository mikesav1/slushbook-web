import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '..', 'data.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS mapping (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    ean TEXT
  );

  CREATE TABLE IF NOT EXISTS option (
    id TEXT PRIMARY KEY,
    mappingId TEXT NOT NULL,
    supplier TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN('active','inactive')),
    priceLastSeen REAL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY(mappingId) REFERENCES mapping(id)
  );

  CREATE TABLE IF NOT EXISTS click (
    id TEXT PRIMARY KEY,
    mappingId TEXT NOT NULL,
    ts TEXT NOT NULL,
    userAgent TEXT,
    referer TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_option_mapping ON option(mappingId);
  CREATE INDEX IF NOT EXISTS idx_option_status ON option(status);
  CREATE INDEX IF NOT EXISTS idx_click_mapping ON click(mappingId);
`);

export default db;