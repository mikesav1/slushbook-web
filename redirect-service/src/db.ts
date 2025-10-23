import { MongoClient, Db } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'test_database';

let db: Db;
let client: MongoClient;

export const initDb = async (): Promise<Db> => {
  if (db) return db;
  
  client = new MongoClient(MONGO_URL);
  await client.connect();
  db = client.db(DB_NAME);
  
  // Create indexes for better performance
  await db.collection('redirect_mappings').createIndex({ id: 1 }, { unique: true });
  await db.collection('redirect_options').createIndex({ mappingId: 1 });
  await db.collection('redirect_options').createIndex({ status: 1 });
  await db.collection('redirect_clicks').createIndex({ mappingId: 1 });
  await db.collection('redirect_suppliers').createIndex({ id: 1 }, { unique: true });
  
  // Seed default suppliers if collection is empty
  const supplierCount = await db.collection('redirect_suppliers').countDocuments();
  if (supplierCount === 0) {
    const defaultSuppliers = [
      { id: 'power', name: 'Power', url: 'https://www.power.dk', active: 1, createdAt: new Date().toISOString() },
      { id: 'dorita', name: 'Dorita', url: 'https://www.dorita.dk', active: 1, createdAt: new Date().toISOString() },
      { id: 'bilka', name: 'Bilka', url: 'https://www.bilka.dk', active: 1, createdAt: new Date().toISOString() },
      { id: 'foetex', name: 'Føtex', url: 'https://www.foetex.dk', active: 1, createdAt: new Date().toISOString() },
      { id: 'barshopen', name: 'Barshopen', url: 'https://www.barshopen.dk', active: 1, createdAt: new Date().toISOString() },
      { id: 'matas', name: 'Matas', url: 'https://www.matas.dk', active: 1, createdAt: new Date().toISOString() },
      { id: 'nemlig', name: 'Nemlig.com', url: 'https://www.nemlig.com', active: 1, createdAt: new Date().toISOString() },
      { id: 'andet', name: 'Andet', url: '', active: 1, createdAt: new Date().toISOString() }
    ];
    
    await db.collection('redirect_suppliers').insertMany(defaultSuppliers);
  }
  
  return db;
};

export const getDb = (): Db => {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
};

export default { initDb, getDb };