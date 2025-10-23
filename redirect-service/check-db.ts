import Database from 'better-sqlite3';
import * as path from 'path';

const dbPath = path.join(__dirname, '../data.db');
console.log('Database path:', dbPath);

const db = new Database(dbPath);

try {
  // Check tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables);
  
  // Check mapping count
  const mappingCount = db.prepare('SELECT COUNT(*) as count FROM mapping').get();
  console.log('Mapping count:', mappingCount);
  
  // Check option count  
  const optionCount = db.prepare('SELECT COUNT(*) as count FROM option').get();
  console.log('Option count:', optionCount);
  
} catch (error) {
  console.error('Error:', error);
} finally {
  db.close();
}
