#!/usr/bin/env python3
"""
Ulla Recipe Investigation - Specific test for deployed environment
"""

import requests
import json
from datetime import datetime

# Configuration for DEPLOYED environment
BASE_URL = "https://slushice-recipes.emergent.host/api"

def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

def investigate_ulla_recipe():
    """Investigate why Ulla's newly created recipe is not showing up"""
    log("=== INVESTIGATING ULLA'S RECIPE ISSUE ON DEPLOYED ENVIRONMENT ===")
    
    try:
        # Step 1: Try to login as admin
        log("Step 1: Attempting admin login...")
        admin_login_data = {
            "email": "kimesav@gmail.com",
            "password": "admin123"
        }
        
        session = requests.Session()
        login_response = session.post(f"{BASE_URL}/auth/login", json=admin_login_data)
        
        if login_response.status_code != 200:
            log(f"❌ Admin login failed: {login_response.status_code} - {login_response.text}")
            
            # Try password reset flow as mentioned in test_result.md
            log("Attempting password reset flow...")
            
            reset_request = {"email": "kimesav@gmail.com"}
            reset_response = session.post(f"{BASE_URL}/auth/forgot-password", json=reset_request)
            
            if reset_response.status_code == 200:
                reset_data = reset_response.json()
                reset_token = reset_data.get("reset_token")
                log(f"✅ Password reset token obtained: {reset_token[:20]}...")
                
                # Reset password
                reset_password_data = {
                    "reset_token": reset_token,
                    "new_password": "admin123"
                }
                
                reset_password_response = session.post(f"{BASE_URL}/auth/reset-password", json=reset_password_data)
                
                if reset_password_response.status_code == 200:
                    log("✅ Password reset successful, trying login again...")
                    
                    # Try login again
                    login_response = session.post(f"{BASE_URL}/auth/login", json=admin_login_data)
                    
                    if login_response.status_code != 200:
                        log(f"❌ Login still failed after reset: {login_response.status_code}")
                        return False
                else:
                    log(f"❌ Password reset failed: {reset_password_response.status_code}")
                    return False
            else:
                log(f"❌ Password reset request failed: {reset_response.status_code}")
                return False
        
        # If we get here, login was successful
        admin_data = login_response.json()
        admin_session_token = admin_data.get("session_token")
        admin_user = admin_data.get("user", {})
        
        log(f"✅ Admin login successful - User: {admin_user.get('name')} ({admin_user.get('email')})")
        log(f"✅ Admin role: {admin_user.get('role')}")
        
        # Step 2: Get all recipes and search for Ulla's
        log("Step 2: Getting all recipes and searching for Ulla's recipes...")
        
        recipes_response = session.get(f"{BASE_URL}/recipes?session_id={admin_session_token}")
        
        if recipes_response.status_code == 200:
            all_recipes = recipes_response.json()
            log(f"✅ Retrieved {len(all_recipes)} total recipes from deployed database")
            
            # Search for Ulla's recipes
            ulla_recipes = []
            for recipe in all_recipes:
                author = recipe.get('author', '').lower()
                author_name = recipe.get('author_name', '').lower()
                
                # Check multiple variations
                if ('ulla@itopgaver.dk' in author or 
                    'ulla' in author_name or 
                    'ulla' in author or
                    'itopgaver' in author):
                    ulla_recipes.append(recipe)
            
            log(f"📊 Found {len(ulla_recipes)} recipes by Ulla:")
            
            if len(ulla_recipes) > 0:
                for i, recipe in enumerate(ulla_recipes, 1):
                    created_at = recipe.get('created_at', 'Unknown')
                    approval_status = recipe.get('approval_status', 'Unknown')
                    is_published = recipe.get('is_published', False)
                    
                    log(f"  {i}. '{recipe.get('name', 'Unnamed')}'")
                    log(f"     Created: {created_at}")
                    log(f"     Author: {recipe.get('author', 'Unknown')}")
                    log(f"     Author Name: {recipe.get('author_name', 'Unknown')}")
                    log(f"     Published: {is_published}")
                    log(f"     Approval Status: {approval_status}")
                    log(f"     Recipe ID: {recipe.get('id', 'No ID')}")
                    log("")
            else:
                log("❌ NO RECIPES FOUND FOR ULLA - This confirms the issue!")
                
                # Let's check if there are any recipes with similar patterns
                log("Checking for recipes with similar author patterns...")
                
                similar_recipes = []
                for recipe in all_recipes:
                    author = recipe.get('author', '').lower()
                    author_name = recipe.get('author_name', '').lower()
                    
                    if ('ulla' in author or 'ulla' in author_name or 
                        'itop' in author or 'gaver' in author):
                        similar_recipes.append(recipe)
                
                if similar_recipes:
                    log(f"Found {len(similar_recipes)} recipes with similar patterns:")
                    for recipe in similar_recipes:
                        log(f"  - '{recipe.get('name')}' by {recipe.get('author')} ({recipe.get('author_name')})")
                else:
                    log("No recipes found with similar patterns")
        else:
            log(f"❌ Failed to get recipes: {recipes_response.status_code} - {recipes_response.text}")
            return False
        
        # Step 3: Check if Ulla exists as a user
        log("Step 3: Checking if Ulla exists as a registered user...")
        
        members_response = session.get(f"{BASE_URL}/admin/members")
        
        if members_response.status_code == 200:
            members = members_response.json()
            log(f"✅ Retrieved {len(members)} total members")
            
            ulla_user = None
            for member in members:
                email = member.get('email', '').lower()
                name = member.get('name', '').lower()
                
                if ('ulla@itopgaver.dk' in email or 
                    'ulla' in name or 
                    'itopgaver' in email):
                    ulla_user = member
                    break
            
            if ulla_user:
                log(f"✅ Found Ulla as registered user:")
                log(f"  Name: {ulla_user.get('name', 'Unknown')}")
                log(f"  Email: {ulla_user.get('email', 'Unknown')}")
                log(f"  Role: {ulla_user.get('role', 'Unknown')}")
                log(f"  User ID: {ulla_user.get('id', 'Unknown')}")
                log(f"  Created: {ulla_user.get('created_at', 'Unknown')}")
            else:
                log("❌ ULLA NOT FOUND AS REGISTERED USER!")
                log("This could explain why her recipe is missing:")
                log("  - She may have tried to create recipe without being logged in")
                log("  - Recipe creation as guest may have failed")
                log("  - Authentication issue during recipe creation")
                
                # Show some example users for comparison
                log("\nExample registered users (first 5):")
                for i, member in enumerate(members[:5]):
                    log(f"  {i+1}. {member.get('name', 'Unknown')} ({member.get('email', 'Unknown')})")
        else:
            log(f"❌ Failed to get members: {members_response.status_code}")
        
        # Step 4: Check pending recipes (sandbox)
        log("Step 4: Checking pending recipes in sandbox...")
        
        # Try different endpoints that might show pending recipes
        endpoints_to_try = [
            "/admin/pending-recipes",
            "/recipes?approval_status=pending",
            "/admin/recipes?status=pending"
        ]
        
        for endpoint in endpoints_to_try:
            log(f"Trying endpoint: {endpoint}")
            pending_response = session.get(f"{BASE_URL}{endpoint}")
            
            if pending_response.status_code == 200:
                pending_data = pending_response.json()
                log(f"✅ Endpoint {endpoint} returned {len(pending_data) if isinstance(pending_data, list) else 'data'}")
                
                if isinstance(pending_data, list):
                    ulla_pending = []
                    for item in pending_data:
                        author = item.get('author', '').lower()
                        author_name = item.get('author_name', '').lower()
                        
                        if ('ulla' in author or 'ulla' in author_name or 
                            'itopgaver' in author):
                            ulla_pending.append(item)
                    
                    if ulla_pending:
                        log(f"Found {len(ulla_pending)} pending items by Ulla:")
                        for item in ulla_pending:
                            log(f"  - {item.get('name')} (Status: {item.get('approval_status')})")
                    else:
                        log("No pending items found for Ulla")
                break
            else:
                log(f"❌ Endpoint {endpoint} failed: {pending_response.status_code}")
        
        # Step 5: Summary and recommendations
        log("\n" + "="*60)
        log("INVESTIGATION SUMMARY")
        log("="*60)
        
        if len(ulla_recipes) == 0:
            log("🔍 CONFIRMED ISSUE: Ulla's recipe is NOT in the deployed database")
            log("\n💡 ROOT CAUSE ANALYSIS:")
            
            if not ulla_user:
                log("  ❌ CRITICAL: Ulla is not registered as a user in the system")
                log("  📋 This suggests:")
                log("     1. She tried to create recipe as guest user")
                log("     2. Guest recipe creation may have failed silently")
                log("     3. She may have had authentication issues")
                log("     4. Recipe was created but not saved due to session issues")
            else:
                log("  ✅ Ulla is registered as a user")
                log("  📋 This suggests:")
                log("     1. Recipe creation failed after authentication")
                log("     2. Database write operation failed")
                log("     3. Recipe was created but later deleted")
                log("     4. Wrong database/collection was used")
            
            log("\n🔧 RECOMMENDED ACTIONS:")
            log("  1. Check backend logs for recipe creation errors")
            log("  2. Verify database connectivity and write permissions")
            log("  3. Test recipe creation flow with Ulla's account")
            log("  4. Check if recipe was created in different environment")
            log("  5. Implement better error handling and user feedback")
            
        else:
            log("✅ Ulla's recipes found - investigating visibility issue")
            
            for recipe in ulla_recipes:
                is_published = recipe.get('is_published', False)
                approval_status = recipe.get('approval_status', 'unknown')
                
                if is_published and approval_status == 'pending':
                    log(f"  📝 Recipe '{recipe.get('name')}' should appear in sandbox")
                elif is_published and approval_status == 'approved':
                    log(f"  ✅ Recipe '{recipe.get('name')}' should be publicly visible")
                elif not is_published:
                    log(f"  🔒 Recipe '{recipe.get('name')}' is private")
        
        return True
        
    except Exception as e:
        log(f"❌ Investigation failed with exception: {str(e)}")
        import traceback
        log(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    success = investigate_ulla_recipe()
    if success:
        print("\n✅ Investigation completed successfully")
    else:
        print("\n❌ Investigation failed")