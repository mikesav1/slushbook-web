"""
One-time script to fix recipes stuck in 'pending' status
These should be 'approved' but database wasn't updated
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'flavor_sync')

async def fix_pending_recipes():
    """Update all pending recipes to approved status"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Find all recipes with pending status
        pending_recipes = await db.user_recipes.find(
            {"approval_status": "pending"}
        ).to_list(length=None)
        
        print(f"Found {len(pending_recipes)} recipes with 'pending' status")
        
        if len(pending_recipes) == 0:
            print("No pending recipes to fix!")
            return
        
        # Show which ones we'll update
        for recipe in pending_recipes:
            print(f"  - {recipe.get('name')} (by {recipe.get('author_name')})")
        
        # Ask for confirmation
        confirm = input(f"\nUpdate all {len(pending_recipes)} recipes to 'approved'? (yes/no): ")
        
        if confirm.lower() != 'yes':
            print("Cancelled.")
            return
        
        # Update all to approved
        result = await db.user_recipes.update_many(
            {"approval_status": "pending"},
            {
                "$set": {
                    "approval_status": "approved",
                    "approved_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        print(f"\n✅ SUCCESS!")
        print(f"Updated {result.modified_count} recipes to 'approved' status")
        print(f"\nUsers will no longer see 'Afventer Godkendelse' message!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    print("=" * 60)
    print("FIX PENDING RECIPES SCRIPT")
    print("=" * 60)
    asyncio.run(fix_pending_recipes())
