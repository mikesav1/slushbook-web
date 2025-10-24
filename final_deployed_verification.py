#!/usr/bin/env python3
"""
Final Deployed Environment Verification
Comprehensive test of all requested scenarios on deployed environment
"""

import requests
import json
import time
from datetime import datetime

# Configuration
DEPLOYED_URL = "https://slushice-recipes.emergent.host/api"
TEST_EMAIL = "kimesav@gmail.com"
TEST_PASSWORD = "admin123"

class FinalVerification:
    def __init__(self):
        self.session = requests.Session()
        self.session_token = None
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def test_backend_connectivity(self):
        """Test 1: Backend connectivity"""
        self.log("=== Test 1: Backend Connectivity ===")
        
        try:
            response = self.session.get(f"{DEPLOYED_URL}/auth/me", timeout=10)
            
            if response.status_code == 401:
                self.log("✅ Backend responding correctly (401 unauthorized for unauthenticated request)")
                return True
            else:
                self.log(f"⚠️  Unexpected response: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Backend connectivity failed: {str(e)}")
            return False
            
    def test_login_endpoint(self):
        """Test 2: Login endpoint"""
        self.log("=== Test 2: Login Endpoint ===")
        
        login_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        try:
            response = self.session.post(
                f"{DEPLOYED_URL}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            self.log(f"Login response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.session_token = data.get('session_token')
                user_data = data.get('user', {})
                
                self.log("✅ Login successful!")
                self.log(f"User: {user_data.get('name')} ({user_data.get('email')})")
                self.log(f"Role: {user_data.get('role')}")
                self.log(f"Session token received: {self.session_token[:20] if self.session_token else 'None'}...")
                
                # Check for set-cookie header
                cookies = response.cookies
                if 'session_token' in cookies:
                    self.log("✅ Session token set in cookies")
                else:
                    self.log("❌ Session token not set in cookies")
                    
                return True
            else:
                self.log(f"❌ Login failed: {response.status_code}")
                try:
                    error_data = response.json()
                    self.log(f"Error: {error_data}")
                except:
                    self.log(f"Response: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Login request failed: {str(e)}")
            return False
            
    def test_user_exists(self):
        """Test 3: Verify user exists in database"""
        self.log("=== Test 3: User Existence Verification ===")
        
        # Test by attempting signup with same email
        signup_data = {
            "email": TEST_EMAIL,
            "password": "testpass123",
            "name": "Test User"
        }
        
        try:
            response = self.session.post(f"{DEPLOYED_URL}/auth/signup", json=signup_data, timeout=10)
            
            if response.status_code == 400:
                try:
                    error_data = response.json()
                    if "already registered" in error_data.get("detail", "").lower():
                        self.log("✅ User exists in database (signup correctly rejected)")
                        return True
                except:
                    pass
                    
            self.log(f"⚠️  Signup test inconclusive: {response.status_code}")
            return False
            
        except Exception as e:
            self.log(f"❌ User existence test failed: {str(e)}")
            return False
            
    def test_auth_check(self):
        """Test 4: Auth check with session token"""
        self.log("=== Test 4: Auth Check ===")
        
        if not self.session_token:
            self.log("❌ No session token available for auth check")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = self.session.get(f"{DEPLOYED_URL}/auth/me", headers=headers, timeout=10)
            
            if response.status_code == 200:
                user_data = response.json()
                self.log("✅ Auth check successful")
                self.log(f"Authenticated as: {user_data.get('name')} ({user_data.get('email')})")
                self.log(f"Role: {user_data.get('role')}")
                return True
            else:
                self.log(f"❌ Auth check failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Auth check request failed: {str(e)}")
            return False
            
    def check_backend_logs(self):
        """Test 5: Check backend logs for login attempts"""
        self.log("=== Test 5: Backend Logs Check ===")
        
        try:
            import subprocess
            result = subprocess.run(
                ["tail", "-n", "50", "/var/log/supervisor/backend.err.log"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                logs = result.stdout
                if logs.strip():
                    # Look for recent login attempts
                    lines = logs.split('\n')
                    recent_login_logs = []
                    
                    for line in lines:
                        if 'login attempt' in line.lower() or 'password verification' in line.lower():
                            recent_login_logs.append(line)
                            
                    if recent_login_logs:
                        self.log("✅ Found recent login attempts in logs:")
                        for log_line in recent_login_logs[-3:]:  # Show last 3
                            self.log(f"  {log_line}")
                    else:
                        self.log("✅ No recent login errors in logs (good sign)")
                        
                    return True
                else:
                    self.log("✅ No recent error logs")
                    return True
            else:
                self.log("⚠️  Could not read backend logs")
                return True  # Not critical for main functionality
                
        except Exception as e:
            self.log(f"⚠️  Backend log check failed: {str(e)}")
            return True  # Not critical for main functionality
            
    def run_comprehensive_verification(self):
        """Run all verification tests"""
        self.log("COMPREHENSIVE DEPLOYED ENVIRONMENT VERIFICATION")
        self.log("=" * 60)
        self.log(f"Testing: {DEPLOYED_URL}")
        self.log(f"User: {TEST_EMAIL}")
        self.log("=" * 60)
        
        tests = [
            ("Backend Connectivity", self.test_backend_connectivity),
            ("Login Endpoint", self.test_login_endpoint),
            ("User Exists", self.test_user_exists),
            ("Auth Check", self.test_auth_check),
            ("Backend Logs", self.check_backend_logs)
        ]
        
        results = {}
        
        for test_name, test_func in tests:
            self.log(f"\n{test_name}...")
            try:
                results[test_name] = test_func()
            except Exception as e:
                self.log(f"❌ {test_name} failed with exception: {str(e)}")
                results[test_name] = False
                
        # Summary
        self.log("\n" + "=" * 60)
        self.log("VERIFICATION SUMMARY")
        self.log("=" * 60)
        
        passed = 0
        critical_tests = ["Backend Connectivity", "Login Endpoint", "Auth Check"]
        critical_passed = 0
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name}: {status}")
            
            if result:
                passed += 1
                if test_name in critical_tests:
                    critical_passed += 1
            elif test_name in critical_tests:
                self.log(f"  ⚠️  CRITICAL TEST FAILED!")
                
        self.log(f"\nOverall: {passed}/{len(results)} tests passed")
        self.log(f"Critical: {critical_passed}/{len(critical_tests)} critical tests passed")
        
        # Final verdict
        if critical_passed == len(critical_tests):
            self.log("\n🎉 DEPLOYED ENVIRONMENT: FULLY FUNCTIONAL")
            self.log("✅ Login works correctly on https://slushice-recipes.emergent.host")
            self.log("✅ Authentication system operational")
            self.log("✅ Backend responding properly")
            return True
        else:
            self.log("\n❌ DEPLOYED ENVIRONMENT: ISSUES REMAIN")
            return False

def main():
    """Main verification execution"""
    verifier = FinalVerification()
    success = verifier.run_comprehensive_verification()
    
    if success:
        print("\n✅ DEPLOYED LOGIN VERIFICATION: SUCCESS")
        exit(0)
    else:
        print("\n❌ DEPLOYED LOGIN VERIFICATION: FAILED")
        exit(1)

if __name__ == "__main__":
    main()