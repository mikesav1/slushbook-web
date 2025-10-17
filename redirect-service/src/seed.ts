import db from './db';
import * as dbService from './services/db.service';
import * as fs from 'fs';
import * as path from 'path';

const seedPath = path.join(__dirname, '..', 'seed.json');

if (!fs.existsSync(seedPath)) {
  console.error('seed.json not found!');
  process.exit(1);
}

const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

console.log('Seeding database...');

// Insert mappings
for (const mapping of seedData.mapping) {
  dbService.upsertMapping(mapping);
  console.log(`✓ Mapping: ${mapping.id}`);
}

// Insert options
for (const option of seedData.options) {
  dbService.upsertOption(option);
  console.log(`✓ Option: ${option.id}`);
}

console.log('\nSeeding complete!');
process.exit(0);