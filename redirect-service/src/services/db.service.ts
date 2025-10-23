import { getDb } from '../db';
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

export const upsertMapping = async (mapping: Mapping): Promise<Mapping> => {
  const db = getDb();
  await db.collection('redirect_mappings').updateOne(
    { id: mapping.id },
    { $set: mapping },
    { upsert: true }
  );
  return mapping;
};

export const getMapping = async (id: string): Promise<Mapping | null> => {
  const db = getDb();
  const result = await db.collection('redirect_mappings').findOne({ id }, { projection: { _id: 0 } });
  return result as Mapping | null;
};

export const getAllMappings = async (): Promise<Mapping[]> => {
  const db = getDb();
  const results = await db.collection('redirect_mappings').find({}, { projection: { _id: 0 } }).toArray();
  return results as unknown as Mapping[];
};

export const updateMapping = async (id: string, updates: Partial<Pick<Mapping, 'name' | 'ean' | 'keywords'>>): Promise<Mapping | null> => {
  const db = getDb();
  const result = await db.collection('redirect_mappings').findOneAndUpdate(
    { id },
    { $set: updates },
    { returnDocument: 'after', projection: { _id: 0 } }
  );
  return result as Mapping | null;
};

export const deleteMapping = async (id: string): Promise<boolean> => {
  const db = getDb();
  const result = await db.collection('redirect_mappings').deleteOne({ id });
  return result.deletedCount > 0;
};

export const upsertOption = async (option: Omit<Option, 'updatedAt'> & { updatedAt?: string }): Promise<Option> => {
  const db = getDb();
  const updatedAt = option.updatedAt || new Date().toISOString();
  const fullOption = { ...option, updatedAt };
  
  await db.collection('redirect_options').updateOne(
    { id: option.id },
    { $set: fullOption },
    { upsert: true }
  );
  
  return fullOption;
};

export const createOption = async (option: Omit<Option, 'updatedAt'> & { updatedAt?: string }): Promise<Option> => {
  const db = getDb();
  const updatedAt = option.updatedAt || new Date().toISOString();
  const fullOption = { ...option, updatedAt };
  
  await db.collection('redirect_options').insertOne(fullOption);
  return fullOption;
};

export const getOptions = async (mappingId: string): Promise<Option[]> => {
  const db = getDb();
  const results = await db.collection('redirect_options').find({ mappingId }, { projection: { _id: 0 } }).toArray();
  return results as unknown as Option[];
};

export const getOption = async (id: string): Promise<Option | null> => {
  const db = getDb();
  const result = await db.collection('redirect_options').findOne({ id }, { projection: { _id: 0 } });
  return result as Option | null;
};

export const updateOption = async (id: string, updates: Partial<Pick<Option, 'supplier' | 'title' | 'url' | 'status' | 'priceLastSeen'>>): Promise<Option | null> => {
  const db = getDb();
  const updatedAt = new Date().toISOString();
  
  const result = await db.collection('redirect_options').findOneAndUpdate(
    { id },
    { $set: { ...updates, updatedAt } },
    { returnDocument: 'after', projection: { _id: 0 } }
  );
  
  return result as Option | null;
};

export const deleteOption = async (id: string): Promise<boolean> => {
  const db = getDb();
  const result = await db.collection('redirect_options').deleteOne({ id });
  return result.deletedCount > 0;
};

export const getActiveOption = async (mappingId: string): Promise<Option | null> => {
  const db = getDb();
  const result = await db.collection('redirect_options')
    .find({ mappingId, status: 'active' })
    .sort({ updatedAt: -1 })
    .limit(1)
    .toArray();
  
  return result.length > 0 ? result[0] as Option : null;
};

export const getAllActiveOptions = async (): Promise<Option[]> => {
  const db = getDb();
  const results = await db.collection('redirect_options').find({ status: 'active' }, { projection: { _id: 0 } }).toArray();
  return results as unknown as Option[];
};

export const logClick = async (click: Omit<Click, 'id' | 'ts'>): Promise<Click> => {
  const db = getDb();
  const id = uuidv4();
  const ts = new Date().toISOString();
  const fullClick = { id, ...click, ts };
  
  await db.collection('redirect_clicks').insertOne(fullClick);
  return fullClick;
};

// ===== SUPPLIER FUNCTIONS =====

export const getAllSuppliers = async (): Promise<Supplier[]> => {
  const db = getDb();
  const results = await db.collection('redirect_suppliers').find({}, { projection: { _id: 0 } }).sort({ name: 1 }).toArray();
  return results as unknown as Supplier[];
};

export const getActiveSuppliers = async (): Promise<Supplier[]> => {
  const db = getDb();
  const results = await db.collection('redirect_suppliers').find({ active: 1 }, { projection: { _id: 0 } }).sort({ name: 1 }).toArray();
  return results as unknown as Supplier[];
};

export const getSupplier = async (id: string): Promise<Supplier | null> => {
  const db = getDb();
  const result = await db.collection('redirect_suppliers').findOne({ id }, { projection: { _id: 0 } });
  return result as Supplier | null;
};

export const createSupplier = async (supplier: Supplier): Promise<Supplier> => {
  const db = getDb();
  await db.collection('redirect_suppliers').insertOne(supplier);
  return supplier;
};

export const updateSupplier = async (id: string, updates: Partial<Pick<Supplier, 'name' | 'url' | 'active'>>): Promise<Supplier | null> => {
  const db = getDb();
  const result = await db.collection('redirect_suppliers').findOneAndUpdate(
    { id },
    { $set: updates },
    { returnDocument: 'after', projection: { _id: 0 } }
  );
  
  return result as Supplier | null;
};

export const deleteSupplier = async (id: string): Promise<boolean> => {
  const db = getDb();
  const result = await db.collection('redirect_suppliers').deleteOne({ id });
  return result.deletedCount > 0;
};
