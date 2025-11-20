#!/usr/bin/env python3
"""
Import translated recipe data from CSV and update database
"""

import csv
import json
from pymongo import MongoClient

# CSV file path
csv_filename = '/app/recipe_translations_import.csv'

print("📂 Indlæser CSV fil...")

# Read CSV
recipes_data = {}

with open(csv_filename, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    
    for row in reader:
        recipe_id = row['Recipe ID']
        recipe_name = row['Recipe Name']
        field_type = row['Field Type']
        step_num = row['Step Number']
        
        # Initialize recipe if not exists
        if recipe_id not in recipes_data:
            recipes_data[recipe_id] = {
                'name': recipe_name,
                'translations': {
                    'da': {'name': recipe_name, 'description': '', 'steps': []},
                    'de': {'name': recipe_name, 'description': '', 'steps': []},
                    'fr': {'name': recipe_name, 'description': '', 'steps': []},
                    'en': {'name': recipe_name, 'description': '', 'steps': []},
                    'en_us': {'name': recipe_name, 'description': '', 'steps': []}
                }
            }
        
        # Add data
        if field_type == 'Description':
            recipes_data[recipe_id]['translations']['da']['description'] = row['Danish (DA)']
            recipes_data[recipe_id]['translations']['de']['description'] = row['German (DE)']
            recipes_data[recipe_id]['translations']['fr']['description'] = row['French (FR)']
            recipes_data[recipe_id]['translations']['en']['description'] = row['English UK (EN)']
            recipes_data[recipe_id]['translations']['en_us']['description'] = row['English US (EN_US)']
        
        elif field_type == 'Step':
            recipes_data[recipe_id]['translations']['da']['steps'].append(row['Danish (DA)'])
            recipes_data[recipe_id]['translations']['de']['steps'].append(row['German (DE)'])
            recipes_data[recipe_id]['translations']['fr']['steps'].append(row['French (FR)'])
            recipes_data[recipe_id]['translations']['en']['steps'].append(row['English UK (EN)'])
            recipes_data[recipe_id]['translations']['en_us']['steps'].append(row['English US (EN_US)'])

print(f"✅ Indlæst {len(recipes_data)} opskrifter fra CSV\n")

# Update MongoDB
print("📤 Opdaterer database...")

client = MongoClient('mongodb://localhost:27017')
db = client['flavor_sync']

updated_count = 0

for recipe_id, recipe_data in recipes_data.items():
    recipe_name = recipe_data['name']
    translations = recipe_data['translations']
    
    result = db.recipes.update_one(
        {'name': recipe_name},
        {'$set': {'translations': translations}}
    )
    
    if result.matched_count > 0:
        updated_count += 1
        if updated_count % 10 == 0:
            print(f"✓ Opdateret {updated_count}/{len(recipes_data)}...")

print(f"\n✅ Opdateret {updated_count} opskrifter i databasen!")

# Also save to JSON for backup
json_filename = '/app/backend/recipe_translations.json'
json_data = {}

for recipe_id, recipe_data in recipes_data.items():
    json_data[recipe_id] = recipe_data

with open(json_filename, 'w', encoding='utf-8') as f:
    json.dump(json_data, f, ensure_ascii=False, indent=2)

print(f"✅ Også gemt til {json_filename} som backup")
print(f"\n🎉 Import komplet! Oversættelserne er nu opdateret.")
