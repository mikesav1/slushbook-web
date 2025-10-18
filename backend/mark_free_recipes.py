"""
Script to mark first 15 recipes as free (accessible to guests)
and all existing recipes as published
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def mark_free_recipes():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Get all recipes
    recipes = await db.recipes.find().to_list(length=None)
    print(f"Found {len(recipes)} recipes")
    
    # First 15 recipe IDs
    free_recipe_ids = [
        "510561c8-1ac4-429b-b986-6050a8fdfa42",  # Jordbær Klassisk
        "f0c7ce87-6f24-4ba3-a058-d4f4908eead1",  # Blå Hawaii
        "0d354cf0-5b9a-4b5a-bf16-0d15f0902fe6",  # Citron Frisk
        "fc51ea21-f9bd-4b4a-b82b-647e4342719e",  # Cola Original
        "c1089832-c2e0-49cd-afeb-d134d14ae53a",  # Appelsin Sol
        "7dcce30b-38dc-4d2f-9c2a-4aa3393a69c5",  # Hindbær Drøm
        "9d9c9e5f-df9b-411f-951b-18ff4c1ded75",  # Grøn Æble
        "8fe33b23-980a-492b-a685-62669369a0d8",  # Fersken Sommer
        "c5244224-281f-4981-b214-cf14d97817fa",  # Tropisk Paradise
        "b0e2f611-e20d-4ffc-a076-9531f65dd277",  # Kirsebær Luksus
        "52440731-cf50-42c5-a7d2-7d939f3e71c3",  # Vandmelon Splash
        "53c2cd37-0b99-424e-b676-342a62b1047b",  # Ananas Tropical
        "e1bf0fff-f855-481d-b407-44cee020d17b",  # Blåbær Vild
        "42240943-dba0-454c-8c4d-9f7a29de7a76",  # Solbær Intense
        "69f31b3a-72d4-4805-a367-ede097ff06ed",  # Lime Cool
    ]
    
    # Mark first 15 as free
    result = await db.recipes.update_many(
        {"id": {"$in": free_recipe_ids}},
        {"$set": {"is_free": True}}
    )
    print(f"✅ Marked {result.modified_count} recipes as FREE")
    
    # Mark all others as not free
    result = await db.recipes.update_many(
        {"id": {"$nin": free_recipe_ids}},
        {"$set": {"is_free": False}}
    )
    print(f"✅ Marked {result.modified_count} recipes as LOCKED (Pro only)")
    
    # Mark all existing recipes as published (author: system)
    result = await db.recipes.update_many(
        {"author": "system"},
        {"$set": {"is_published": True}}
    )
    print(f"✅ Marked {result.modified_count} system recipes as PUBLISHED")
    
    # Mark user-created recipes as unpublished by default
    result = await db.recipes.update_many(
        {"author": {"$ne": "system"}},
        {"$set": {"is_published": False}}
    )
    print(f"✅ Marked {result.modified_count} user recipes as UNPUBLISHED")
    
    print("\n🎉 Done! Recipe access control setup complete.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(mark_free_recipes())
