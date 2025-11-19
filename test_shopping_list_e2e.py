#!/usr/bin/env python3
"""
Test 'Tilføj til liste' (Add to shopping list) functionality end-to-end
"""

import requests
import json
import time
import uuid
import re
from datetime import datetime, timezone, timedelta

# Configuration
BASE_URL = "https://slushbook-recovery.preview.emergentagent.com/api"

class ShoppingListTester:
    def __init__(self):
        self.session = requests.Session()
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def test_add_to_shopping_list_end_to_end(self):
        """Test 'Tilføj til liste' (Add to shopping list) functionality end-to-end as requested"""
        self.log("Testing 'Tilføj til liste' functionality end-to-end...")
        
        try:
            # Step 1: Login as kimesav@gmail.com / admin123 and get session_id
            self.log("Step 1: Login as kimesav@gmail.com and get session_id...")
            
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
            user_id = user_data.get("id")
            
            self.log(f"✅ Login successful - Session ID: {session_id[:20]}...")
            self.log(f"✅ User: {user_data.get('name')} ({user_data.get('email')})")
            
            # Step 2: Find a recipe with ingredients (any recipe)
            self.log("Step 2: Finding a recipe with ingredients...")
            
            recipes_response = self.session.get(f"{BASE_URL}/recipes?session_id={session_id}")
            
            if recipes_response.status_code != 200:
                self.log(f"❌ Failed to get recipes: {recipes_response.status_code}")
                return False
            
            recipes = recipes_response.json()
            
            if not recipes:
                self.log("❌ No recipes found")
                return False
            
            # Find a recipe with required ingredients
            selected_recipe = None
            for recipe in recipes:
                if recipe.get('ingredients') and len(recipe['ingredients']) > 0:
                    # Check if it has required ingredients
                    required_ingredients = [ing for ing in recipe['ingredients'] if ing.get('role') == 'required']
                    if required_ingredients:
                        selected_recipe = recipe
                        break
            
            if not selected_recipe:
                self.log("❌ No recipe found with required ingredients")
                return False
            
            recipe_id = selected_recipe['id']
            recipe_name = selected_recipe['name']
            required_ingredients = [ing for ing in selected_recipe['ingredients'] if ing.get('role') == 'required']
            
            self.log(f"✅ Selected recipe: '{recipe_name}' with {len(required_ingredients)} required ingredients")
            
            # Log the ingredients we'll be testing
            for i, ingredient in enumerate(required_ingredients):
                self.log(f"   Ingredient {i+1}: '{ingredient['name']}' - category_key: '{ingredient.get('category_key', 'EMPTY')}'")
            
            # Step 3: Simulate clicking "Tilføj til liste" button
            self.log("Step 3: Simulating 'Tilføj til liste' button click...")
            
            added_items = []
            
            for ingredient in required_ingredients:
                ingredient_name = ingredient['name']
                category_key = ingredient.get('category_key', '')
                quantity = ingredient['quantity']
                unit = ingredient['unit']
                
                # Generate category_key from ingredient name if missing/empty (frontend logic)
                if not category_key:
                    # Simulate frontend fallback logic
                    category_key = ingredient_name.lower()
                    # Replace Danish characters
                    category_key = category_key.replace('æ', 'ae').replace('ø', 'oe').replace('å', 'aa')
                    # Replace spaces with hyphens and remove special characters
                    category_key = re.sub(r'[^a-z0-9\s-]', '', category_key)
                    category_key = re.sub(r'\s+', '-', category_key)
                    category_key = re.sub(r'-+', '-', category_key).strip('-')
                    self.log(f"   Generated category_key for '{ingredient_name}': '{category_key}'")
                
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
            
            self.log(f"✅ Successfully added {len(added_items)} ingredients to shopping list")
            
            # Step 4: Verify items are added by calling GET /api/shopping-list/{session_id}
            self.log("Step 4: Verifying items are added via GET /api/shopping-list...")
            
            get_response = self.session.get(f"{BASE_URL}/shopping-list/{session_id}")
            
            if get_response.status_code != 200:
                self.log(f"❌ Failed to get shopping list: {get_response.status_code} - {get_response.text}")
                return False
            
            shopping_list = get_response.json()
            self.log(f"✅ Retrieved shopping list with {len(shopping_list)} items")
            
            # Step 5: Check that all required ingredients from the recipe appear in the shopping list
            self.log("Step 5: Verifying all required ingredients appear in shopping list...")
            
            found_ingredients = []
            missing_ingredients = []
            
            for required_ingredient in required_ingredients:
                ingredient_name = required_ingredient['name']
                found = False
                
                for shopping_item in shopping_list:
                    if (shopping_item.get('ingredient_name') == ingredient_name and 
                        shopping_item.get('linked_recipe_id') == recipe_id):
                        found_ingredients.append({
                            'name': ingredient_name,
                            'category_key': shopping_item.get('category_key'),
                            'quantity': shopping_item.get('quantity'),
                            'unit': shopping_item.get('unit'),
                            'linked_recipe_name': shopping_item.get('linked_recipe_name')
                        })
                        found = True
                        break
                
                if not found:
                    missing_ingredients.append(ingredient_name)
            
            # Verify results
            if missing_ingredients:
                self.log(f"❌ Missing ingredients in shopping list: {missing_ingredients}")
                return False
            
            self.log(f"✅ All {len(found_ingredients)} required ingredients found in shopping list")
            
            # Verify data integrity
            for found_ingredient in found_ingredients:
                self.log(f"✅ Verified: '{found_ingredient['name']}' - "
                        f"category: '{found_ingredient['category_key']}', "
                        f"quantity: {found_ingredient['quantity']} {found_ingredient['unit']}, "
                        f"recipe: '{found_ingredient['linked_recipe_name']}'")
            
            # Additional verification: Check session_id isolation
            self.log("Step 6: Testing session_id isolation...")
            
            # Create a different session and verify items don't appear there
            different_session_id = f"test_session_{int(time.time())}"
            isolation_response = self.session.get(f"{BASE_URL}/shopping-list/{different_session_id}")
            
            if isolation_response.status_code == 200:
                isolation_list = isolation_response.json()
                
                # Check that our items don't appear in different session
                our_items_in_different_session = []
                for item in isolation_list:
                    if item.get('linked_recipe_id') == recipe_id:
                        our_items_in_different_session.append(item)
                
                if not our_items_in_different_session:
                    self.log("✅ Session isolation verified - items don't appear in different session")
                else:
                    self.log(f"❌ Session isolation failed - {len(our_items_in_different_session)} items found in different session")
                    return False
            
            # Step 7: Test persistence across multiple API calls
            self.log("Step 7: Testing persistence across multiple API calls...")
            
            # Make another GET request to verify items persist
            persistence_response = self.session.get(f"{BASE_URL}/shopping-list/{session_id}")
            
            if persistence_response.status_code == 200:
                persistent_list = persistence_response.json()
                
                # Count items from our recipe
                persistent_recipe_items = [item for item in persistent_list 
                                         if item.get('linked_recipe_id') == recipe_id]
                
                if len(persistent_recipe_items) == len(required_ingredients):
                    self.log("✅ Items persist across multiple API calls")
                else:
                    self.log(f"❌ Persistence failed - expected {len(required_ingredients)}, found {len(persistent_recipe_items)}")
                    return False
            else:
                self.log(f"❌ Persistence test failed: {persistence_response.status_code}")
                return False
            
            # Final summary
            self.log("\n" + "="*60)
            self.log("END-TO-END TEST SUMMARY")
            self.log("="*60)
            self.log(f"✅ Recipe tested: '{recipe_name}' (ID: {recipe_id})")
            self.log(f"✅ Required ingredients processed: {len(required_ingredients)}")
            self.log(f"✅ Items successfully added to shopping list: {len(added_items)}")
            self.log(f"✅ All items verified in GET response")
            self.log(f"✅ Session isolation working correctly")
            self.log(f"✅ Data persistence confirmed")
            self.log("✅ 'Tilføj til liste' functionality working perfectly!")
            
            return True
            
        except Exception as e:
            self.log(f"❌ End-to-end test failed with exception: {str(e)}")
            import traceback
            self.log(f"Traceback: {traceback.format_exc()}")
            return False

if __name__ == "__main__":
    tester = ShoppingListTester()
    print("=" * 80)
    print("SLUSHBOOK 'TILFØJ TIL LISTE' END-TO-END TEST")
    print("=" * 80)
    
    success = tester.test_add_to_shopping_list_end_to_end()
    
    print("\n" + "=" * 80)
    if success:
        print("🎉 TEST PASSED: 'Tilføj til liste' functionality is working correctly!")
    else:
        print("❌ TEST FAILED: Issues found with 'Tilføj til liste' functionality")
    print("=" * 80)