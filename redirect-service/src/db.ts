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
  
  // Seed default mappings if collection is empty
  const mappingCount = await db.collection('redirect_mappings').countDocuments();
  if (mappingCount === 0) {
    const defaultMappings = [
      { id: 'sodastream-pepsi-440ml', name: 'SodaStream Pepsi 440 ml', keywords: 'pepsi,cola,sodastream pepsi', createdAt: new Date().toISOString() },
      { id: 'sodastream-7up-free-440ml', name: 'SodaStream 7UP Free 440 ml', keywords: '7up,7-up,seven up,lemon,lime,sodastream 7up', createdAt: new Date().toISOString() },
      { id: 'power-flavours-category', name: 'Power Smagsekstrakter (kategori)', keywords: 'sirup,syrup,smagsekstrakt,flavour,smag', createdAt: new Date().toISOString() },
      { id: 'blaa-curacao-sirup', name: 'Blå curaçao sirup', keywords: 'curaçao,curacao,blå,blue,blå curaçao,blue curacao', createdAt: new Date().toISOString() }
    ];
    
    await db.collection('redirect_mappings').insertMany(defaultMappings);
  }
  
  // Seed default options if collection is empty
  const optionCount = await db.collection('redirect_options').countDocuments();
  if (optionCount === 0) {
    const defaultOptions = [
      { id: 'opt_pepsi_power', mappingId: 'sodastream-pepsi-440ml', supplier: 'power', title: 'SodaStream Pepsi 440 ml', url: 'https://www.power.dk/koekken-og-madlavning/vand-og-juice/smagsekstrakter/sodastream-pepsi-440-ml/p-1168002/', status: 'active', createdAt: new Date().toISOString() },
      { id: 'opt_7up_power', mappingId: 'sodastream-7up-free-440ml', supplier: 'power', title: 'SodaStream 7UP Free 440 ml', url: 'https://www.power.dk/koekken-og-madlavning/vand-og-juice/smagsekstrakter/sodastream-7up-free-440-ml/p-1168005/', status: 'active', createdAt: new Date().toISOString() },
      { id: 'opt_category_power', mappingId: 'power-flavours-category', supplier: 'power', title: 'Smagsekstrakter (kategori)', url: 'https://www.power.dk/c/7806/koekken-og-madlavning/vand-og-juice/smagsekstrakter/', status: 'active', createdAt: new Date().toISOString() },
      { id: 'opt_curacao_barshopen', mappingId: 'blaa-curacao-sirup', supplier: 'barshopen', title: 'Monin Blue Curaçao Sirup 70 cl', url: 'https://barshopen.dk/da/barudstyr/mixers-og-sirup/monin-blue-curacao-70-cl/', status: 'active', createdAt: new Date().toISOString() }
    ];
    
    await db.collection('redirect_options').insertMany(defaultOptions);
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