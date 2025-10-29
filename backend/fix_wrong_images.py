import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Corrected images for recipes with wrong pictures
CORRECTED_IMAGES = {
    # Missing photos or wrong images
    "Peach Paradise": "https://images.unsplash.com/photo-1627308595171-d1b5d67129c4?w=400&h=600&fit=crop",  # Peach drink
    "Energy Blue Slush": "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=600&fit=crop",  # Blue energy drink
    "Long Island Iced Tea Slush": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=600&fit=crop",  # Iced tea cocktail
    
    # Pizza/wrong images
    "Watermelon Slush": "https://images.unsplash.com/photo-1587049352846-4a222e784715?w=400&h=600&fit=crop",  # Watermelon drink
    "Coconut Dream Smoothie": "https://images.unsplash.com/photo-1546173159-315724a31696?w=400&h=600&fit=crop",  # Coconut smoothie bowl
    "Green Apple Slush": "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=600&fit=crop",  # Green apple drink
    
    # Desert/field/cruise/magnifying glass
    "Frozen Bellini (18+)": "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&h=600&fit=crop",  # Bellini cocktail
    "Frozen Margarita": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=600&fit=crop",  # Margarita
    "Frozen Mojito": "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=600&fit=crop",  # Mojito drink
    "Aperol Spritz Slush": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&h=600&fit=crop",  # Aperol spritz
}

async def fix_wrong_images():
    mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.getenv('DB_NAME', 'test_database')
    db = client[db_name]
    
    print("🔧 Fixing recipes with wrong/missing images...")
    print("="*100)
    
    updated = 0
    not_found = 0
    
    for recipe_name, new_url in CORRECTED_IMAGES.items():
        result = await db.recipes.update_one(
            {"name": recipe_name},
            {"$set": {"image_url": new_url}}
        )
        
        if result.matched_count > 0:
            print(f"✅ Fixed: {recipe_name}")
            print(f"   New URL: {new_url}\n")
            updated += 1
        else:
            print(f"❌ NOT FOUND: {recipe_name}\n")
            not_found += 1
    
    print("="*100)
    print(f"\n✅ Successfully fixed {updated} recipes")
    if not_found > 0:
        print(f"⚠️  Could not find {not_found} recipes")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_wrong_images())
