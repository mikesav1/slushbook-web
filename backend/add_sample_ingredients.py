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
    
    # Sample ingredients - COMPLETE STRUCTURE WITH 5-LANGUAGE KEYWORDS
    # Structure: {name, brix, volume_ml, category, keywords{da,de,fr,en_uk,en_us}, country, alcohol_vol, links}
    sample_ingredients = [
        {
            "name": "Marie Brizard Rørsukkersirup",
            "brix": 63,
            "volume_ml": 1000,
            "category": "sirup",
            "keywords": {
                "da": ["sukkerlage", "rørsukker", "marie brizard", "canesugar", "pure sugar syrup"],
                "de": ["zuckersirup", "rohrzucker"],
                "fr": ["sirop de sucre", "marie brizard"],
                "en_uk": ["sugar syrup", "pure cane sugar syrup"],
                "en_us": ["simple syrup", "pure cane sugar syrup"]
            },
            "country": ["DK", "FR"],
            "alcohol_vol": None,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Monin Blue Curaçao Sirup",
            "brix": None,
            "volume_ml": 700,
            "category": "sirup",
            "keywords": {
                "da": ["blå curaçao", "blue curacao", "curaçao sirup"],
                "de": ["blau curaçao sirup"],
                "fr": ["sirop curaçao bleu"],
                "en_uk": ["blue curacao syrup"],
                "en_us": ["blue curacao syrup"]
            },
            "country": ["DK"],
            "alcohol_vol": None,
            "links": {
                "DK": "https://barshopen.dk/da/barudstyr/mixers-og-sirup/monin-blue-curacao-70-cl/",
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Chokolade Sirup",
            "brix": None,
            "volume_ml": None,
            "category": "sirup",
            "keywords": {
                "da": ["chokolade sirup"],
                "de": ["schokoladensirup"],
                "fr": ["sirop chocolat"],
                "en_uk": ["chocolate syrup"],
                "en_us": ["chocolate syrup"]
            },
            "country": ["DK"],
            "alcohol_vol": None,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Mynte Sirup",
            "brix": None,
            "volume_ml": None,
            "category": "sirup",
            "keywords": {
                "da": ["mynte sirup"],
                "de": ["minzsirup"],
                "fr": ["sirop menthe"],
                "en_uk": ["mint syrup"],
                "en_us": ["mint syrup"]
            },
            "country": ["DK"],
            "alcohol_vol": None,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Mountain Dew",
            "brix": None,
            "volume_ml": 330,
            "category": "sodavand",
            "keywords": {
                "da": ["mountain dew"],
                "de": ["mountain dew"],
                "fr": ["mountain dew"],
                "en_uk": ["mountain dew"],
                "en_us": ["mountain dew"]
            },
            "country": ["DK", "US"],
            "alcohol_vol": None,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Vand",
            "brix": 0,
            "volume_ml": None,
            "category": "base",
            "keywords": {
                "da": ["vand"],
                "de": ["wasser"],
                "fr": ["eau"],
                "en_uk": ["water"],
                "en_us": ["water"]
            },
            "country": ["DK"],
            "alcohol_vol": None,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Vodka",
            "brix": 0,
            "volume_ml": 700,
            "category": "spiritus",
            "keywords": {
                "da": ["vodka", "spiritus"],
                "de": ["wodka", "spiritus"],
                "fr": ["vodka", "spiritueux"],
                "en_uk": ["vodka", "spirits"],
                "en_us": ["vodka", "spirits"]
            },
            "country": ["DK", "RU"],
            "alcohol_vol": 40,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Baileys",
            "brix": 25,
            "volume_ml": 700,
            "category": "likør",
            "keywords": {
                "da": ["baileys", "likør", "cream"],
                "de": ["baileys", "likör", "sahne"],
                "fr": ["baileys", "liqueur", "crème"],
                "en_uk": ["baileys", "liqueur", "cream"],
                "en_us": ["baileys", "liqueur", "cream"]
            },
            "country": ["IE"],
            "alcohol_vol": 17,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
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
