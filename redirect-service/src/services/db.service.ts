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

export interface Supplier {
  id: string;
  name: string;
  url: string;
  active: number;
  createdAt: string;
}

export const upsertMapping = (mapping: Mapping): Mapping => {
  const stmt = db.prepare(`
    INSERT INTO mapping (id, name, ean, keywords)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      ean = excluded.ean,
      keywords = excluded.keywords
  `);
  
  stmt.run(mapping.id, mapping.name, mapping.ean || null, mapping.keywords || null);
  return mapping;
};

export const getMapping = (id: string): Mapping | null => {
  const stmt = db.prepare('SELECT * FROM mapping WHERE id = ?');
  return stmt.get(id) as Mapping | null;
};

export const getAllMappings = (): Mapping[] => {
  const stmt = db.prepare('SELECT * FROM mapping');
  return stmt.all() as Mapping[];
};

export const updateMapping = (id: string, updates: Partial<Pick<Mapping, 'name' | 'ean' | 'keywords'>>): Mapping | null => {
  const mapping = getMapping(id);
  if (!mapping) return null;
  
  const stmt = db.prepare(`
    UPDATE mapping SET
      name = COALESCE(?, name),
      ean = COALESCE(?, ean),
      keywords = COALESCE(?, keywords)
    WHERE id = ?
  `);
  
  stmt.run(
    updates.name || null,
    updates.ean !== undefined ? updates.ean : null,
    updates.keywords !== undefined ? updates.keywords : null,
    id
  );
  
  return getMapping(id);
};

export const deleteMapping = (id: string): boolean => {
  const stmt = db.prepare('DELETE FROM mapping WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
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

export const updateOption = (id: string, updates: Partial<Pick<Option, 'supplier' | 'title' | 'url' | 'status' | 'priceLastSeen'>>): Option | null => {
  const option = getOption(id);
  if (!option) return null;
  
  const updatedAt = new Date().toISOString();
  
  const stmt = db.prepare(`
    UPDATE option SET
      supplier = COALESCE(?, supplier),
      title = COALESCE(?, title),
      url = COALESCE(?, url),
      status = COALESCE(?, status),
      priceLastSeen = COALESCE(?, priceLastSeen),
      updatedAt = ?
    WHERE id = ?
  `);
  
  stmt.run(
    updates.supplier || null,
    updates.title || null,
    updates.url || null,
    updates.status || null,
    updates.priceLastSeen !== undefined ? updates.priceLastSeen : null,
    updatedAt,
    id
  );
  
  return getOption(id);
};

export const deleteOption = (id: string): boolean => {
  const stmt = db.prepare('DELETE FROM option WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
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

// ===== SUPPLIER FUNCTIONS =====

export const getAllSuppliers = (): Supplier[] => {
  const stmt = db.prepare('SELECT * FROM supplier ORDER BY name');
  return stmt.all() as Supplier[];
};

export const getActiveSuppliers = (): Supplier[] => {
  const stmt = db.prepare('SELECT * FROM supplier WHERE active = 1 ORDER BY name');
  return stmt.all() as Supplier[];
};

export const getSupplier = (id: string): Supplier | null => {
  const stmt = db.prepare('SELECT * FROM supplier WHERE id = ?');
  return stmt.get(id) as Supplier | null;
};

export const createSupplier = (supplier: Supplier): Supplier => {
  const stmt = db.prepare(`
    INSERT INTO supplier (id, name, url, active, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(supplier.id, supplier.name, supplier.url, supplier.active, supplier.createdAt);
  return supplier;
};

export const updateSupplier = (id: string, updates: Partial<Pick<Supplier, 'name' | 'url' | 'active'>>): Supplier | null => {
  const supplier = getSupplier(id);
  if (!supplier) return null;
  
  const stmt = db.prepare(`
    UPDATE supplier SET
      name = COALESCE(?, name),
      url = COALESCE(?, url),
      active = COALESCE(?, active)
    WHERE id = ?
  `);
  
  stmt.run(
    updates.name || null,
    updates.url !== undefined ? updates.url : null,
    updates.active !== undefined ? updates.active : null,
    id
  );
  
  return getSupplier(id);
};

export const deleteSupplier = (id: string): boolean => {
  const stmt = db.prepare('DELETE FROM supplier WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};
