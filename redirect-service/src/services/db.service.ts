import db from '../db';
import { v4 as uuidv4 } from 'uuid';

export interface Mapping {
  id: string;
  name: string;
  ean?: string | null;
  keywords?: string | null;
}

export interface Option {
  id: string;
  mappingId: string;
  supplier: string;
  title: string;
  url: string;
  status: 'active' | 'inactive';
  priceLastSeen?: number | null;
  updatedAt: string;
}

export interface Click {
  id: string;
  mappingId: string;
  ts: string;
  userAgent?: string;
  referer?: string;
}

export const upsertMapping = (mapping: Mapping): Mapping => {
  const stmt = db.prepare(`
    INSERT INTO mapping (id, name, ean)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      ean = excluded.ean
  `);
  
  stmt.run(mapping.id, mapping.name, mapping.ean || null);
  return mapping;
};

export const getMapping = (id: string): Mapping | null => {
  const stmt = db.prepare('SELECT * FROM mapping WHERE id = ?');
  return stmt.get(id) as Mapping | null;
};

export const upsertOption = (option: Omit<Option, 'updatedAt'> & { updatedAt?: string }): Option => {
  const updatedAt = option.updatedAt || new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO option (id, mappingId, supplier, title, url, status, priceLastSeen, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      mappingId = excluded.mappingId,
      supplier = excluded.supplier,
      title = excluded.title,
      url = excluded.url,
      status = excluded.status,
      priceLastSeen = excluded.priceLastSeen,
      updatedAt = excluded.updatedAt
  `);
  
  stmt.run(
    option.id,
    option.mappingId,
    option.supplier,
    option.title,
    option.url,
    option.status,
    option.priceLastSeen || null,
    updatedAt
  );
  
  return { ...option, updatedAt };
};

export const getOptions = (mappingId: string): Option[] => {
  const stmt = db.prepare('SELECT * FROM option WHERE mappingId = ?');
  return stmt.all(mappingId) as Option[];
};

export const getOption = (id: string): Option | null => {
  const stmt = db.prepare('SELECT * FROM option WHERE id = ?');
  return stmt.get(id) as Option | null;
};

export const updateOption = (id: string, updates: Partial<Pick<Option, 'status' | 'url' | 'priceLastSeen'>>): Option | null => {
  const option = getOption(id);
  if (!option) return null;
  
  const updatedAt = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE option SET
      status = COALESCE(?, status),
      url = COALESCE(?, url),
      priceLastSeen = COALESCE(?, priceLastSeen),
      updatedAt = ?
    WHERE id = ?
  `);
  
  stmt.run(
    updates.status || null,
    updates.url || null,
    updates.priceLastSeen !== undefined ? updates.priceLastSeen : null,
    updatedAt,
    id
  );
  
  return getOption(id);
};

export const getActiveOption = (mappingId: string): Option | null => {
  const stmt = db.prepare(`
    SELECT * FROM option 
    WHERE mappingId = ? AND status = 'active'
    ORDER BY updatedAt DESC
    LIMIT 1
  `);
  return stmt.get(mappingId) as Option | null;
};

export const getAllActiveOptions = (): Option[] => {
  const stmt = db.prepare(`SELECT * FROM option WHERE status = 'active'`);
  return stmt.all() as Option[];
};

export const logClick = (click: Omit<Click, 'id' | 'ts'>): Click => {
  const id = uuidv4();
  const ts = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO click (id, mappingId, ts, userAgent, referer)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, click.mappingId, ts, click.userAgent || null, click.referer || null);
  
  return { id, ...click, ts };
};
