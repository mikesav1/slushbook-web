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
    # Structure matches exact specification:
    # {name, brix, volume_ml, category, keywords, country, alcohol_vol}
    sample_ingredients = [
        {
            "name": "Marie Brizard Rørsukkersirup",
            "brix": 63,
            "volume_ml": 1000,
            "category": "sirup",
            "keywords": ["sukkerlage", "rørsukker", "marie brizard", "canesugar", "pure sugar syrup"],
            "country": ["DK", "FR"],
            "alcohol_vol": None
        },
        {
            "name": "Jordbær sirup",
            "brix": 65,
            "volume_ml": 700,
            "category": "sirup",
            "keywords": ["jordbær", "bær", "strawberry", "frugt"],
            "country": ["DK"],
            "alcohol_vol": None
        },
        {
            "name": "Vand",
            "brix": 0,
            "volume_ml": None,
            "category": "base",
            "keywords": ["vand", "water", "base", "neutral"],
            "country": ["DK"],
            "alcohol_vol": None
        },
        {
            "name": "Citron juice",
            "brix": 2,
            "volume_ml": 500,
            "category": "juice",
            "keywords": ["citron", "lemon", "syre", "juice", "citrus"],
            "country": ["DK"],
            "alcohol_vol": None
        },
        {
            "name": "Hindbær sirup",
            "brix": 64,
            "volume_ml": 700,
            "category": "sirup",
            "keywords": ["hindbær", "raspberry", "bær", "frugt"],
            "country": ["DK"],
            "alcohol_vol": None
        },
        {
            "name": "Vodka",
            "brix": 0,
            "volume_ml": 700,
            "category": "spiritus",
            "keywords": ["vodka", "alkohol", "spiritus", "neutral"],
            "country": ["DK", "RU"],
            "alcohol_vol": 40
        },
        {
            "name": "Baileys",
            "brix": 25,
            "volume_ml": 700,
            "category": "likør",
            "keywords": ["baileys", "likør", "cream", "irish", "kaffe"],
            "country": ["IE"],
            "alcohol_vol": 17
        },
        {
            "name": "Mælk",
            "brix": 5,
            "volume_ml": 1000,
            "category": "base",
            "keywords": ["mælk", "milk", "dairy", "cremet"],
            "country": ["DK"],
            "alcohol_vol": None
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
