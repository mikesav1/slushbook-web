#!/usr/bin/env python3
"""
Export all recipe translations to a JSON file for import to production
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
    
    # Fetch all recipes with only translations
    recipes = await db.recipes.find(
        {}, 
        {"_id": 0, "id": 1, "name": 1, "translations": 1}
    ).to_list(None)
    
    print(f"📚 Found {len(recipes)} recipes")
    
    # Create export data
    export_data = {
        "version": "1.0",
        "exported_at": "2024-11-21",
        "total_recipes": len(recipes),
        "recipes": recipes
    }
    
    # Write to JSON file
    output_file = '/app/recipe_translations_export.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Exported to: {output_file}")
    print(f"📊 File size: {os.path.getsize(output_file) / 1024:.1f} KB")
    
    # Show sample
    if recipes:
        sample = recipes[0]
        langs = list(sample.get('translations', {}).keys())
        print(f"\n📝 Sample: {sample['name']}")
        print(f"   Languages: {', '.join(langs)}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
