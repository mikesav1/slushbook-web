import Database from 'better-sqlite3';
import * as path from 'path';

const dbPath = path.join(__dirname, '../data.db');
const db = new Database(dbPath);

try {
  const rows = db.prepare(`
    SELECT 
      m.id, 
      m.name, 
      m.keywords, 
      o.supplier_id, 
      o.url, 
      o.title 
    FROM mapping m 
    LEFT JOIN option o ON m.id = o.mapping_id 
    WHERE o.is_active = 1 
    ORDER BY m.name, o.supplier_id
  `).all();

  console.log('produkt_navn,keywords,ean,leverandør,url,title');
  
  rows.forEach((row: any) => {
    const keywords = row.keywords ? row.keywords.replace(/,/g, ';') : '';
    console.log(`${row.name},${keywords},,${row.supplier_id},${row.url},${row.title}`);
  });
} catch (error) {
  console.error('Error:', error);
} finally {
  db.close();
}
