#!/usr/bin/env python3
"""
Import recipe translations from JSON file (exported from preview)
Only updates translations field, doesn't change other recipe data
"""

import asyncio
import json
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'flavor_sync')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"🔗 Connected to database: {db_name}")
    
    # Read JSON file
    input_file = '/app/recipe_translations_export.json'
    
    if not os.path.exists(input_file):
        print(f"❌ File not found: {input_file}")
        print(f"   Please upload the file first!")
        return
    
    print(f"📂 Reading: {input_file}")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    recipes_data = data.get('recipes', [])
    print(f"📚 Found {len(recipes_data)} recipes in file")
    
    # Update each recipe's translations
    updated = 0
    not_found = 0
    
    for recipe_data in recipes_data:
        recipe_id = recipe_data.get('id')
        recipe_name = recipe_data.get('name')
        translations = recipe_data.get('translations', {})
        
        if not recipe_id:
            continue
        
        # Check if recipe exists in this database
        existing = await db.recipes.find_one({'id': recipe_id})
        
        if existing:
            # Update only translations
            result = await db.recipes.update_one(
                {'id': recipe_id},
                {'$set': {'translations': translations}}
            )
            
            if result.modified_count > 0:
                updated += 1
                print(f"  ✅ {recipe_name}")
            else:
                print(f"  ⚠️  {recipe_name} (no changes)")
        else:
            not_found += 1
            print(f"  ❌ {recipe_name} (not found in database)")
    
    print(f"\n{'='*60}")
    print(f"✅ Updated: {updated} recipes")
    if not_found > 0:
        print(f"⚠️  Not found: {not_found} recipes (these don't exist in production)")
    print(f"{'='*60}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
