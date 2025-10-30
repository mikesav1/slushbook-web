"""
Migration script to upload all recipe images to Cloudinary
and update database with permanent Cloudinary URLs.

This ensures all images persist after deployments.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv
from pathlib import Path
import httpx
from datetime import datetime

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET'),
    secure=True
)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

async def migrate_images():
    """Migrate all recipe images to Cloudinary"""
    
    print("="*70)
    print("🚀 STARTING IMAGE MIGRATION TO CLOUDINARY")
    print("="*70)
    
    # Connect to database
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Get all recipes
    recipes = await db.recipes.find().to_list(length=None)
    print(f"\n📊 Found {len(recipes)} recipes in database")
    
    if len(recipes) == 0:
        print("⚠️  No recipes found. Exiting.")
        return
    
    # Statistics
    stats = {
        'total': len(recipes),
        'already_cloudinary': 0,
        'uploaded': 0,
        'skipped': 0,
        'failed': 0
    }
    
    uploaded_recipes = []
    skipped_recipes = []
    failed_recipes = []
    
    for i, recipe in enumerate(recipes, 1):
        recipe_id = recipe.get('id')
        recipe_name = recipe.get('name')
        image_url = recipe.get('image_url', '')
        
        print(f"\n[{i}/{stats['total']}] Processing: {recipe_name}")
        print(f"    Current URL: {image_url[:80]}...")
        
        # Skip if already on Cloudinary
        if 'cloudinary.com' in image_url:
            print(f"    ✅ Already on Cloudinary - skipping")
            stats['already_cloudinary'] += 1
            continue
        
        # Skip placeholder images
        if 'placeholder' in image_url.lower():
            print(f"    ⏭️  Placeholder image - skipping")
            stats['skipped'] += 1
            skipped_recipes.append({
                'name': recipe_name,
                'id': recipe_id,
                'reason': 'Placeholder image'
            })
            continue
        
        # Try to upload image
        try:
            # Check if it's a local file
            if image_url.startswith('/api/images/'):
                filename = image_url.split('/')[-1]
                local_path = ROOT_DIR / 'uploads' / filename
                
                if not local_path.exists():
                    print(f"    ❌ Local file not found: {local_path}")
                    stats['failed'] += 1
                    failed_recipes.append({
                        'name': recipe_name,
                        'id': recipe_id,
                        'reason': 'Local file not found'
                    })
                    continue
                
                # Upload local file to Cloudinary
                print(f"    📤 Uploading local file to Cloudinary...")
                result = cloudinary.uploader.upload(
                    str(local_path),
                    folder="slushbook/recipes",
                    resource_type="auto",
                    quality="auto",
                )
                
            elif image_url.startswith('http'):
                # Download and upload external image (e.g., Unsplash)
                print(f"    📥 Downloading external image...")
                async with httpx.AsyncClient(timeout=30.0) as http_client:
                    response = await http_client.get(image_url)
                    if response.status_code != 200:
                        raise Exception(f"Failed to download image: {response.status_code}")
                    
                    image_data = response.content
                
                print(f"    📤 Uploading to Cloudinary...")
                result = cloudinary.uploader.upload(
                    image_data,
                    folder="slushbook/recipes",
                    resource_type="auto",
                    quality="auto",
                )
            else:
                print(f"    ⏭️  Unknown URL format - skipping")
                stats['skipped'] += 1
                skipped_recipes.append({
                    'name': recipe_name,
                    'id': recipe_id,
                    'reason': 'Unknown URL format'
                })
                continue
            
            # Get new Cloudinary URL
            new_url = result.get("secure_url")
            public_id = result.get("public_id")
            
            # Update recipe in database
            await db.recipes.update_one(
                {"id": recipe_id},
                {"$set": {
                    "image_url": new_url,
                    "cloudinary_public_id": public_id,
                    "migrated_at": datetime.utcnow().isoformat()
                }}
            )
            
            print(f"    ✅ SUCCESS! New URL: {new_url[:60]}...")
            stats['uploaded'] += 1
            uploaded_recipes.append({
                'name': recipe_name,
                'id': recipe_id,
                'old_url': image_url[:80],
                'new_url': new_url
            })
            
        except Exception as e:
            print(f"    ❌ FAILED: {str(e)}")
            stats['failed'] += 1
            failed_recipes.append({
                'name': recipe_name,
                'id': recipe_id,
                'reason': str(e)
            })
    
    # Print summary
    print("\n" + "="*70)
    print("📊 MIGRATION SUMMARY")
    print("="*70)
    print(f"Total recipes:           {stats['total']}")
    print(f"Already on Cloudinary:   {stats['already_cloudinary']}")
    print(f"Successfully uploaded:   {stats['uploaded']}")
    print(f"Skipped:                 {stats['skipped']}")
    print(f"Failed:                  {stats['failed']}")
    
    if uploaded_recipes:
        print(f"\n✅ SUCCESSFULLY UPLOADED ({len(uploaded_recipes)}):")
        for recipe in uploaded_recipes:
            print(f"   • {recipe['name']}")
    
    if skipped_recipes:
        print(f"\n⏭️  SKIPPED ({len(skipped_recipes)}):")
        for recipe in skipped_recipes:
            print(f"   • {recipe['name']} - {recipe['reason']}")
    
    if failed_recipes:
        print(f"\n❌ FAILED ({len(failed_recipes)}):")
        for recipe in failed_recipes:
            print(f"   • {recipe['name']}")
            print(f"     Reason: {recipe['reason']}")
    
    print("\n" + "="*70)
    print("✅ MIGRATION COMPLETE!")
    print("="*70)

if __name__ == "__main__":
    asyncio.run(migrate_images())
