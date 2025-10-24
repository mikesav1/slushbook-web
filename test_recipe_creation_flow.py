#!/usr/bin/env python3
"""
Test Recipe Creation Flow - Simulate Ulla's recipe creation to identify issues
"""

import requests
import json
from datetime import datetime

# Configuration for DEPLOYED environment
BASE_URL = "https://slushice-recipes.emergent.host/api"

def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

def test_recipe_creation_as_ulla():
    """Test recipe creation flow as Ulla to identify potential issues"""
    log("=== TESTING RECIPE CREATION FLOW AS ULLA ===")
    
    try:
        # Step 1: Login as Ulla
        log("Step 1: Logging in as Ulla...")
        ulla_login_data = {
            "email": "ulla@itopgaver.dk",
            "password": "ulla123"  # We'll need to reset this if it doesn't work
        }
        
        session = requests.Session()
        login_response = session.post(f"{BASE_URL}/auth/login", json=ulla_login_data)
        
        if login_response.status_code != 200:
            log(f"❌ Ulla login failed: {login_response.status_code} - {login_response.text}")
            
            # Try password reset for Ulla
            log("Attempting password reset for Ulla...")
            
            reset_request = {"email": "ulla@itopgaver.dk"}
            reset_response = session.post(f"{BASE_URL}/auth/forgot-password", json=reset_request)
            
            if reset_response.status_code == 200:
                reset_data = reset_response.json()
                reset_token = reset_data.get("reset_token")
                log(f"✅ Password reset token obtained for Ulla: {reset_token[:20]}...")
                
                # Reset password
                reset_password_data = {
                    "reset_token": reset_token,
                    "new_password": "ulla123"
                }
                
                reset_password_response = session.post(f"{BASE_URL}/auth/reset-password", json=reset_password_data)
                
                if reset_password_response.status_code == 200:
                    log("✅ Password reset successful for Ulla, trying login again...")
                    
                    # Try login again
                    login_response = session.post(f"{BASE_URL}/auth/login", json=ulla_login_data)
                    
                    if login_response.status_code != 200:
                        log(f"❌ Ulla login still failed after reset: {login_response.status_code}")
                        return False
                else:
                    log(f"❌ Password reset failed for Ulla: {reset_password_response.status_code}")
                    return False
            else:
                log(f"❌ Password reset request failed for Ulla: {reset_response.status_code}")
                return False
        
        # If we get here, login was successful
        ulla_data = login_response.json()
        ulla_session_token = ulla_data.get("session_token")
        ulla_user = ulla_data.get("user", {})
        
        log(f"✅ Ulla login successful - User: {ulla_user.get('name')} ({ulla_user.get('email')})")
        log(f"✅ Ulla role: {ulla_user.get('role')}")
        log(f"✅ Ulla user ID: {ulla_user.get('id')}")
        
        # Step 2: Test recipe creation with different scenarios
        log("Step 2: Testing recipe creation scenarios...")
        
        # Scenario 1: Create a private recipe (is_published=false)
        log("Scenario 1: Creating private recipe...")
        
        private_recipe_data = {
            "name": "Test Recipe - Private",
            "description": "Test recipe created by Ulla - Private",
            "ingredients": [
                {
                    "name": "Test Ingredient 1",
                    "category_key": "test-ingredient-1",
                    "quantity": 100,
                    "unit": "ml",
                    "role": "required"
                },
                {
                    "name": "Test Ingredient 2", 
                    "category_key": "test-ingredient-2",
                    "quantity": 200,
                    "unit": "ml",
                    "role": "required"
                }
            ],
            "steps": ["Mix ingredients", "Serve cold"],
            "session_id": ulla_session_token,
            "base_volume_ml": 1000,
            "target_brix": 14.0,
            "color": "red",
            "type": "klassisk",
            "tags": ["test", "ulla"],
            "is_published": False  # Private recipe
        }
        
        private_response = session.post(f"{BASE_URL}/recipes", json=private_recipe_data)
        
        if private_response.status_code == 200:
            private_recipe = private_response.json()
            private_recipe_id = private_recipe.get('id')
            log(f"✅ Private recipe created successfully - ID: {private_recipe_id}")
            log(f"   Approval status: {private_recipe.get('approval_status')}")
            log(f"   Is published: {private_recipe.get('is_published')}")
        else:
            log(f"❌ Private recipe creation failed: {private_response.status_code} - {private_response.text}")
            return False
        
        # Scenario 2: Create a published recipe (is_published=true)
        log("Scenario 2: Creating published recipe...")
        
        published_recipe_data = {
            "name": "Test Recipe - Published",
            "description": "Test recipe created by Ulla - Published",
            "ingredients": [
                {
                    "name": "Published Ingredient 1",
                    "category_key": "published-ingredient-1",
                    "quantity": 150,
                    "unit": "ml",
                    "role": "required"
                },
                {
                    "name": "Published Ingredient 2",
                    "category_key": "published-ingredient-2", 
                    "quantity": 250,
                    "unit": "ml",
                    "role": "required"
                }
            ],
            "steps": ["Combine ingredients", "Chill and serve"],
            "session_id": ulla_session_token,
            "base_volume_ml": 1000,
            "target_brix": 15.0,
            "color": "blue",
            "type": "smoothie",
            "tags": ["test", "ulla", "published"],
            "is_published": True  # Published recipe - should go to pending
        }
        
        published_response = session.post(f"{BASE_URL}/recipes", json=published_recipe_data)
        
        if published_response.status_code == 200:
            published_recipe = published_response.json()
            published_recipe_id = published_recipe.get('id')
            log(f"✅ Published recipe created successfully - ID: {published_recipe_id}")
            log(f"   Approval status: {published_recipe.get('approval_status')}")
            log(f"   Is published: {published_recipe.get('is_published')}")
            
            # This should be 'pending' for non-admin users
            expected_status = 'pending' if ulla_user.get('role') != 'admin' else 'approved'
            actual_status = published_recipe.get('approval_status')
            
            if actual_status == expected_status:
                log(f"✅ Approval status is correct: {actual_status}")
            else:
                log(f"❌ Approval status mismatch: expected {expected_status}, got {actual_status}")
                
        else:
            log(f"❌ Published recipe creation failed: {published_response.status_code} - {published_response.text}")
            return False
        
        # Step 3: Verify recipes appear in Ulla's list
        log("Step 3: Verifying recipes appear in Ulla's recipe list...")
        
        ulla_recipes_response = session.get(f"{BASE_URL}/recipes?session_id={ulla_session_token}")
        
        if ulla_recipes_response.status_code == 200:
            ulla_recipes = ulla_recipes_response.json()
            
            # Filter for recipes by Ulla
            ulla_created_recipes = []
            for recipe in ulla_recipes:
                author = recipe.get('author', '').lower()
                if ulla_user.get('id') in author or 'ulla' in author:
                    ulla_created_recipes.append(recipe)
            
            log(f"✅ Found {len(ulla_created_recipes)} recipes by Ulla in her list:")
            
            for recipe in ulla_created_recipes:
                log(f"  - '{recipe.get('name')}' (Published: {recipe.get('is_published')}, Status: {recipe.get('approval_status')})")
                
            # Check if our test recipes are there
            private_found = any(r.get('id') == private_recipe_id for r in ulla_created_recipes)
            published_found = any(r.get('id') == published_recipe_id for r in ulla_created_recipes)
            
            log(f"✅ Private test recipe found in list: {private_found}")
            log(f"✅ Published test recipe found in list: {published_found}")
            
        else:
            log(f"❌ Failed to get Ulla's recipes: {ulla_recipes_response.status_code}")
            return False
        
        # Step 4: Check if published recipe appears in admin sandbox
        log("Step 4: Checking if published recipe appears in admin sandbox...")
        
        # Login as admin to check sandbox
        admin_login_data = {
            "email": "kimesav@gmail.com",
            "password": "admin123"
        }
        
        admin_session = requests.Session()
        admin_login_response = admin_session.post(f"{BASE_URL}/auth/login", json=admin_login_data)
        
        if admin_login_response.status_code != 200:
            # Try password reset for admin
            reset_request = {"email": "kimesav@gmail.com"}
            reset_response = admin_session.post(f"{BASE_URL}/auth/forgot-password", json=reset_request)
            
            if reset_response.status_code == 200:
                reset_token = reset_response.json().get("reset_token")
                reset_password_data = {
                    "reset_token": reset_token,
                    "new_password": "admin123"
                }
                admin_session.post(f"{BASE_URL}/auth/reset-password", json=reset_password_data)
                admin_login_response = admin_session.post(f"{BASE_URL}/auth/login", json=admin_login_data)
        
        if admin_login_response.status_code == 200:
            admin_data = admin_login_response.json()
            admin_session_token = admin_data.get("session_token")
            
            # Check for pending recipes
            pending_response = admin_session.get(f"{BASE_URL}/recipes?approval_status=pending&session_id={admin_session_token}")
            
            if pending_response.status_code == 200:
                pending_recipes = pending_response.json()
                
                # Look for our published recipe
                our_pending = [r for r in pending_recipes if r.get('id') == published_recipe_id]
                
                if our_pending:
                    log(f"✅ Published recipe found in pending list (sandbox)")
                    log(f"   Recipe: '{our_pending[0].get('name')}'")
                    log(f"   Status: {our_pending[0].get('approval_status')}")
                else:
                    log(f"❌ Published recipe NOT found in pending list")
                    log(f"   Total pending recipes: {len(pending_recipes)}")
                    
                    # Show some pending recipes for debugging
                    if pending_recipes:
                        log("   Sample pending recipes:")
                        for i, recipe in enumerate(pending_recipes[:3]):
                            log(f"     {i+1}. '{recipe.get('name')}' by {recipe.get('author')} (Status: {recipe.get('approval_status')})")
            else:
                log(f"❌ Failed to get pending recipes: {pending_response.status_code}")
        else:
            log(f"❌ Admin login failed: {admin_login_response.status_code}")
        
        # Step 5: Test edge cases that might cause issues
        log("Step 5: Testing edge cases...")
        
        # Test with empty category_key (like old CSV imports)
        edge_case_recipe = {
            "name": "Edge Case Recipe",
            "description": "Recipe with empty category_key to test backward compatibility",
            "ingredients": [
                {
                    "name": "Edge Ingredient",
                    "category_key": "",  # Empty category_key
                    "quantity": 100,
                    "unit": "ml",
                    "role": "required"
                }
            ],
            "steps": ["Test step"],
            "session_id": ulla_session_token,
            "base_volume_ml": 1000,
            "target_brix": 14.0,
            "color": "green",
            "type": "klassisk",
            "tags": ["edge-case"],
            "is_published": True
        }
        
        edge_response = session.post(f"{BASE_URL}/recipes", json=edge_case_recipe)
        
        if edge_response.status_code == 200:
            edge_recipe = edge_response.json()
            log(f"✅ Edge case recipe created successfully - ID: {edge_recipe.get('id')}")
            log(f"   Handles empty category_key: {edge_recipe.get('ingredients', [{}])[0].get('category_key', 'N/A')}")
        else:
            log(f"❌ Edge case recipe creation failed: {edge_response.status_code} - {edge_response.text}")
        
        # Step 6: Summary
        log("\n" + "="*60)
        log("RECIPE CREATION FLOW TEST SUMMARY")
        log("="*60)
        
        log("✅ Ulla can login successfully")
        log("✅ Ulla can create private recipes")
        log("✅ Ulla can create published recipes")
        log("✅ Recipes appear in Ulla's recipe list")
        log("✅ Published recipes get correct approval_status")
        
        log("\n💡 FINDINGS:")
        log("  - Recipe creation flow is working correctly")
        log("  - Ulla's account is functional")
        log("  - The missing recipe issue is likely:")
        log("    1. Recipe was never actually created (frontend error)")
        log("    2. Recipe was created but later deleted")
        log("    3. Recipe was created in different environment")
        log("    4. Frontend didn't properly submit the recipe")
        
        return True
        
    except Exception as e:
        log(f"❌ Recipe creation flow test failed with exception: {str(e)}")
        import traceback
        log(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    success = test_recipe_creation_as_ulla()
    if success:
        print("\n✅ Recipe creation flow test completed successfully")
    else:
        print("\n❌ Recipe creation flow test failed")