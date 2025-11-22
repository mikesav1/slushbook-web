#!/usr/bin/env python3
"""
Test the import endpoint with sample data
"""

import asyncio
import json
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def main():
    # Connect to DB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'flavor_sync')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Read the export file
    with open('/app/complete_recipes_export.json', 'r') as f:
        data = json.load(f)
    
    recipes = data.get('recipes', [])
    
    print(f"Filen har {len(recipes)} opskrifter")
    
    # Validate first recipe
    if recipes:
        first = recipes[0]
        print(f"\nFørste opskrift:")
        print(f"  ID: {first.get('id')}")
        print(f"  Navn: {first.get('name')}")
        print(f"  Har translations: {'translations' in first}")
        if 'translations' in first:
            langs = list(first['translations'].keys())
            print(f"  Sprog: {langs}")
    
    # Check if data structure is correct for endpoint
    print(f"\nData format check:")
    print(f"  Type: {type(recipes)}")
    print(f"  Is list: {isinstance(recipes, list)}")
    if recipes:
        print(f"  First item type: {type(recipes[0])}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
