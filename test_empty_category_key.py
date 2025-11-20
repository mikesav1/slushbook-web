#!/usr/bin/env python3
"""
Test 'Tilføj til liste' with recipes that have empty category_key values
"""

import requests
import json
import time
import uuid
import re
from datetime import datetime, timezone, timedelta

# Configuration
BASE_URL = "https://multilingual-app-32.preview.emergentagent.com/api"

class EmptyCategoryKeyTester:
    def __init__(self):
        self.session = requests.Session()
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def test_empty_category_key_scenario(self):
        """Test scenario where recipe has ingredients with empty category_key"""
        self.log("Testing scenario with empty category_key values...")
        
        try:
            # Step 1: Login as kimesav@gmail.com / admin123
            self.log("Step 1: Login as kimesav@gmail.com...")
            
            login_data = {
                "email": "kimesav@gmail.com",
                "password": "admin123"
            }
            
            login_response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            
            if login_response.status_code != 200:
                self.log(f"❌ Login failed: {login_response.status_code} - {login_response.text}")
                return False
            
            login_result = login_response.json()
            session_id = login_result.get("session_token")
            user_data = login_result.get("user", {})
            
            self.log(f"✅ Login successful - Session ID: {session_id[:20]}...")
            
            # Step 2: Look for recipes with empty category_key values
            self.log("Step 2: Looking for recipes with empty category_key values...")
            
            recipes_response = self.session.get(f"{BASE_URL}/recipes?session_id={session_id}")
            
            if recipes_response.status_code != 200:
                self.log(f"❌ Failed to get recipes: {recipes_response.status_code}")
                return False
            
            recipes = recipes_response.json()
            
            # Find a recipe with empty category_key ingredients
            empty_category_recipe = None
            for recipe in recipes:
                if recipe.get('ingredients'):
                    for ingredient in recipe['ingredients']:
                        if ingredient.get('role') == 'required' and not ingredient.get('category_key'):
                            empty_category_recipe = recipe
                            break
                    if empty_category_recipe:
                        break
            
            if not empty_category_recipe:
                self.log("No recipe found with empty category_key. Creating a test recipe...")
                
                # Create a test recipe with empty category_key ingredients
                test_recipe_data = {
                    "name": "Test Recipe Empty Category",
                    "description": "Test recipe with empty category keys",
                    "ingredients": [
                        {
                            "name": "Blå curaçao",
                            "category_key": "",  # Empty category_key
                            "quantity": 200,
                            "unit": "ml",
                            "role": "required"
                        },
                        {
                            "name": "Vand",
                            "category_key": "",  # Empty category_key
                            "quantity": 500,
                            "unit": "ml",
                            "role": "required"
                        }
                    ],
                    "steps": ["Mix ingredients", "Serve cold"],
                    "session_id": session_id,
                    "base_volume_ml": 1000,
                    "target_brix": 14.0,
                    "color": "blue",
                    "type": "klassisk",
                    "tags": ["test"]
                }
                
                create_response = self.session.post(f"{BASE_URL}/recipes", json=test_recipe_data)
                
                if create_response.status_code == 200:
                    empty_category_recipe = create_response.json()
                    self.log(f"✅ Created test recipe: '{empty_category_recipe['name']}'")
                else:
                    self.log(f"❌ Failed to create test recipe: {create_response.status_code}")
                    return False
            
            recipe_id = empty_category_recipe['id']
            recipe_name = empty_category_recipe['name']
            required_ingredients = [ing for ing in empty_category_recipe['ingredients'] if ing.get('role') == 'required']
            
            self.log(f"✅ Selected recipe: '{recipe_name}' with {len(required_ingredients)} required ingredients")
            
            # Log ingredients and their category_key status
            for i, ingredient in enumerate(required_ingredients):
                category_key = ingredient.get('category_key', '')
                status = "EMPTY" if not category_key else category_key
                self.log(f"   Ingredient {i+1}: '{ingredient['name']}' - category_key: '{status}'")
            
            # Step 3: Test adding ingredients with empty category_key to shopping list
            self.log("Step 3: Testing 'Tilføj til liste' with empty category_key ingredients...")
            
            added_items = []
            
            for ingredient in required_ingredients:
                ingredient_name = ingredient['name']
                category_key = ingredient.get('category_key', '')
                quantity = ingredient['quantity']
                unit = ingredient['unit']
                
                # Generate category_key from ingredient name if missing/empty (frontend logic)
                original_category_key = category_key
                if not category_key:
                    # Simulate frontend fallback logic
                    category_key = ingredient_name.lower()
                    # Replace Danish characters
                    category_key = category_key.replace('æ', 'ae').replace('ø', 'oe').replace('å', 'aa')
                    # Replace spaces with hyphens and remove special characters
                    category_key = re.sub(r'[^a-z0-9\s-]', '', category_key)
                    category_key = re.sub(r'\s+', '-', category_key)
                    category_key = re.sub(r'-+', '-', category_key).strip('-')
                    self.log(f"   Generated category_key for '{ingredient_name}': '{original_category_key}' → '{category_key}'")
                
                # POST to /api/shopping-list
                shopping_item = {
                    "session_id": session_id,
                    "ingredient_name": ingredient_name,
                    "category_key": category_key,
                    "quantity": quantity,
                    "unit": unit,
                    "linked_recipe_id": recipe_id,
                    "linked_recipe_name": recipe_name
                }
                
                add_response = self.session.post(f"{BASE_URL}/shopping-list", json=shopping_item)
                
                if add_response.status_code == 200:
                    added_item = add_response.json()
                    added_items.append(added_item)
                    self.log(f"✅ Added '{ingredient_name}' (category: '{category_key}') to shopping list")
                else:
                    self.log(f"❌ Failed to add '{ingredient_name}': {add_response.status_code} - {add_response.text}")
                    return False
            
            self.log(f"✅ Successfully added {len(added_items)} ingredients with empty category_key to shopping list")
            
            # Step 4: Verify items are in shopping list
            self.log("Step 4: Verifying items appear in shopping list...")
            
            get_response = self.session.get(f"{BASE_URL}/shopping-list/{session_id}")
            
            if get_response.status_code != 200:
                self.log(f"❌ Failed to get shopping list: {get_response.status_code} - {get_response.text}")
                return False
            
            shopping_list = get_response.json()
            
            # Find items from our test recipe
            recipe_items = [item for item in shopping_list if item.get('linked_recipe_id') == recipe_id]
            
            self.log(f"✅ Retrieved shopping list - Found {len(recipe_items)} items from test recipe")
            
            if len(recipe_items) != len(required_ingredients):
                self.log(f"❌ Expected {len(required_ingredients)} items, found {len(recipe_items)}")
                return False
            
            # Verify each item
            for item in recipe_items:
                self.log(f"✅ Found in shopping list: '{item['ingredient_name']}' - "
                        f"category: '{item['category_key']}', "
                        f"quantity: {item['quantity']} {item['unit']}")
            
            # Final summary
            self.log("\n" + "="*60)
            self.log("EMPTY CATEGORY_KEY TEST SUMMARY")
            self.log("="*60)
            self.log(f"✅ Recipe tested: '{recipe_name}'")
            self.log(f"✅ Ingredients with empty category_key: {len(required_ingredients)}")
            self.log(f"✅ All items successfully added to shopping list")
            self.log(f"✅ All items verified in shopping list")
            self.log("✅ Empty category_key handling working correctly!")
            
            return True
            
        except Exception as e:
            self.log(f"❌ Test failed with exception: {str(e)}")
            import traceback
            self.log(f"Traceback: {traceback.format_exc()}")
            return False

if __name__ == "__main__":
    tester = EmptyCategoryKeyTester()
    print("=" * 80)
    print("SLUSHBOOK EMPTY CATEGORY_KEY TEST")
    print("=" * 80)
    
    success = tester.test_empty_category_key_scenario()
    
    print("\n" + "=" * 80)
    if success:
        print("🎉 TEST PASSED: Empty category_key handling is working correctly!")
    else:
        print("❌ TEST FAILED: Issues found with empty category_key handling")
    print("=" * 80)