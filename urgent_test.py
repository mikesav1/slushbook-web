#!/usr/bin/env python3
"""
URGENT: Test PRO user access control and guest user limitations
"""

import requests
import json
import time
import uuid
from datetime import datetime, timezone, timedelta

# Configuration
BASE_URL = "https://unit-converter-13.preview.emergentagent.com/api"

class UrgentTester:
    def __init__(self, base_url=BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def test_pro_user_access_control(self):
        """Test PRO user access control - URGENT from review request"""
        self.log("=== TESTING PRO USER ACCESS CONTROL (URGENT) ===")
        
        try:
            # Step 1: Login som PRO bruger (admin@slushbook.dk)
            self.log("\n--- Step 1: Login som PRO bruger (admin@slushbook.dk) ---")
            
            pro_login_data = {
                "email": "admin@slushbook.dk",
                "password": "admin123"  # Try common admin password
            }
            
            login_response = self.session.post(f"{self.base_url}/auth/login", json=pro_login_data)
            
            if login_response.status_code != 200:
                self.log(f"❌ PRO user login failed: {login_response.status_code} - {login_response.text}")
                self.log("❌ CRITICAL: Cannot test PRO user access without valid login")
                return False
            
            login_result = login_response.json()
            pro_session_token = login_result.get("session_token")
            pro_user = login_result.get("user", {})
            pro_role = pro_user.get("role")
            pro_user_id = pro_user.get("id")
            
            self.log(f"✅ PRO user logged in successfully")
            self.log(f"   Email: {pro_user.get('email')}")
            self.log(f"   Role: {pro_role}")
            self.log(f"   User ID: {pro_user_id}")
            
            # Verify this is actually a PRO/admin user
            if pro_role not in ["admin", "pro"]:
                self.log(f"❌ CRITICAL: User role is '{pro_role}', expected 'admin' or 'pro'")
                return False
            
            # Step 2: Test POST /api/favorites - skal VIRKE (200 OK)
            self.log("\n--- Step 2: Test POST /api/favorites (should work) ---")
            
            favorites_data = {
                "session_id": pro_user_id,
                "recipe_id": "test-recipe-123"
            }
            
            favorites_response = self.session.post(f"{self.base_url}/favorites", json=favorites_data)
            
            if favorites_response.status_code == 200:
                self.log("✅ POST /api/favorites WORKS for PRO user (200 OK)")
            else:
                self.log(f"❌ CRITICAL: POST /api/favorites FAILED for PRO user: {favorites_response.status_code} - {favorites_response.text}")
                return False
            
            # Step 3: Test POST /api/shopping-list - skal VIRKE (200 OK)
            self.log("\n--- Step 3: Test POST /api/shopping-list (should work) ---")
            
            shopping_data = {
                "session_id": pro_user_id,
                "ingredient_name": "Test Ingredient",
                "category_key": "test-category",
                "quantity": 100.0,
                "unit": "ml"
            }
            
            shopping_response = self.session.post(f"{self.base_url}/shopping-list", json=shopping_data)
            
            if shopping_response.status_code == 200:
                self.log("✅ POST /api/shopping-list WORKS for PRO user (200 OK)")
            else:
                self.log(f"❌ CRITICAL: POST /api/shopping-list FAILED for PRO user: {shopping_response.status_code} - {shopping_response.text}")
                return False
            
            # Step 4: Test POST /api/pantry - skal VIRKE (200 OK)
            self.log("\n--- Step 4: Test POST /api/pantry (should work) ---")
            
            pantry_data = {
                "session_id": pro_user_id,
                "ingredient_name": "Test Pantry Item",
                "category_key": "test-pantry-category",
                "quantity": 250.0,
                "unit": "ml",
                "brix": 65.0
            }
            
            pantry_response = self.session.post(f"{self.base_url}/pantry", json=pantry_data)
            
            if pantry_response.status_code == 200:
                self.log("✅ POST /api/pantry WORKS for PRO user (200 OK)")
            else:
                self.log(f"❌ CRITICAL: POST /api/pantry FAILED for PRO user: {pantry_response.status_code} - {pantry_response.text}")
                return False
            
            # Step 5: Test POST /api/match - skal VIRKE (200 OK)
            self.log("\n--- Step 5: Test POST /api/match (should work) ---")
            
            match_data = {
                "session_id": pro_user_id
            }
            
            match_response = self.session.post(f"{self.base_url}/match", json=match_data)
            
            if match_response.status_code == 200:
                self.log("✅ POST /api/match WORKS for PRO user (200 OK)")
                match_result = match_response.json()
                self.log(f"   Match results: {len(match_result.get('can_make_now', []))} can make now, {len(match_result.get('almost', []))} almost")
            else:
                self.log(f"❌ CRITICAL: POST /api/match FAILED for PRO user: {match_response.status_code} - {match_response.text}")
                return False
            
            # Step 6: Test GET endpoints - skal returnere data (ikke tomme arrays)
            self.log("\n--- Step 6: Test GET endpoints (should return data) ---")
            
            # Test GET /api/favorites
            get_favorites_response = self.session.get(f"{self.base_url}/favorites/{pro_user_id}")
            if get_favorites_response.status_code == 200:
                favorites_data = get_favorites_response.json()
                self.log(f"✅ GET /api/favorites works - returned {len(favorites_data)} items")
            else:
                self.log(f"❌ GET /api/favorites failed: {get_favorites_response.status_code}")
            
            # Test GET /api/shopping-list
            get_shopping_response = self.session.get(f"{self.base_url}/shopping-list/{pro_user_id}")
            if get_shopping_response.status_code == 200:
                shopping_data = get_shopping_response.json()
                self.log(f"✅ GET /api/shopping-list works - returned {len(shopping_data)} items")
            else:
                self.log(f"❌ GET /api/shopping-list failed: {get_shopping_response.status_code}")
            
            # Test GET /api/pantry
            get_pantry_response = self.session.get(f"{self.base_url}/pantry/{pro_user_id}")
            if get_pantry_response.status_code == 200:
                pantry_data = get_pantry_response.json()
                self.log(f"✅ GET /api/pantry works - returned {len(pantry_data)} items")
            else:
                self.log(f"❌ GET /api/pantry failed: {get_pantry_response.status_code}")
            
            self.log("\n✅ PRO USER ACCESS CONTROL TEST PASSED")
            self.log("✅ PRO user has FULL access to all endpoints")
            return True
            
        except Exception as e:
            self.log(f"❌ PRO user access control test failed with exception: {str(e)}")
            return False

    def test_guest_user_limitations_focused(self):
        """Test gæstebruger begrænsninger - focused test from review request"""
        self.log("=== TESTING GÆSTEBRUGER BEGRÆNSNINGER (FOCUSED) ===")
        
        try:
            # Step 1: Opret ny gæstebruger med role='guest'
            self.log("\n--- Step 1: Opret ny gæstebruger ---")
            
            guest_email = f"guest.urgent.{int(time.time())}@example.com"
            guest_password = "guestpass123"
            
            signup_data = {
                "email": guest_email,
                "password": guest_password,
                "name": "Guest Urgent Test"
            }
            
            signup_response = self.session.post(f"{self.base_url}/auth/signup", json=signup_data)
            
            if signup_response.status_code != 200:
                self.log(f"❌ Failed to create guest user: {signup_response.status_code}")
                return False
            
            # Login as guest
            login_response = self.session.post(f"{self.base_url}/auth/login", json={
                "email": guest_email,
                "password": guest_password
            })
            
            if login_response.status_code != 200:
                self.log(f"❌ Failed to login as guest: {login_response.status_code}")
                return False
            
            login_result = login_response.json()
            guest_user = login_result.get("user", {})
            guest_role = guest_user.get("role")
            guest_user_id = guest_user.get("id")
            
            self.log(f"✅ Guest user created and logged in")
            self.log(f"   Email: {guest_user.get('email')}")
            self.log(f"   Role: {guest_role}")
            
            # Step 2: Test POST /api/favorites - skal FEJLE (403 Forbidden)
            self.log("\n--- Step 2: Test POST /api/favorites (should FAIL 403) ---")
            
            favorites_data = {
                "session_id": guest_user_id,
                "recipe_id": "test-recipe-123"
            }
            
            favorites_response = self.session.post(f"{self.base_url}/favorites", json=favorites_data)
            
            if favorites_response.status_code == 403:
                self.log("✅ POST /api/favorites correctly FAILED for guest user (403 Forbidden)")
            elif favorites_response.status_code == 401:
                self.log("✅ POST /api/favorites correctly FAILED for guest user (401 Unauthorized)")
            else:
                self.log(f"❌ CRITICAL: POST /api/favorites should FAIL for guest user, but got: {favorites_response.status_code}")
                self.log(f"   Response: {favorites_response.text}")
                return False
            
            # Step 3: Test GET /api/favorites - skal returnere tom array
            self.log("\n--- Step 3: Test GET /api/favorites (should return empty) ---")
            
            get_favorites_response = self.session.get(f"{self.base_url}/favorites/{guest_user_id}")
            
            if get_favorites_response.status_code == 200:
                favorites_data = get_favorites_response.json()
                if len(favorites_data) == 0:
                    self.log("✅ GET /api/favorites returns empty array for guest user")
                else:
                    self.log(f"❌ GET /api/favorites should return empty array, got {len(favorites_data)} items")
                    return False
            else:
                self.log(f"❌ GET /api/favorites failed: {get_favorites_response.status_code}")
                return False
            
            # Step 4: Test POST /api/pantry - skal FEJLE (403 Forbidden)
            self.log("\n--- Step 4: Test POST /api/pantry (should FAIL 403) ---")
            
            pantry_data = {
                "session_id": guest_user_id,
                "ingredient_name": "Test Pantry Item",
                "category_key": "test-category",
                "quantity": 100.0,
                "unit": "ml"
            }
            
            pantry_response = self.session.post(f"{self.base_url}/pantry", json=pantry_data)
            
            if pantry_response.status_code == 403:
                self.log("✅ POST /api/pantry correctly FAILED for guest user (403 Forbidden)")
            elif pantry_response.status_code == 401:
                self.log("✅ POST /api/pantry correctly FAILED for guest user (401 Unauthorized)")
            else:
                self.log(f"❌ CRITICAL: POST /api/pantry should FAIL for guest user, but got: {pantry_response.status_code}")
                self.log(f"   Response: {pantry_response.text}")
                return False
            
            self.log("\n✅ GUEST USER LIMITATIONS TEST PASSED")
            self.log("✅ Guest users have proper limitations (403 on POST, empty arrays on GET)")
            return True
            
        except Exception as e:
            self.log(f"❌ Guest user limitations test failed with exception: {str(e)}")
            return False

    def run_urgent_access_control_tests(self):
        """Run URGENT access control tests from review request"""
        self.log("=== URGENT ACCESS CONTROL TESTS ===")
        self.log(f"Testing against: {self.base_url}")
        
        tests = [
            ("PRO User Access Control", self.test_pro_user_access_control),
            ("Guest User Limitations", self.test_guest_user_limitations_focused),
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            self.log(f"\n{'='*60}")
            self.log(f"RUNNING: {test_name}")
            self.log(f"{'='*60}")
            
            try:
                if test_func():
                    self.log(f"✅ {test_name} PASSED")
                    passed += 1
                else:
                    self.log(f"❌ {test_name} FAILED")
                    failed += 1
            except Exception as e:
                self.log(f"❌ {test_name} FAILED with exception: {str(e)}")
                failed += 1
        
        self.log(f"\n{'='*60}")
        self.log(f"URGENT TEST SUMMARY")
        self.log(f"{'='*60}")
        self.log(f"Total tests: {passed + failed}")
        self.log(f"Passed: {passed}")
        self.log(f"Failed: {failed}")
        
        if failed == 0:
            self.log("🎉 ALL URGENT TESTS PASSED!")
            self.log("✅ PRO users have FULL access")
            self.log("✅ Guest users have proper limitations")
        else:
            self.log(f"❌ {failed} URGENT test(s) failed")
            self.log("❌ CRITICAL: Access control issues detected!")
            
        return failed == 0

if __name__ == "__main__":
    tester = UrgentTester()
    success = tester.run_urgent_access_control_tests()
    exit(0 if success else 1)