#!/usr/bin/env python3
"""
Fix Pending Recipes Status
---------------------------
Fixes recipes that are stuck in "pending" status but don't show up in admin sandbox.

Usage:
    python fix_pending_status.py

This script:
1. Finds all recipes with status="pending" in user_recipes collection
2. Ensures they are visible in admin sandbox
3. Reports statistics

Safe to run multiple times.
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = AsyncIOMotorClient(MONGO_URL)
db = client.slushice

async def fix_pending_recipes():
    print("=" * 60)
    print("🔧 Fixing Pending Recipes Status")
    print("=" * 60)
    
    # Find all pending recipes
    pending_recipes = await db.user_recipes.find(
        {"status": "pending"}
    ).to_list(length=None)
    
    print(f"\n📊 Found {len(pending_recipes)} recipes with status='pending'")
    
    if len(pending_recipes) == 0:
        print("✅ No pending recipes found. Everything looks good!")
        return
    
    print("\n📋 Pending recipes:")
    for recipe in pending_recipes:
        print(f"  - {recipe.get('name', 'Unknown')} (ID: {recipe.get('id')})")
        print(f"    Author: {recipe.get('author_name', 'Unknown')}")
        print(f"    Created: {recipe.get('created_at', 'Unknown')}")
        print(f"    Published: {recipe.get('is_published', False)}")
        print()
    
    # Check if any are missing required fields
    fixes_needed = []
    for recipe in pending_recipes:
        needs_fix = False
        issues = []
        
        if 'status' not in recipe:
            needs_fix = True
            issues.append("Missing 'status' field")
        
        if recipe.get('status') != 'pending':
            needs_fix = True
            issues.append(f"Status is '{recipe.get('status')}' instead of 'pending'")
        
        if needs_fix:
            fixes_needed.append({
                'recipe': recipe,
                'issues': issues
            })
    
    if fixes_needed:
        print(f"\n⚠️  {len(fixes_needed)} recipes need fixes:")
        for item in fixes_needed:
            recipe = item['recipe']
            print(f"\n  Recipe: {recipe.get('name', 'Unknown')}")
            for issue in item['issues']:
                print(f"    - {issue}")
        
        # Ask for confirmation
        response = input("\nDo you want to fix these recipes? (yes/no): ").lower()
        if response != 'yes':
            print("❌ Cancelled. No changes made.")
            return
        
        # Apply fixes
        fixed_count = 0
        for item in fixes_needed:
            recipe = item['recipe']
            recipe_id = recipe['id']
            
            await db.user_recipes.update_one(
                {"id": recipe_id},
                {"$set": {"status": "pending"}}
            )
            fixed_count += 1
            print(f"  ✅ Fixed: {recipe.get('name', 'Unknown')}")
        
        print(f"\n✅ Fixed {fixed_count} recipes!")
    else:
        print("\n✅ All pending recipes are correctly configured!")
    
    print("\n" + "=" * 60)
    print("✅ Done!")
    print("=" * 60)

async def main():
    try:
        await fix_pending_recipes()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
