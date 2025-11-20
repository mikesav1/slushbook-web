#!/usr/bin/env python3
"""
Export all recipe translations from MongoDB to CSV for external translation (e.g., ChatGPT)
"""

import asyncio
import csv
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def export_recipes_to_csv():
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'flavor_sync')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"🔗 Forbinder til database: {db_name}")
    
    # Fetch all recipes from database
    recipes = await db.recipes.find({}, {"_id": 0}).to_list(None)
    
    print(f"📚 Fundet {len(recipes)} opskrifter i databasen")
    
    # Prepare CSV data
    csv_rows = []
    
    # Add header
    csv_rows.append([
        'Recipe ID',
        'Recipe Name',
        'Field Type',
        'Step Number',
        'Danish (DA)',
        'German (DE)',
        'French (FR)',
        'English UK (EN)',
        'English US (EN_US)'
    ])
    
    # For each recipe
    for recipe in recipes:
        recipe_id = recipe.get('id', '')
        recipe_name = recipe.get('name', '')
        translations = recipe.get('translations', {})
        
        # Add description row
        da_trans = translations.get('da', {})
        de_trans = translations.get('de', {})
        fr_trans = translations.get('fr', {})
        en_trans = translations.get('en', {})
        en_us_trans = translations.get('en_us', {})
        
        csv_rows.append([
            recipe_id,
            recipe_name,
            'Description',
            '',
            da_trans.get('description', ''),
            de_trans.get('description', ''),
            fr_trans.get('description', ''),
            en_trans.get('description', ''),
            en_us_trans.get('description', '')
        ])
        
        # Add steps rows
        da_steps = da_trans.get('steps', [])
        de_steps = de_trans.get('steps', [])
        fr_steps = fr_trans.get('steps', [])
        en_steps = en_trans.get('steps', [])
        en_us_steps = en_us_trans.get('steps', [])
        
        max_steps = max(len(da_steps), len(de_steps), len(fr_steps), len(en_steps), len(en_us_steps))
        
        for step_num in range(max_steps):
            csv_rows.append([
                recipe_id,
                recipe_name,
                'Step',
                step_num + 1,
                da_steps[step_num] if step_num < len(da_steps) else '',
                de_steps[step_num] if step_num < len(de_steps) else '',
                fr_steps[step_num] if step_num < len(fr_steps) else '',
                en_steps[step_num] if step_num < len(en_steps) else '',
                en_us_steps[step_num] if step_num < len(en_us_steps) else ''
            ])
    
    # Write to CSV
    csv_filename = '/app/recipe_translations_export.csv'
    with open(csv_filename, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_ALL)
        writer.writerows(csv_rows)
    
    print(f"\n✅ Eksporteret {len(recipes)} opskrifter til CSV")
    print(f"📁 Fil: {csv_filename}")
    print(f"📊 Total rækker: {len(csv_rows)} (inkl. header)")
    print(f"\n📋 Instruktioner:")
    print(f"1. Download CSV filen")
    print(f"2. Åbn i Excel/Google Sheets")
    print(f"3. Brug ChatGPT til at oversætte DE, FR, EN, EN_US kolonnerne")
    print(f"4. Gem som CSV og upload den tilbage")
    print(f"5. Kør import scriptet")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(export_recipes_to_csv())
