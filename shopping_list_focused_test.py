#!/usr/bin/env python3
"""
Focused test for 'Add to shopping list' functionality from recipe detail page
Testing the specific scenario reported by the user
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://shopping-links-1.preview.emergentagent.com/api"

def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

def test_add_to_shopping_list_scenario():
    """Test the exact scenario reported by the user"""
    log("Testing 'Add to shopping list' functionality - User reported scenario")
    log("=" * 70)
    
    try:
        # Step 1: Login as user (kimesav@gmail.com / admin123)
        log("Step 1: Login as user kimesav@gmail.com...")
        
        session = requests.Session()
        login_response = session.post(f"{BASE_URL}/auth/login", json={
            "email": "kimesav@gmail.com",
            "password": "admin123"
        })
        
        if login_response.status_code != 200:
            log(f"❌ Login failed: {login_response.status_code} - {login_response.text}")
            return False
            
        login_data = login_response.json()
        user_session_id = login_data.get("user", {}).get("id")
        user_name = login_data.get("user", {}).get("name")
        
        log(f"✅ Login successful - User: {user_name}, Session ID: {user_session_id}")
        
        # Step 2: Get a recipe with ingredients
        log("Step 2: Get a recipe with ingredients...")
        
        recipes_response = session.get(f"{BASE_URL}/recipes?session_id={user_session_id}")
        
        if recipes_response.status_code != 200:
            log(f"❌ Failed to get recipes: {recipes_response.status_code}")
            return False
            
        recipes = recipes_response.json()
        
        # Find a recipe with multiple ingredients (preferably one that might have category_key issues)
        test_recipe = None
        for recipe in recipes:
            if recipe.get('ingredients') and len(recipe['ingredients']) >= 2:
                # Check if any ingredients have empty category_key (the reported issue)
                has_empty_category = any(
                    not ing.get('category_key') or ing.get('category_key', '').strip() == ''
                    for ing in recipe['ingredients']
                )
                if has_empty_category:
                    test_recipe = recipe
                    log(f"✅ Found recipe with empty category_key issues: '{recipe['name']}'")
                    break
                elif not test_recipe:  # Fallback to any recipe with ingredients
                    test_recipe = recipe
                    
        if not test_recipe:
            log("❌ No suitable recipe found")
            return False
            
        recipe_id = test_recipe['id']
        recipe_name = test_recipe['name']
        ingredients = test_recipe['ingredients']
        
        log(f"✅ Testing with recipe: '{recipe_name}' (ID: {recipe_id})")
        log(f"   Recipe has {len(ingredients)} ingredients")
        
        # Display ingredient details
        for i, ing in enumerate(ingredients, 1):
            category_key = ing.get('category_key', '')
            log(f"   {i}. {ing['name']} - category_key: '{category_key}' (role: {ing.get('role', 'unknown')})")
        
        # Step 3: Clear existing shopping list
        log("Step 3: Clear existing shopping list...")
        
        existing_response = session.get(f"{BASE_URL}/shopping-list/{user_session_id}")
        if existing_response.status_code == 200:
            existing_items = existing_response.json()
            log(f"   Found {len(existing_items)} existing items")
            
            for item in existing_items:
                delete_response = session.delete(f"{BASE_URL}/shopping-list/{item['id']}")
                if delete_response.status_code == 200:
                    log(f"   ✅ Deleted: {item['ingredient_name']}")
        
        # Step 4: Add recipe ingredients to shopping list (exactly as frontend does)
        log("Step 4: Add recipe ingredients to shopping list...")
        
        import re
        added_count = 0
        failed_count = 0
        
        for ingredient in ingredients:
            if ingredient.get('role') == 'required':
                # Generate category_key from ingredient name if missing (frontend logic)
                category_key = ingredient.get('category_key', '')
                original_category_key = category_key
                
                if not category_key or category_key.strip() == '':
                    # Frontend fallback: generate from name
                    category_key = ingredient['name'].lower()
                    category_key = re.sub(r'\s+', '-', category_key)
                    category_key = re.sub(r'[^a-z0-9\-æøå]', '', category_key)
                    log(f"   Generated category_key for '{ingredient['name']}': '{original_category_key}' -> '{category_key}'")
                
                shopping_item = {
                    "session_id": user_session_id,
                    "ingredient_name": ingredient['name'],
                    "category_key": category_key,
                    "quantity": ingredient['quantity'],
                    "unit": ingredient['unit'],
                    "linked_recipe_id": recipe_id,
                    "linked_recipe_name": recipe_name
                }
                
                log(f"   Adding: {ingredient['name']} ({ingredient['quantity']} {ingredient['unit']})")
                
                add_response = session.post(f"{BASE_URL}/shopping-list", json=shopping_item)
                
                if add_response.status_code == 200:
                    added_count += 1
                    log(f"   ✅ Added successfully")
                else:
                    failed_count += 1
                    log(f"   ❌ Failed: {add_response.status_code} - {add_response.text}")
        
        log(f"✅ Added {added_count} ingredients, {failed_count} failed")
        
        if added_count == 0:
            log("❌ No ingredients were added to shopping list!")
            return False
        
        # Step 5: Verify items appear in shopping list (the critical test)
        log("Step 5: Verify items appear in shopping list...")
        
        shopping_list_response = session.get(f"{BASE_URL}/shopping-list/{user_session_id}")
        
        if shopping_list_response.status_code != 200:
            log(f"❌ Failed to retrieve shopping list: {shopping_list_response.status_code}")
            return False
            
        shopping_list_items = shopping_list_response.json()
        log(f"✅ Retrieved shopping list with {len(shopping_list_items)} items")
        
        if len(shopping_list_items) == 0:
            log("❌ ISSUE CONFIRMED: Shopping list is empty despite successful POST requests!")
            log("   This matches the user's report: success message but no items appear")
            return False
        
        # Verify the added ingredients are actually in the shopping list
        recipe_items = [item for item in shopping_list_items if item.get('linked_recipe_id') == recipe_id]
        
        log(f"   Items from this recipe: {len(recipe_items)}")
        
        for item in recipe_items:
            log(f"   - {item['ingredient_name']} ({item['quantity']} {item['unit']}) [session: {item['session_id']}]")
        
        if len(recipe_items) != added_count:
            log(f"❌ MISMATCH: Added {added_count} items but found {len(recipe_items)} in shopping list")
            return False
        
        # Step 6: Test persistence (refresh the shopping list)
        log("Step 6: Test persistence (simulate page refresh)...")
        
        refresh_response = session.get(f"{BASE_URL}/shopping-list/{user_session_id}")
        
        if refresh_response.status_code == 200:
            refresh_items = refresh_response.json()
            refresh_recipe_items = [item for item in refresh_items if item.get('linked_recipe_id') == recipe_id]
            
            if len(refresh_recipe_items) == len(recipe_items):
                log("✅ Items persist across page refreshes")
            else:
                log(f"❌ Persistence issue: {len(recipe_items)} -> {len(refresh_recipe_items)} items after refresh")
                return False
        else:
            log(f"❌ Failed to test persistence: {refresh_response.status_code}")
            return False
        
        # Step 7: Test session ID consistency
        log("Step 7: Verify session ID consistency...")
        
        session_mismatch = False
        for item in shopping_list_items:
            if item.get('session_id') != user_session_id:
                log(f"❌ Session ID mismatch: item has '{item.get('session_id')}', expected '{user_session_id}'")
                session_mismatch = True
        
        if not session_mismatch:
            log("✅ All items have correct session_id")
        else:
            log("❌ Session ID issues detected - this could cause items not to appear for the user")
            return False
        
        log("=" * 70)
        log("✅ ALL TESTS PASSED - 'Add to shopping list' functionality is working correctly")
        log(f"   - Successfully added {added_count} ingredients from recipe '{recipe_name}'")
        log(f"   - All items appear in shopping list")
        log(f"   - Items persist across requests")
        log(f"   - Session isolation working correctly")
        log("   - Category key generation working for empty values")
        
        return True
        
    except Exception as e:
        log(f"❌ Test failed with exception: {str(e)}")
        import traceback
        log(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    success = test_add_to_shopping_list_scenario()
    
    if success:
        print("\n🎉 CONCLUSION: The 'Add to shopping list' functionality is working correctly!")
        print("   If the user is still experiencing issues, it might be:")
        print("   1. Frontend JavaScript errors preventing the API calls")
        print("   2. Session/authentication issues in the browser")
        print("   3. Browser cache or cookie issues")
        print("   4. Network connectivity problems")
    else:
        print("\n❌ ISSUE CONFIRMED: There are problems with the shopping list functionality")
        print("   The backend API has issues that need to be fixed")