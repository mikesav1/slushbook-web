#!/usr/bin/env python3
"""
Script to update all existing recipes with translations from recipe_translations.json
"""

import os
import json
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment
load_dotenv()

async def update_translations():
    # Connect to MongoDB
    MONGO_URL = os.environ.get('MONGO_URL')
    if not MONGO_URL:
        print("❌ MONGO_URL not found in environment")
        return
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['slushbook']
    
    # Load translations
    translations_file = '/app/backend/recipe_translations.json'
    if not os.path.exists(translations_file):
        print(f"❌ Translations file not found: {translations_file}")
        return
    
    print(f"📂 Loading translations from {translations_file}...")
    with open(translations_file, 'r', encoding='utf-8') as f:
        recipe_translations = json.load(f)
    
    print(f"✅ Loaded {len(recipe_translations)} recipe translations\n")
    
    # Get all system recipes
    recipes = await db.recipes.find({'author': 'system'}).to_list(length=None)
    print(f"📊 Found {len(recipes)} system recipes in database\n")
    
    if not recipes:
        print("⚠️  No recipes found in database to update")
        return
    
    updated_count = 0
    not_found_count = 0
    
    for recipe in recipes:
        recipe_name = recipe.get('name')
        recipe_id = recipe.get('id')
        
        # Find translation by name
        translation_data = None
        for trans_id, trans_data in recipe_translations.items():
            if trans_data['name'] == recipe_name:
                translation_data = trans_data
                break
        
        if translation_data:
            # Update recipe with translations
            result = await db.recipes.update_one(
                {'_id': recipe['_id']},
                {'$set': {'translations': translation_data['translations']}}
            )
            
            if result.modified_count > 0:
                updated_count += 1
                print(f"✅ {recipe_name}")
            else:
                print(f"⚠️  {recipe_name} - not modified (maybe already updated?)")
        else:
            not_found_count += 1
            print(f"❌ {recipe_name} - no translation found")
    
    print(f"\n{'='*60}")
    print(f"📊 Summary:")
    print(f"   Updated: {updated_count}")
    print(f"   Not found in translations: {not_found_count}")
    print(f"   Total processed: {len(recipes)}")
    print(f"{'='*60}")
    
    # Close connection
    client.close()

if __name__ == '__main__':
    asyncio.run(update_translations())
