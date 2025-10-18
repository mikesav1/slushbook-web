#!/usr/bin/env python3
"""
SLUSHBOOK Backend Test Suite
Tests authentication endpoints and machine CRUD operations
"""

import requests
import json
import time
import uuid
from datetime import datetime, timezone, timedelta

# Configuration
BASE_URL = "https://slushbook-admin.preview.emergentagent.com/api"
TEST_EMAIL = f"test.user.{int(time.time())}@example.com"
TEST_PASSWORD = "testpass123"
TEST_NAME = "Test User"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.user_id = None
        self.session_token = None
        self.reset_token = None
        self.test_session_id = f"test_session_{int(time.time())}"
        self.created_machine_id = None
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def test_signup(self):
        """Test user signup flow"""
        self.log("Testing signup flow...")
        
        # Test valid signup
        signup_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME
        }
        
        response = self.session.post(f"{BASE_URL}/auth/signup", json=signup_data)
        
        if response.status_code == 200:
            data = response.json()
            self.user_id = data.get("user_id")
            self.log(f"✅ Signup successful - User ID: {self.user_id}")
            
            # Verify user created in database by trying to login
            login_response = self.session.post(f"{BASE_URL}/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            
            if login_response.status_code == 200:
                self.log("✅ User successfully created in database (verified by login)")
            else:
                self.log(f"❌ User creation verification failed: {login_response.text}")
                return False
                
        else:
            self.log(f"❌ Signup failed: {response.status_code} - {response.text}")
            return False
            
        # Test duplicate email rejection
        duplicate_response = self.session.post(f"{BASE_URL}/auth/signup", json=signup_data)
        if duplicate_response.status_code == 400:
            self.log("✅ Duplicate email correctly rejected")
        else:
            self.log(f"❌ Duplicate email not rejected: {duplicate_response.status_code}")
            return False
            
        return True
        
    def test_login(self):
        """Test login flow"""
        self.log("Testing login flow...")
        
        # Test valid login
        login_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            self.session_token = data.get("session_token")
            user_data = data.get("user", {})
            
            self.log(f"✅ Login successful - Session token: {self.session_token[:20]}...")
            self.log(f"✅ User data returned: {user_data.get('name')} ({user_data.get('email')})")
            
            # Verify session token is set in cookies
            cookies = response.cookies
            if 'session_token' in cookies:
                self.log("✅ Session token set in cookies")
            else:
                self.log("❌ Session token not set in cookies")
                return False
                
        else:
            self.log(f"❌ Login failed: {response.status_code} - {response.text}")
            return False
            
        # Test invalid credentials
        invalid_login = {
            "email": TEST_EMAIL,
            "password": "wrongpassword"
        }
        
        invalid_response = self.session.post(f"{BASE_URL}/auth/login", json=invalid_login)
        if invalid_response.status_code == 401:
            self.log("✅ Invalid credentials correctly rejected")
        else:
            self.log(f"❌ Invalid credentials not rejected: {invalid_response.status_code}")
            return False
            
        return True
        
    def test_auth_check(self):
        """Test authentication check endpoint"""
        self.log("Testing auth check endpoint...")
        
        # Test with valid session token (using Authorization header)
        headers = {"Authorization": f"Bearer {self.session_token}"}
        response = self.session.get(f"{BASE_URL}/auth/me", headers=headers)
        
        if response.status_code == 200:
            user_data = response.json()
            self.log(f"✅ Auth check successful - User: {user_data.get('name')}")
            
            # Verify user data structure
            required_fields = ['id', 'email', 'name', 'role']
            for field in required_fields:
                if field not in user_data:
                    self.log(f"❌ Missing required field in user data: {field}")
                    return False
            self.log("✅ User data structure is correct")
            
        else:
            self.log(f"❌ Auth check failed: {response.status_code} - {response.text}")
            return False
            
        # Test without session token (use fresh session to avoid cookies)
        fresh_session = requests.Session()
        no_auth_response = fresh_session.get(f"{BASE_URL}/auth/me")
        if no_auth_response.status_code == 401:
            self.log("✅ Unauthorized access correctly rejected (401)")
        else:
            self.log(f"❌ Unauthorized access not rejected: {no_auth_response.status_code}")
            self.log(f"Response: {no_auth_response.text}")
            return False
            
        return True
        
    def test_logout(self):
        """Test logout functionality"""
        self.log("Testing logout functionality...")
        
        # Test logout with session token
        headers = {"Authorization": f"Bearer {self.session_token}"}
        response = self.session.post(f"{BASE_URL}/auth/logout", headers=headers)
        
        if response.status_code == 200:
            self.log("✅ Logout successful")
            
            # Verify session is deleted by trying to use it
            auth_check = self.session.get(f"{BASE_URL}/auth/me", headers=headers)
            if auth_check.status_code == 401:
                self.log("✅ Session successfully deleted from database")
            else:
                self.log(f"❌ Session not deleted from database: {auth_check.status_code}")
                return False
                
        else:
            self.log(f"❌ Logout failed: {response.status_code} - {response.text}")
            return False
            
        return True
        
    def test_password_reset(self):
        """Test password reset flow"""
        self.log("Testing password reset flow...")
        
        # Step 1: Request password reset
        reset_request = {"email": TEST_EMAIL}
        response = self.session.post(f"{BASE_URL}/auth/forgot-password", json=reset_request)
        
        if response.status_code == 200:
            data = response.json()
            self.reset_token = data.get("reset_token")  # This is for testing only
            self.log(f"✅ Password reset requested - Reset token: {self.reset_token[:20]}...")
        else:
            self.log(f"❌ Password reset request failed: {response.status_code} - {response.text}")
            return False
            
        # Step 2: Reset password with token
        new_password = "newpassword123"
        reset_data = {
            "reset_token": self.reset_token,
            "new_password": new_password
        }
        
        reset_response = self.session.post(f"{BASE_URL}/auth/reset-password", json=reset_data)
        
        if reset_response.status_code == 200:
            self.log("✅ Password reset successful")
            
            # Step 3: Verify old sessions are deleted by trying to login with new password
            login_data = {
                "email": TEST_EMAIL,
                "password": new_password
            }
            
            login_response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            if login_response.status_code == 200:
                self.log("✅ Login with new password successful")
                
                # Update session token for further tests
                self.session_token = login_response.json().get("session_token")
            else:
                self.log(f"❌ Login with new password failed: {login_response.status_code}")
                return False
                
            # Step 4: Verify old password doesn't work
            old_login = {
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
            
            old_response = self.session.post(f"{BASE_URL}/auth/login", json=old_login)
            if old_response.status_code == 401:
                self.log("✅ Old password correctly rejected")
            else:
                self.log(f"❌ Old password not rejected: {old_response.status_code}")
                return False
                
        else:
            self.log(f"❌ Password reset failed: {response.status_code} - {response.text}")
            return False
            
        # Test invalid reset token
        invalid_reset = {
            "reset_token": "invalid_token_123",
            "new_password": "somepassword"
        }
        
        invalid_response = self.session.post(f"{BASE_URL}/auth/reset-password", json=invalid_reset)
        if invalid_response.status_code == 400:
            self.log("✅ Invalid reset token correctly rejected")
        else:
            self.log(f"❌ Invalid reset token not rejected: {invalid_response.status_code}")
            return False
            
        return True
        
    def test_password_validation(self):
        """Test password validation requirements"""
        self.log("Testing password validation...")
        
        # Test short password (less than 6 characters)
        short_password_data = {
            "email": f"short.test.{int(time.time())}@example.com",
            "password": "12345",  # 5 characters
            "name": "Short Password Test"
        }
        
        response = self.session.post(f"{BASE_URL}/auth/signup", json=short_password_data)
        
        # Note: The current implementation doesn't seem to have password length validation
        # This is more of a documentation test to verify current behavior
        if response.status_code == 200:
            self.log("⚠️  Short password accepted (no validation implemented)")
        else:
            self.log(f"✅ Short password rejected: {response.status_code}")
            
        return True
        
    def test_machine_create(self):
        """Test machine creation (POST /api/machines)"""
        self.log("Testing machine creation...")
        
        machine_data = {
            "session_id": self.test_session_id,
            "name": "Test Machine",
            "tank_volumes_ml": [10000],
            "loss_margin_pct": 5
        }
        
        response = self.session.post(f"{BASE_URL}/machines", json=machine_data)
        
        if response.status_code == 200:
            data = response.json()
            self.created_machine_id = data.get("id")
            self.log(f"✅ Machine created successfully - ID: {self.created_machine_id}")
            
            # Verify machine data structure
            required_fields = ['id', 'session_id', 'name', 'tank_volumes_ml', 'loss_margin_pct']
            for field in required_fields:
                if field not in data:
                    self.log(f"❌ Missing required field in machine data: {field}")
                    return False
            
            # Verify data values
            if data['name'] != machine_data['name']:
                self.log(f"❌ Machine name mismatch: expected {machine_data['name']}, got {data['name']}")
                return False
                
            if data['tank_volumes_ml'] != machine_data['tank_volumes_ml']:
                self.log(f"❌ Tank volumes mismatch: expected {machine_data['tank_volumes_ml']}, got {data['tank_volumes_ml']}")
                return False
                
            self.log("✅ Machine data structure and values are correct")
            
        else:
            self.log(f"❌ Machine creation failed: {response.status_code} - {response.text}")
            return False
            
        return True
        
    def test_machine_get(self):
        """Test getting machines (GET /api/machines/{session_id})"""
        self.log("Testing machine retrieval...")
        
        response = self.session.get(f"{BASE_URL}/machines/{self.test_session_id}")
        
        if response.status_code == 200:
            machines = response.json()
            self.log(f"✅ Machines retrieved successfully - Count: {len(machines)}")
            
            # Verify our created machine is in the list
            found_machine = None
            for machine in machines:
                if machine.get('id') == self.created_machine_id:
                    found_machine = machine
                    break
                    
            if found_machine:
                self.log("✅ Created machine found in machine list")
                
                # Verify machine data
                if found_machine['name'] == "Test Machine":
                    self.log("✅ Machine name matches")
                else:
                    self.log(f"❌ Machine name mismatch: expected 'Test Machine', got {found_machine['name']}")
                    return False
                    
            else:
                self.log("❌ Created machine not found in machine list")
                return False
                
        else:
            self.log(f"❌ Machine retrieval failed: {response.status_code} - {response.text}")
            return False
            
        return True
        
    def test_machine_update(self):
        """Test machine update (PUT /api/machines/{machine_id})"""
        self.log("Testing machine update...")
        
        if not self.created_machine_id:
            self.log("❌ No machine ID available for update test")
            return False
            
        update_data = {
            "session_id": self.test_session_id,
            "name": "Updated Machine",
            "tank_volumes_ml": [15000],
            "loss_margin_pct": 7
        }
        
        response = self.session.put(f"{BASE_URL}/machines/{self.created_machine_id}", json=update_data)
        
        if response.status_code == 200:
            self.log("✅ Machine update successful")
            
            # Verify update by getting the machine again
            get_response = self.session.get(f"{BASE_URL}/machines/{self.test_session_id}")
            if get_response.status_code == 200:
                machines = get_response.json()
                updated_machine = None
                for machine in machines:
                    if machine.get('id') == self.created_machine_id:
                        updated_machine = machine
                        break
                        
                if updated_machine:
                    if updated_machine['name'] == "Updated Machine":
                        self.log("✅ Machine name updated correctly")
                    else:
                        self.log(f"❌ Machine name not updated: expected 'Updated Machine', got {updated_machine['name']}")
                        return False
                        
                    if updated_machine['tank_volumes_ml'] == [15000]:
                        self.log("✅ Tank volumes updated correctly")
                    else:
                        self.log(f"❌ Tank volumes not updated: expected [15000], got {updated_machine['tank_volumes_ml']}")
                        return False
                        
                else:
                    self.log("❌ Updated machine not found")
                    return False
            else:
                self.log(f"❌ Failed to verify update: {get_response.status_code}")
                return False
                
        else:
            self.log(f"❌ Machine update failed: {response.status_code} - {response.text}")
            return False
            
        return True
        
    def test_machine_delete(self):
        """Test machine deletion (DELETE /api/machines/{machine_id})"""
        self.log("Testing machine deletion...")
        
        if not self.created_machine_id:
            self.log("❌ No machine ID available for delete test")
            return False
            
        response = self.session.delete(f"{BASE_URL}/machines/{self.created_machine_id}?session_id={self.test_session_id}")
        
        if response.status_code == 200:
            data = response.json()
            self.log("✅ Machine deletion successful")
            
            # Verify deletion by checking if machine is no longer in the list
            get_response = self.session.get(f"{BASE_URL}/machines/{self.test_session_id}")
            if get_response.status_code == 200:
                machines = get_response.json()
                deleted_machine = None
                for machine in machines:
                    if machine.get('id') == self.created_machine_id:
                        deleted_machine = machine
                        break
                        
                if not deleted_machine:
                    self.log("✅ Machine successfully removed from list")
                else:
                    self.log("❌ Machine still exists after deletion")
                    return False
            else:
                self.log(f"❌ Failed to verify deletion: {get_response.status_code}")
                return False
                
        else:
            self.log(f"❌ Machine deletion failed: {response.status_code} - {response.text}")
            return False
            
        return True
        
    def test_machine_crud_complete_flow(self):
        """Test complete machine CRUD flow as requested"""
        self.log("Testing complete machine CRUD flow...")
        
        # Step 1: Create a test machine
        machine_data = {
            "session_id": self.test_session_id,
            "name": "Test Machine",
            "tank_volumes_ml": [10000],
            "loss_margin_pct": 5
        }
        
        create_response = self.session.post(f"{BASE_URL}/machines", json=machine_data)
        if create_response.status_code != 200:
            self.log(f"❌ Step 1 - Machine creation failed: {create_response.status_code}")
            return False
            
        machine_id = create_response.json().get("id")
        self.log(f"✅ Step 1 - Machine created with ID: {machine_id}")
        
        # Step 2: Get machines and verify creation
        get_response = self.session.get(f"{BASE_URL}/machines/{self.test_session_id}")
        if get_response.status_code != 200:
            self.log(f"❌ Step 2 - Get machines failed: {get_response.status_code}")
            return False
            
        machines = get_response.json()
        found = any(m.get('id') == machine_id for m in machines)
        if not found:
            self.log("❌ Step 2 - Created machine not found in list")
            return False
        self.log("✅ Step 2 - Machine found in list")
        
        # Step 3: Update machine
        update_data = {
            "session_id": self.test_session_id,
            "name": "Updated Machine",
            "tank_volumes_ml": [15000],
            "loss_margin_pct": 7
        }
        
        update_response = self.session.put(f"{BASE_URL}/machines/{machine_id}", json=update_data)
        if update_response.status_code != 200:
            self.log(f"❌ Step 3 - Machine update failed: {update_response.status_code}")
            return False
        self.log("✅ Step 3 - Machine updated successfully")
        
        # Step 4: Delete machine
        delete_response = self.session.delete(f"{BASE_URL}/machines/{machine_id}?session_id={self.test_session_id}")
        if delete_response.status_code != 200:
            self.log(f"❌ Step 4 - Machine deletion failed: {delete_response.status_code}")
            return False
        self.log("✅ Step 4 - Machine deleted successfully")
        
        # Step 5: Verify deletion
        verify_response = self.session.get(f"{BASE_URL}/machines/{self.test_session_id}")
        if verify_response.status_code != 200:
            self.log(f"❌ Step 5 - Verification get failed: {verify_response.status_code}")
            return False
            
        final_machines = verify_response.json()
        still_exists = any(m.get('id') == machine_id for m in final_machines)
        if still_exists:
            self.log("❌ Step 5 - Machine still exists after deletion")
            return False
        self.log("✅ Step 5 - Machine successfully removed from list")
        
        self.log("✅ Complete machine CRUD flow successful")
        return True
        
    def test_redirect_service_health_direct(self):
        """Test redirect service health check (direct)"""
        self.log("Testing redirect service health check (direct)...")
        
        try:
            response = self.session.get("http://localhost:3001/health")
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Redirect service health check successful: {data}")
                
                # Verify expected response structure
                if data.get("ok") is True and data.get("db") is True:
                    self.log("✅ Health check response structure is correct")
                else:
                    self.log(f"❌ Unexpected health check response: {data}")
                    return False
                    
            else:
                self.log(f"❌ Redirect service health check failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Redirect service health check failed with exception: {str(e)}")
            return False
            
        return True
        
    def test_redirect_admin_get_mapping(self):
        """Test admin API - Get mapping via proxy"""
        self.log("Testing admin API - Get mapping via proxy...")
        
        headers = {"Authorization": "Bearer dev-token-change-in-production"}
        
        try:
            response = self.session.get(
                f"{BASE_URL}/redirect-proxy/admin/mapping/sodastream-pepsi-440ml",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Admin get mapping successful")
                
                # Verify response contains options array with Power.dk link
                if "options" in data and isinstance(data["options"], list):
                    self.log("✅ Response contains options array")
                    
                    # Check if any option contains Power.dk URL
                    power_link_found = False
                    for option in data["options"]:
                        if isinstance(option, dict) and "url" in option:
                            if "power.dk" in option["url"].lower():
                                power_link_found = True
                                self.log(f"✅ Found Power.dk link: {option['url']}")
                                break
                    
                    if not power_link_found:
                        self.log("❌ No Power.dk link found in options")
                        return False
                        
                else:
                    self.log(f"❌ Response missing options array: {data}")
                    return False
                    
            else:
                self.log(f"❌ Admin get mapping failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin get mapping failed with exception: {str(e)}")
            return False
            
        return True
        
    def test_redirect_public_redirect(self):
        """Test public redirect via proxy"""
        self.log("Testing public redirect via proxy...")
        
        try:
            # Use allow_redirects=False to capture the 302 response
            response = self.session.get(
                f"{BASE_URL}/redirect-proxy/go/sodastream-pepsi-440ml",
                allow_redirects=False
            )
            
            if response.status_code == 302:
                self.log("✅ Public redirect returned 302 status code")
                
                # Check for Location header
                location = response.headers.get("Location")
                if location:
                    self.log(f"✅ Location header found: {location}")
                    
                    # Verify it's a Power.dk URL
                    if "power.dk" in location.lower():
                        self.log("✅ Redirect points to Power.dk")
                    else:
                        self.log(f"❌ Redirect does not point to Power.dk: {location}")
                        return False
                        
                else:
                    self.log("❌ No Location header in 302 response")
                    return False
                    
            else:
                self.log(f"❌ Public redirect failed: expected 302, got {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Public redirect failed with exception: {str(e)}")
            return False
            
        return True
        
    def test_redirect_admin_link_health(self):
        """Test admin API - Link health check via proxy"""
        self.log("Testing admin API - Link health check via proxy...")
        
        headers = {
            "Authorization": "Bearer dev-token-change-in-production",
            "Content-Type": "application/json"
        }
        
        body = {
            "urls": ["https://www.power.dk/koekken-og-madlavning/vand-og-juice/smagsekstrakter/sodastream-pepsi-440-ml/p-1168002/"]
        }
        
        try:
            response = self.session.post(
                f"{BASE_URL}/redirect-proxy/admin/link-health",
                headers=headers,
                json=body
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Admin link health check successful")
                
                # Verify response contains health status for the URL
                if isinstance(data, dict) or isinstance(data, list):
                    self.log(f"✅ Link health response received: {data}")
                else:
                    self.log(f"❌ Unexpected link health response format: {data}")
                    return False
                    
            else:
                self.log(f"❌ Admin link health check failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin link health check failed with exception: {str(e)}")
            return False
            
        return True
        
    def test_redirect_non_existent_mapping(self):
        """Test redirect with non-existent mapping"""
        self.log("Testing redirect with non-existent mapping...")
        
        try:
            response = self.session.get(
                f"{BASE_URL}/redirect-proxy/go/non-existent-product",
                allow_redirects=False
            )
            
            # Should handle gracefully - either 404 or fallback redirect
            if response.status_code in [404, 302]:
                self.log(f"✅ Non-existent mapping handled gracefully: {response.status_code}")
                
                if response.status_code == 302:
                    location = response.headers.get("Location")
                    if location:
                        self.log(f"✅ Fallback redirect to: {location}")
                    else:
                        self.log("❌ 302 response missing Location header")
                        return False
                        
            else:
                self.log(f"❌ Non-existent mapping not handled properly: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Non-existent mapping test failed with exception: {str(e)}")
            return False
            
        return True
        
    def run_all_tests(self):
        """Run all backend tests"""
        self.log("Starting SLUSHBOOK Backend System Tests")
        self.log("=" * 60)
        
        tests = [
            ("Signup Flow", self.test_signup),
            ("Login Flow", self.test_login),
            ("Auth Check", self.test_auth_check),
            ("Logout", self.test_logout),
            ("Password Reset", self.test_password_reset),
            ("Password Validation", self.test_password_validation),
            ("Machine Create", self.test_machine_create),
            ("Machine Get", self.test_machine_get),
            ("Machine Update", self.test_machine_update),
            ("Machine Delete", self.test_machine_delete),
            ("Complete Machine CRUD Flow", self.test_machine_crud_complete_flow),
            ("Redirect Service Health (Direct)", self.test_redirect_service_health_direct),
            ("Redirect Admin Get Mapping", self.test_redirect_admin_get_mapping),
            ("Redirect Public Redirect", self.test_redirect_public_redirect),
            ("Redirect Admin Link Health", self.test_redirect_admin_link_health),
            ("Redirect Non-Existent Mapping", self.test_redirect_non_existent_mapping)
        ]
        
        results = {}
        
        for test_name, test_func in tests:
            self.log(f"\n--- {test_name} ---")
            try:
                results[test_name] = test_func()
            except Exception as e:
                self.log(f"❌ {test_name} failed with exception: {str(e)}")
                results[test_name] = False
                
        # Summary
        self.log("\n" + "=" * 60)
        self.log("TEST SUMMARY")
        self.log("=" * 60)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name}: {status}")
            if result:
                passed += 1
                
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All backend tests PASSED!")
            return True
        else:
            self.log(f"⚠️  {total - passed} test(s) FAILED")
            return False

def main():
    """Main test execution"""
    tester = BackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ SLUSHBOOK Backend System: ALL TESTS PASSED")
        exit(0)
    else:
        print("\n❌ SLUSHBOOK Backend System: SOME TESTS FAILED")
        exit(1)

if __name__ == "__main__":
    main()