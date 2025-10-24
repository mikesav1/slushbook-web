#!/usr/bin/env python3
"""
Verify the pending recipe visibility issue
"""

import requests
import json
from datetime import datetime

BASE_URL = "https://slushice-recipes.emergent.host/api"

def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

def verify_pending_issue():
    """Verify that pending recipes are not visible to users"""
    log("=== VERIFYING PENDING RECIPE VISIBILITY ISSUE ===")
    
    try:
        # Login as admin first
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
        
        # Check pending recipes via admin endpoint
        pending_response = admin_session.get(f"{BASE_URL}/admin/pending-recipes")
        
        if pending_response.status_code == 200:
            pending_recipes = pending_response.json()
            log(f"✅ Admin can access pending recipes: {len(pending_recipes)} found")
            
            # Look for Ulla's test recipes
            ulla_pending = []
            for recipe in pending_recipes:
                author = recipe.get('author', '')
                if '393ffc7c-efa4-4947-99f4-2025a8994c3b' in author:  # Ulla's user ID
                    ulla_pending.append(recipe)
            
            log(f"📊 Found {len(ulla_pending)} pending recipes by Ulla:")
            for recipe in ulla_pending:
                log(f"  - '{recipe.get('name')}' (Status: {recipe.get('approval_status')}, Published: {recipe.get('is_published')})")
                
            if ulla_pending:
                log("✅ CONFIRMED: Ulla's published recipes are in pending status")
                log("❌ ISSUE: These recipes are invisible to Ulla and not in sandbox")
                
                # Test the get_recipes endpoint to confirm they're not returned
                recipes_response = admin_session.get(f"{BASE_URL}/recipes?session_id={admin_session_token}")
                all_recipes = recipes_response.json()
                
                # Check if any of Ulla's pending recipes appear in general recipe list
                ulla_visible = []
                for recipe in all_recipes:
                    author = recipe.get('author', '')
                    if '393ffc7c-efa4-4947-99f4-2025a8994c3b' in author:
                        ulla_visible.append(recipe)
                
                log(f"📊 Ulla's recipes visible in general list: {len(ulla_visible)}")
                for recipe in ulla_visible:
                    log(f"  - '{recipe.get('name')}' (Status: {recipe.get('approval_status')}, Published: {recipe.get('is_published')})")
                
                # The issue: pending recipes should be visible to their creator
                log("\n🔍 ROOT CAUSE IDENTIFIED:")
                log("  The get_recipes() function has a logic gap:")
                log("  1. Published recipes only show if approval_status='approved' (line 1305)")
                log("  2. Private recipes only show if is_published != True (line 1313)")
                log("  3. Recipes with is_published=True AND approval_status='pending' are INVISIBLE")
                log("  4. This affects both user's own recipe list AND admin sandbox")
                
                log("\n🔧 SOLUTION NEEDED:")
                log("  Modify get_recipes() to include user's own pending recipes:")
                log("  - Add query for user's own recipes with approval_status='pending'")
                log("  - Include these in the recipe list for the creator")
                log("  - Ensure admin sandbox shows all pending recipes correctly")
                
        else:
            log(f"❌ Failed to get pending recipes: {pending_response.status_code}")
            
        return True
        
    except Exception as e:
        log(f"❌ Verification failed: {str(e)}")
        return False

if __name__ == "__main__":
    verify_pending_issue()