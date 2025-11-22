#!/usr/bin/env python3
"""
Import complete recipes from JSON export
This will REPLACE all recipes in the target database
"""

import asyncio
import json
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'flavor_sync')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"🔗 Connected to database: {db_name}")
    
    # Read JSON file
    input_file = '/app/complete_recipes_export.json'
    
    if not os.path.exists(input_file):
        print(f"❌ File not found: {input_file}")
        print(f"   Please upload the complete_recipes_export.json file first!")
        return
    
    print(f"📂 Reading: {input_file}")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    recipes_data = data.get('recipes', [])
    print(f"📚 Found {len(recipes_data)} recipes in file")
    
    # Ask for confirmation
    print(f"\n⚠️  WARNING: This will update/create recipes in '{db_name}' database")
    print(f"   Existing recipes with same ID will be REPLACED")
    print(f"   New recipes will be CREATED")
    
    response = input(f"\n   Continue? (yes/no): ")
    
    if response.lower() != 'yes':
        print("❌ Cancelled")
        return
    
    print(f"\n{'='*60}")
    
    # Process each recipe
    created = 0
    updated = 0
    errors = 0
    
    for recipe_data in recipes_data:
        recipe_id = recipe_data.get('id')
        recipe_name = recipe_data.get('name', 'Unknown')
        
        if not recipe_id:
            print(f"  ⚠️  Skipping {recipe_name} (no ID)")
            errors += 1
            continue
        
        try:
            # Check if exists
            existing = await db.recipes.find_one({'id': recipe_id})
            
            if existing:
                # Update (replace)
                await db.recipes.replace_one(
                    {'id': recipe_id},
                    recipe_data
                )
                updated += 1
                print(f"  ✅ Updated: {recipe_name}")
            else:
                # Create new
                await db.recipes.insert_one(recipe_data)
                created += 1
                print(f"  ✨ Created: {recipe_name}")
                
        except Exception as e:
            print(f"  ❌ Error with {recipe_name}: {e}")
            errors += 1
    
    print(f"\n{'='*60}")
    print(f"✨ Created: {created} new recipes")
    print(f"✅ Updated: {updated} existing recipes")
    if errors > 0:
        print(f"❌ Errors: {errors}")
    print(f"{'='*60}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
