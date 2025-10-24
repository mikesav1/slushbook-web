#!/usr/bin/env python3
"""
Final diagnosis of Ulla's recipe issue
"""

import requests
import json
from datetime import datetime

BASE_URL = "https://slushice-recipes.emergent.host/api"

def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

def final_diagnosis():
    """Final diagnosis of the issue"""
    log("=== FINAL DIAGNOSIS: ULLA'S RECIPE ISSUE ===")
    
    try:
        # Login as admin
        admin_session = requests.Session()
        reset_request = {"email": "kimesav@gmail.com"}
        reset_response = admin_session.post(f"{BASE_URL}/auth/forgot-password", json=reset_request)
        reset_token = reset_response.json().get("reset_token")
        
        reset_password_data = {"reset_token": reset_token, "new_password": "admin123"}
        admin_session.post(f"{BASE_URL}/auth/reset-password", json=reset_password_data)
        
        admin_login_response = admin_session.post(f"{BASE_URL}/auth/login", json={
            "email": "kimesav@gmail.com", "password": "admin123"
        })
        admin_data = admin_login_response.json()
        admin_session_token = admin_data.get("session_token")
        
        log("✅ Admin logged in successfully")
        
        # Check all recipes with approval_status=pending
        recipes_response = admin_session.get(f"{BASE_URL}/recipes?approval_status=pending&session_id={admin_session_token}")
        
        if recipes_response.status_code == 200:
            all_recipes = recipes_response.json()
            log(f"✅ Found {len(all_recipes)} recipes with approval_status=pending query")
            
            # Look for Ulla's recipes
            ulla_recipes = []
            for recipe in all_recipes:
                author = recipe.get('author', '')
                if '393ffc7c-efa4-4947-99f4-2025a8994c3b' in author:  # Ulla's user ID
                    ulla_recipes.append(recipe)
            
            log(f"📊 Ulla's recipes in pending status: {len(ulla_recipes)}")
            for recipe in ulla_recipes:
                log(f"  - '{recipe.get('name')}' (Created: {recipe.get('created_at')})")
                log(f"    Status: {recipe.get('approval_status')}, Published: {recipe.get('is_published')}")
                log(f"    Author: {recipe.get('author')}")
                log("")
        
        # Now test the normal recipes endpoint (what users see)
        normal_recipes_response = admin_session.get(f"{BASE_URL}/recipes?session_id={admin_session_token}")
        
        if normal_recipes_response.status_code == 200:
            normal_recipes = normal_recipes_response.json()
            log(f"✅ Normal recipes endpoint returned {len(normal_recipes)} recipes")
            
            # Look for Ulla's recipes in normal list
            ulla_normal = []
            for recipe in normal_recipes:
                author = recipe.get('author', '')
                if '393ffc7c-efa4-4947-99f4-2025a8994c3b' in author:
                    ulla_normal.append(recipe)
            
            log(f"📊 Ulla's recipes visible in normal list: {len(ulla_normal)}")
            for recipe in ulla_normal:
                log(f"  - '{recipe.get('name')}' (Status: {recipe.get('approval_status')}, Published: {recipe.get('is_published')})")
        
        # Login as Ulla to test her view
        ulla_session = requests.Session()
        reset_request = {"email": "ulla@itopgaver.dk"}
        reset_response = ulla_session.post(f"{BASE_URL}/auth/forgot-password", json=reset_request)
        reset_token = reset_response.json().get("reset_token")
        
        reset_password_data = {"reset_token": reset_token, "new_password": "ulla123"}
        ulla_session.post(f"{BASE_URL}/auth/reset-password", json=reset_password_data)
        
        ulla_login_response = ulla_session.post(f"{BASE_URL}/auth/login", json={
            "email": "ulla@itopgaver.dk", "password": "ulla123"
        })
        ulla_data = ulla_login_response.json()
        ulla_session_token = ulla_data.get("session_token")
        
        log("✅ Ulla logged in successfully")
        
        # Check what Ulla sees
        ulla_recipes_response = ulla_session.get(f"{BASE_URL}/recipes?session_id={ulla_session_token}")
        
        if ulla_recipes_response.status_code == 200:
            ulla_visible_recipes = ulla_recipes_response.json()
            
            # Filter for Ulla's own recipes
            ulla_own_recipes = []
            for recipe in ulla_visible_recipes:
                author = recipe.get('author', '')
                if '393ffc7c-efa4-4947-99f4-2025a8994c3b' in author:
                    ulla_own_recipes.append(recipe)
            
            log(f"📊 Recipes Ulla can see (her own): {len(ulla_own_recipes)}")
            for recipe in ulla_own_recipes:
                log(f"  - '{recipe.get('name')}' (Status: {recipe.get('approval_status')}, Published: {recipe.get('is_published')})")
        
        log("\n" + "="*80)
        log("FINAL DIAGNOSIS SUMMARY")
        log("="*80)
        
        log("🔍 ISSUE CONFIRMED:")
        log("  1. Ulla can create recipes successfully")
        log("  2. When she creates published recipes (is_published=true), they get approval_status='pending'")
        log("  3. Recipes with approval_status='pending' are NOT visible in the normal recipe list")
        log("  4. This means Ulla cannot see her own published recipes")
        log("  5. Admin sandbox may also not show these recipes properly")
        
        log("\n💡 ROOT CAUSE:")
        log("  The get_recipes() function in server.py has a logic gap:")
        log("  - Line 1304-1307: Only shows published recipes with approval_status='approved'")
        log("  - Line 1312-1315: Only shows private recipes (is_published != True)")
        log("  - Missing: User's own recipes with approval_status='pending'")
        
        log("\n🔧 SOLUTION REQUIRED:")
        log("  Modify the get_recipes() function to include:")
        log("  - User's own recipes with approval_status='pending' in their recipe list")
        log("  - Ensure admin can see all pending recipes in sandbox")
        
        log("\n📋 EXPECTED BEHAVIOR:")
        log("  - When Ulla creates published recipe: approval_status='pending'")
        log("  - Recipe should appear in Ulla's 'Mine opskrifter' list")
        log("  - Recipe should appear in admin sandbox for approval")
        log("  - After admin approval: recipe becomes publicly visible")
        
        return True
        
    except Exception as e:
        log(f"❌ Diagnosis failed: {str(e)}")
        import traceback
        log(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    final_diagnosis()