#!/usr/bin/env python3
"""
Add sample ingredients to MongoDB ingredients collection.
You can edit this file to add your own ingredients.
"""

import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load environment variables
load_dotenv(Path(__file__).parent / '.env')

async def add_sample_ingredients():
    """Add sample ingredients to the database"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Connected to database: {db_name}")
    
    # Sample ingredients - EDIT THIS LIST TO ADD YOUR OWN
    sample_ingredients = [
        {
            "name": "Jordbær sirup",
            "brix": 65.0,
            "category": "sirup.baer.jordbaer",
            "keywords": ["jordbær", "bær", "sirup", "frugt", "rød"],
            "description": "Klassisk jordbærsirup til slushice"
        },
        {
            "name": "Vand",
            "brix": 0.0,
            "category": "base.vand",
            "keywords": ["vand", "base", "neutral"],
            "description": "Rent vand eller knust is"
        },
        {
            "name": "Citron juice",
            "brix": 2.5,
            "category": "frugt.citrus.citron",
            "keywords": ["citron", "syre", "juice", "citrus"],
            "description": "Frisk citronsaft for syrlig smag"
        },
        {
            "name": "Sukkersirup",
            "brix": 66.0,
            "category": "sirup.basis",
            "keywords": ["sukker", "sirup", "sød", "basis"],
            "description": "Standard sukkersirup (2:1 sukker:vand)"
        },
        {
            "name": "Hindbær sirup",
            "brix": 64.0,
            "category": "sirup.baer.hindbaer",
            "keywords": ["hindbær", "bær", "sirup", "frugt", "rød"],
            "description": "Hindbærsirup med intens bærsmag"
        },
        {
            "name": "Blåbær sirup",
            "brix": 63.0,
            "category": "sirup.baer.blabaer",
            "keywords": ["blåbær", "bær", "sirup", "frugt", "blå"],
            "description": "Blåbærsirup med naturlig farve"
        },
        {
            "name": "Mælk",
            "brix": 5.0,
            "category": "base.maelk",
            "keywords": ["mælk", "dairy", "cremet"],
            "description": "Sødmælk til milkshake-slush"
        },
        {
            "name": "Lime juice",
            "brix": 2.0,
            "category": "frugt.citrus.lime",
            "keywords": ["lime", "syre", "juice", "citrus", "grøn"],
            "description": "Frisk limesaft for syrlig-frisk smag"
        }
    ]
    
    # Check if ingredients already exist
    existing_count = await db.ingredients.count_documents({})
    
    if existing_count > 0:
        print(f"\n⚠️  Found {existing_count} existing ingredients in database.")
        response = input("Do you want to add more? (yes/no): ")
        if response.lower() not in ['yes', 'y', 'ja', 'j']:
            print("Cancelled.")
            client.close()
            return
    
    # Insert ingredients
    try:
        result = await db.ingredients.insert_many(sample_ingredients)
        print(f"\n✅ Successfully added {len(result.inserted_ids)} ingredients!")
        
        # Show what was added
        print("\nAdded ingredients:")
        for ing in sample_ingredients:
            print(f"  • {ing['name']} ({ing['brix']}°Bx)")
        
        # Show total count
        total = await db.ingredients.count_documents({})
        print(f"\n📊 Total ingredients in database: {total}")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
    
    client.close()

if __name__ == "__main__":
    print("=" * 60)
    print("SlushBook - Add Sample Ingredients")
    print("=" * 60)
    asyncio.run(add_sample_ingredients())
