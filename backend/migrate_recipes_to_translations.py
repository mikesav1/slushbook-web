"""
Migration script to convert existing recipes to translation structure.
Moves language-specific fields (name, description, steps) into translations.da
Keeps all technical fields at root level.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

async def migrate_recipes():
    """Migrate all system recipes to new translation structure"""
    
    client = AsyncIOMotorClient(MONGO_URL)
    # Use explicit database name - adjust if needed
    db = client.slushbook if 'slushbook' not in MONGO_URL else client.get_default_database()
    
    print("🔄 Starting recipe migration to translation structure...")
    
    # Get all system recipes
    recipes = await db.recipes.find({}, {"_id": 0}).to_list(None)
    
    print(f"📊 Found {len(recipes)} recipes to migrate")
    
    migrated_count = 0
    skipped_count = 0
    
    for recipe in recipes:
        # Skip if already has translations
        if "translations" in recipe:
            print(f"⏭️  Skipping {recipe.get('name')} - already has translations")
            skipped_count += 1
            continue
        
        # Extract language-specific fields
        name = recipe.get("name", "")
        description = recipe.get("description", "")
        steps = recipe.get("steps", [])
        
        # Create translations structure
        translations = {
            "da": {
                "name": name,
                "description": description,
                "steps": steps
            }
        }
        
        # Update recipe with translations
        await db.recipes.update_one(
            {"id": recipe["id"]},
            {
                "$set": {
                    "translations": translations,
                    "default_language": "da"
                },
                # Keep name/description/steps at root for backward compatibility during migration
                # These will be overwritten by apply_translation() in API
            }
        )
        
        print(f"✅ Migrated: {name}")
        migrated_count += 1
    
    print(f"\n🎉 Migration complete!")
    print(f"   Migrated: {migrated_count}")
    print(f"   Skipped: {skipped_count}")
    print(f"   Total: {len(recipes)}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_recipes())
