import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Mapping of recipe names to new image URLs
IMAGE_UPDATES = {
    "Jordbær Klassisk": "https://images.unsplash.com/photo-1497534446932-c925b458314e?w=400&h=600&fit=crop",
    "Blå Hawaii": "https://images.unsplash.com/photo-1587888559483-c16e80d8dded?w=400&h=600&fit=crop",
    "Citron Frisk": "https://images.unsplash.com/photo-1575596510825-f748919a2bf7?w=400&h=600&fit=crop",
    "Cola Original": "https://images.unsplash.com/photo-1677948156386-3446fed7aa40?w=400&h=600&fit=crop",
    "Hindbær Drøm": "https://images.unsplash.com/photo-1667328011998-b7556ca3a5af?w=400&h=600&fit=crop",
    "Grøn Æble": "https://images.unsplash.com/photo-1734636957855-ee5fb9394791?w=400&h=600&fit=crop",
    "Fersken Sommer": "https://images.unsplash.com/photo-1745834311095-037ece649a69?w=400&h=600&fit=crop",
    "Tropisk Paradise": "https://images.unsplash.com/photo-1625321643320-5321f48312b2?w=400&h=600&fit=crop",
    "Kirsebær Luksus": "https://images.pexels.com/photos/10802281/pexels-photo-10802281.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Vandmelon Splash": "https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=400&h=600&fit=crop",
    "Ananas Tropical": "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=400&h=600&fit=crop",
    "Blåbær Vild": "https://images.unsplash.com/photo-1559842623-b82d2e1228a5?w=400&h=600&fit=crop",
    "Solbær Intense": "https://images.pexels.com/photos/8084649/pexels-photo-8084649.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Lime Cool": "https://images.unsplash.com/photo-1656057088883-546495ba6945?w=400&h=600&fit=crop",
    "Margarita Ice (18+)": "https://images.unsplash.com/photo-1729615385496-b9091b2823d0?w=400&h=600&fit=crop",
    "Strawberry Daiquiri (18+)": "https://images.unsplash.com/photo-1573500883614-165177fc96ab?w=400&h=600&fit=crop",
    "Blue Lagoon Frozen (18+)": "https://images.unsplash.com/photo-1638176066359-7bcd6289c9d8?w=400&h=600&fit=crop",
    "Sex on the Beach Slush (18+)": "https://images.unsplash.com/photo-1690085602849-4b55549f3103?w=400&h=600&fit=crop",
    "Long Island Iced Tea Frozen (18+)": "https://images.unsplash.com/photo-1626120032630-b51c96a544f5?w=400&h=600&fit=crop",
}

async def fix_images():
    mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client['test_database']
    
    print("🔄 Starting image fix...\n")
    print("="*80)
    
    updated_count = 0
    
    for recipe_name, new_image_url in IMAGE_UPDATES.items():
        result = await db.recipes.update_one(
            {"name": recipe_name},
            {"$set": {"image_url": new_image_url}}
        )
        
        if result.matched_count > 0:
            print(f"✅ Updated: {recipe_name}")
            print(f"   New URL: {new_image_url}\n")
            updated_count += 1
        else:
            print(f"❌ NOT FOUND: {recipe_name}\n")
    
    print("="*80)
    print(f"\n✅ Successfully updated {updated_count} out of {len(IMAGE_UPDATES)} recipes")
    
    # Verify all recipes now have valid images
    recipes = await db.recipes.find().to_list(length=None)
    broken = [r for r in recipes if r.get('image_url', '').startswith('/api/images/')]
    
    print(f"\n📊 Final Status:")
    print(f"   Total recipes: {len(recipes)}")
    print(f"   With broken images: {len(broken)}")
    print(f"   With valid images: {len(recipes) - len(broken)}")
    
    if broken:
        print("\n⚠️ Still broken:")
        for r in broken:
            print(f"   - {r.get('name', 'Unknown')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_images())
