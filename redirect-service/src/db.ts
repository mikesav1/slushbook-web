import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '..', 'data.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS supplier (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    url TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS mapping (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    ean TEXT,
    keywords TEXT
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

// Seed default suppliers if table is empty
const supplierCount = db.prepare('SELECT COUNT(*) as count FROM supplier').get() as { count: number };
if (supplierCount.count === 0) {
  const defaultSuppliers = [
    { id: 'power', name: 'Power', url: 'https://www.power.dk', active: 1 },
    { id: 'dorita', name: 'Dorita', url: 'https://www.dorita.dk', active: 1 },
    { id: 'bilka', name: 'Bilka', url: 'https://www.bilka.dk', active: 1 },
    { id: 'foetex', name: 'Føtex', url: 'https://www.foetex.dk', active: 1 },
    { id: 'barshopen', name: 'Barshopen', url: 'https://www.barshopen.dk', active: 1 },
    { id: 'matas', name: 'Matas', url: 'https://www.matas.dk', active: 1 },
    { id: 'nemlig', name: 'Nemlig.com', url: 'https://www.nemlig.com', active: 1 },
    { id: 'andet', name: 'Andet', url: '', active: 1 }
  ];
  
  const insert = db.prepare('INSERT INTO supplier (id, name, url, active, createdAt) VALUES (?, ?, ?, ?, ?)');
  const now = new Date().toISOString();
  
  for (const supplier of defaultSuppliers) {
    insert.run(supplier.id, supplier.name, supplier.url, supplier.active, now);
  }
}

export default db;