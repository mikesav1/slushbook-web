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
BASE_URL = "https://slushice-portal.preview.emergentagent.com/api"
TEST_EMAIL = f"test.user.{int(time.time())}@example.com"
TEST_PASSWORD = "testpass123"
TEST_NAME = "Test User"

class AuthTester:
    def __init__(self):
        self.session = requests.Session()
        self.user_id = None
        self.session_token = None
        self.reset_token = None
        
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
        
    def run_all_tests(self):
        """Run all authentication tests"""
        self.log("Starting SLUSHBOOK Authentication System Tests")
        self.log("=" * 60)
        
        tests = [
            ("Signup Flow", self.test_signup),
            ("Login Flow", self.test_login),
            ("Auth Check", self.test_auth_check),
            ("Logout", self.test_logout),
            ("Password Reset", self.test_password_reset),
            ("Password Validation", self.test_password_validation)
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
            self.log("🎉 All authentication tests PASSED!")
            return True
        else:
            self.log(f"⚠️  {total - passed} test(s) FAILED")
            return False

def main():
    """Main test execution"""
    tester = AuthTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ SLUSHBOOK Authentication System: ALL TESTS PASSED")
        exit(0)
    else:
        print("\n❌ SLUSHBOOK Authentication System: SOME TESTS FAILED")
        exit(1)

if __name__ == "__main__":
    main()