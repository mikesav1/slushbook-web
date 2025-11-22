#!/usr/bin/env python3
"""
Export ALL recipe data (complete recipes with translations) to JSON
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
    
    # Fetch ALL recipes with ALL fields (except _id)
    recipes = await db.recipes.find({}, {"_id": 0}).to_list(None)
    
    print(f"📚 Found {len(recipes)} recipes")
    
    # Create export data
    export_data = {
        "version": "2.0",
        "type": "complete_recipes",
        "exported_at": "2024-11-22",
        "total_recipes": len(recipes),
        "recipes": recipes
    }
    
    # Write to JSON file
    output_file = '/app/complete_recipes_export.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Exported to: {output_file}")
    
    file_size = os.path.getsize(output_file) / (1024 * 1024)  # MB
    print(f"📊 File size: {file_size:.1f} MB")
    
    if recipes:
        sample = recipes[0]
        print(f"\n📝 Sample recipe: {sample.get('name')}")
        print(f"   Fields: {len(sample)} fields")
        print(f"   Has translations: {'translations' in sample}")
        print(f"   Has ingredients: {len(sample.get('ingredients', []))} ingredients")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
