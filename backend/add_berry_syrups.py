"""
Add/update Monin syrups to ingredients collection with verified data
Berry syrups (Jordbær, Hindbær, Blåbær) + Citrus syrups (Citron, Lime)
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def add_monin_syrups():
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'slushbook')
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Connected to database: {db_name}")
    
    berry_syrups = [
        {
            "name": "Jordbær Sirup",
            "brand": "Monin",
            "brix": 64.4,
            "volume_ml": None,
            "category": "sirup",
            "density_g_per_ml": 1.31,
            "ph": 2.9,
            "water_activity": 0.849,
            "carbs_g_per_100ml": 83.7,
            "sugars_g_per_100ml": 83.6,
            "energy_kcal_per_100ml": 339,
            "juice_content_percent": 18,
            "dilution_recommendation": "1+8 (1 del sirup til 8 dele væske)",
            "keywords": {
                "da": ["jordbær sirup", "jordbærsirup", "monin jordbær", "monin strawberry"],
                "de": ["erdbeer sirup", "erdbeersirup", "monin erdbeer"],
                "fr": ["sirop fraise", "sirop de fraise", "monin fraise"],
                "en_uk": ["strawberry syrup", "strawberry flavour syrup", "monin strawberry syrup"],
                "en_us": ["strawberry syrup", "strawberry flavored syrup", "monin strawberry syrup"]
            },
            "country": ["FR", "DK"],
            "alcohol_vol": 0,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            },
            "brix_source": "Monin Strawberry Syrup product specification, 10/03/2021"
        },
        {
            "name": "Hindbær Sirup",
            "brand": "Monin",
            "brix": 65.6,
            "volume_ml": None,
            "category": "sirup",
            "density_g_per_ml": 1.319,
            "acidity_g_per_l_citric": 6.2,
            "added_sugar_g_per_l": 843,
            "carbs_g_per_100g": 85.5,
            "sugars_g_per_100g": 85.4,
            "energy_kj_per_100g": 1470,
            "energy_kcal_per_100g": 339,
            "total_juice_percent": 27.6,
            "raspberry_juice_percent": 20.0,
            "ingredient_declaration": "Sugar, water, concentrated raspberry juice, concentrated lemon juice, natural raspberry flavouring, concentrated elderberry juice. Total fruit juice: 27.6%, including 20% raspberry juice.",
            "keywords": {
                "da": ["hindbær sirup", "hindbærsirup", "monin hindbær", "monin raspberry"],
                "de": ["himbeer sirup", "himbeersirup", "monin himbeer"],
                "fr": ["sirop framboise", "sirop de framboise", "monin framboise"],
                "en_uk": ["raspberry syrup", "raspberry flavour syrup", "monin raspberry syrup"],
                "en_us": ["raspberry syrup", "raspberry flavored syrup", "monin raspberry syrup"]
            },
            "country": ["MY", "FR", "DK"],
            "alcohol_vol": 0,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            },
            "brix_source": "Monin Raspberry Syrup 0.7L Product Fact Sheet, Stuart Alexander & Co Pty Ltd, 27.04.2019"
        },
        {
            "name": "Blåbær Sirup",
            "brand": "Monin",
            "brix": 65.3,
            "volume_ml": None,
            "category": "sirup",
            "density_g_per_ml": 1.317,
            "ph": 2.8,
            "carbs_g_per_100ml": 84.9,
            "sugars_g_per_100ml": 84.7,
            "energy_kcal_per_100ml": 339,
            "juice_content_percent": 17,
            "blueberry_juice_percent": 12,
            "keywords": {
                "da": ["blåbær sirup", "blåbærsirup", "monin blåbær"],
                "de": ["heidelbeersirup", "blau beer sirup", "monin heidelbeer"],
                "fr": ["sirop myrtille", "sirop de myrtille", "monin myrtille"],
                "en_uk": ["blueberry syrup", "blueberry flavour syrup", "monin blueberry syrup"],
                "en_us": ["blueberry syrup", "blueberry flavored syrup", "monin blueberry syrup"]
            },
            "country": ["DK", "FR"],
            "alcohol_vol": 0,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            },
            "brix_source": "Monin Blueberry Syrup specification 2018"
        }
    ]
    
    # Insert or update each syrup
    for syrup in berry_syrups:
        existing = await db.ingredients.find_one({"name": syrup["name"]})
        
        if existing:
            # Update
            result = await db.ingredients.update_one(
                {"name": syrup["name"]},
                {"$set": syrup}
            )
            print(f"✅ Updated {syrup['name']} - Brix: {syrup['brix']}°Bx")
        else:
            # Insert
            result = await db.ingredients.insert_one(syrup)
            print(f"✅ Added {syrup['name']} - Brix: {syrup['brix']}°Bx")
    
    # Show total count
    total = await db.ingredients.count_documents({})
    print(f"\n📦 Total ingredients in database: {total}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_berry_syrups())
