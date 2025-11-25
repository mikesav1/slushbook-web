"""
Add Monin Strawberry Syrup to ingredients collection
Data source: Monin Strawberry Syrup product specification, 10/03/2021
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def add_strawberry_syrup():
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client.slushbook
    
    # Complete Jordbær Sirup data from Monin specification
    strawberry_syrup = {
        "name": "Jordbær Sirup",
        "brand": "Monin",
        "category": "sirup",
        "brix": 64.4,
        "density_g_per_ml": 1.31,
        "ph": 2.9,
        "water_activity": 0.849,
        "carbs_g_per_100ml": 83.7,
        "sugars_g_per_100ml": 83.6,
        "energy_kcal_per_100ml": 339,
        "juice_content_percent": 18,
        "dilution_recommendation": "1+8 (1 del sirup til 8 dele væske)",
        "alcohol_vol": 0,
        "country": ["FR", "DK"],
        "keywords": {
            "da": [
                "jordbær sirup",
                "jordbærsirup",
                "monin jordbær",
                "monin strawberry"
            ],
            "de": [
                "erdbeer sirup",
                "erdbeersirup",
                "monin erdbeer"
            ],
            "fr": [
                "sirop fraise",
                "sirop de fraise",
                "monin fraise"
            ],
            "en_uk": [
                "strawberry syrup",
                "strawberry flavour syrup",
                "monin strawberry syrup"
            ],
            "en_us": [
                "strawberry syrup",
                "strawberry flavored syrup",
                "monin strawberry syrup"
            ]
        },
        "links": {
            "DK": None,
            "DE": None,
            "FR": None,
            "EN_UK": None,
            "EN_US": None
        },
        "brix_source": "Monin Strawberry Syrup product specification, 10/03/2021"
    }
    
    # Check if it already exists
    existing = await db.ingredients.find_one({"name": "Jordbær Sirup"})
    
    if existing:
        # Update existing
        result = await db.ingredients.update_one(
            {"name": "Jordbær Sirup"},
            {"$set": strawberry_syrup}
        )
        print(f"✅ Updated existing Jordbær Sirup")
        print(f"   Modified count: {result.modified_count}")
    else:
        # Insert new
        result = await db.ingredients.insert_one(strawberry_syrup)
        print(f"✅ Added new Jordbær Sirup")
        print(f"   Inserted ID: {result.inserted_id}")
    
    # Verify the data
    print("\n📊 Verifying data in database:")
    ingredient = await db.ingredients.find_one({"name": "Jordbær Sirup"}, {"_id": 0})
    if ingredient:
        print(f"   Name: {ingredient['name']}")
        print(f"   Brand: {ingredient.get('brand', 'N/A')}")
        print(f"   Category: {ingredient['category']}")
        print(f"   Brix: {ingredient['brix']}°Bx")
        print(f"   Density: {ingredient.get('density_g_per_ml', 'N/A')} g/cm³")
        print(f"   pH: {ingredient.get('ph', 'N/A')}")
        print(f"   Source: {ingredient.get('brix_source', 'N/A')}")
        print(f"   Keywords (DA): {', '.join(ingredient['keywords']['da'])}")
    
    # Show total count
    total = await db.ingredients.count_documents({})
    print(f"\n📦 Total ingredients in database: {total}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_strawberry_syrup())
