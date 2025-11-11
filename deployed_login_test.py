#!/usr/bin/env python3
"""
SLUSHBOOK Deployed Environment Login Test
Tests login functionality on deployed environment vs preview environment
"""

import requests
import json
import time
from datetime import datetime

# Configuration
DEPLOYED_URL = "https://slushice-recipes.emergent.host/api"
PREVIEW_URL = "https://onboarding-tour.preview.emergentagent.com/api"
TEST_EMAIL = "kimesav@gmail.com"
TEST_PASSWORD = "admin123"

class DeployedLoginTester:
    def __init__(self):
        self.session = requests.Session()
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def test_backend_connectivity(self, base_url, env_name):
        """Test basic backend connectivity"""
        self.log(f"Testing {env_name} backend connectivity...")
        
        try:
            # Test 1: Basic health check via auth/me (should return 401 for unauthenticated)
            response = self.session.get(f"{base_url}/auth/me", timeout=10)
            
            if response.status_code == 401:
                self.log(f"✅ {env_name} backend responding (401 unauthorized as expected)")
                return True
            elif response.status_code == 200:
                self.log(f"⚠️  {env_name} backend responding but user already authenticated")
                return True
            else:
                self.log(f"❌ {env_name} backend unexpected response: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.ConnectTimeout:
            self.log(f"❌ {env_name} backend connection timeout")
            return False
        except requests.exceptions.ConnectionError as e:
            self.log(f"❌ {env_name} backend connection error: {str(e)}")
            return False
        except Exception as e:
            self.log(f"❌ {env_name} backend error: {str(e)}")
            return False
            
    def test_login_endpoint(self, base_url, env_name):
        """Test login endpoint with specific credentials"""
        self.log(f"Testing {env_name} login endpoint...")
        
        login_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        try:
            response = self.session.post(
                f"{base_url}/auth/login", 
                json=login_data,
                timeout=10,
                headers={"Content-Type": "application/json"}
            )
            
            self.log(f"{env_name} login response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ {env_name} login successful")
                self.log(f"User: {data.get('user', {}).get('name')} ({data.get('user', {}).get('email')})")
                
                # Check for session token
                session_token = data.get('session_token')
                if session_token:
                    self.log(f"✅ Session token received: {session_token[:20]}...")
                else:
                    self.log("❌ No session token in response")
                    
                # Check for cookies
                cookies = response.cookies
                if 'session_token' in cookies:
                    self.log("✅ Session token set in cookies")
                else:
                    self.log("❌ Session token not set in cookies")
                    
                return True, data
                
            elif response.status_code == 401:
                self.log(f"❌ {env_name} login failed: 401 Unauthorized")
                try:
                    error_data = response.json()
                    self.log(f"Error details: {error_data}")
                except:
                    self.log(f"Error response: {response.text}")
                return False, None
                
            else:
                self.log(f"❌ {env_name} login failed: {response.status_code}")
                self.log(f"Response: {response.text}")
                return False, None
                
        except Exception as e:
            self.log(f"❌ {env_name} login request failed: {str(e)}")
            return False, None
            
    def test_auth_check_with_token(self, base_url, env_name, session_token):
        """Test auth check with session token"""
        self.log(f"Testing {env_name} auth check with session token...")
        
        try:
            # Test with Authorization header
            headers = {"Authorization": f"Bearer {session_token}"}
            response = self.session.get(f"{base_url}/auth/me", headers=headers, timeout=10)
            
            if response.status_code == 200:
                user_data = response.json()
                self.log(f"✅ {env_name} auth check successful with token")
                self.log(f"User: {user_data.get('name')} ({user_data.get('email')})")
                return True
            else:
                self.log(f"❌ {env_name} auth check failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ {env_name} auth check request failed: {str(e)}")
            return False
            
    def test_user_exists_check(self, base_url, env_name):
        """Test if user exists by attempting signup with same email"""
        self.log(f"Testing if user {TEST_EMAIL} exists in {env_name}...")
        
        signup_data = {
            "email": TEST_EMAIL,
            "password": "testpassword123",
            "name": "Test User"
        }
        
        try:
            response = self.session.post(
                f"{base_url}/auth/signup",
                json=signup_data,
                timeout=10
            )
            
            if response.status_code == 400:
                try:
                    error_data = response.json()
                    if "already registered" in error_data.get("detail", "").lower():
                        self.log(f"✅ {env_name} user {TEST_EMAIL} exists (signup rejected)")
                        return True
                except:
                    pass
                self.log(f"⚠️  {env_name} signup returned 400 but unclear if user exists")
                return False
            elif response.status_code == 200:
                self.log(f"❌ {env_name} user {TEST_EMAIL} does NOT exist (signup succeeded)")
                return False
            else:
                self.log(f"⚠️  {env_name} signup test inconclusive: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ {env_name} user existence check failed: {str(e)}")
            return False
            
    def check_backend_logs(self):
        """Check backend logs for login attempts"""
        self.log("Checking backend logs...")
        
        try:
            import subprocess
            result = subprocess.run(
                ["tail", "-n", "100", "/var/log/supervisor/backend.err.log"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                logs = result.stdout
                if logs.strip():
                    self.log("Backend error logs (last 100 lines):")
                    self.log("=" * 50)
                    print(logs)
                    self.log("=" * 50)
                else:
                    self.log("No recent backend error logs found")
            else:
                self.log("Could not read backend error logs")
                
        except Exception as e:
            self.log(f"Failed to check backend logs: {str(e)}")
            
    def compare_environments(self):
        """Compare login behavior between preview and deployed environments"""
        self.log("COMPARING PREVIEW vs DEPLOYED ENVIRONMENTS")
        self.log("=" * 60)
        
        # Test 1: Backend Connectivity
        self.log("\n--- Backend Connectivity Test ---")
        preview_connected = self.test_backend_connectivity(PREVIEW_URL, "PREVIEW")
        deployed_connected = self.test_backend_connectivity(DEPLOYED_URL, "DEPLOYED")
        
        # Test 2: User Existence Check
        self.log("\n--- User Existence Check ---")
        preview_user_exists = self.test_user_exists_check(PREVIEW_URL, "PREVIEW")
        deployed_user_exists = self.test_user_exists_check(DEPLOYED_URL, "DEPLOYED")
        
        # Test 3: Login Attempts
        self.log("\n--- Login Attempts ---")
        preview_login_success, preview_data = self.test_login_endpoint(PREVIEW_URL, "PREVIEW")
        deployed_login_success, deployed_data = self.test_login_endpoint(DEPLOYED_URL, "DEPLOYED")
        
        # Test 4: Auth Check with Token (if preview login succeeded)
        if preview_login_success and preview_data:
            self.log("\n--- Auth Check with Preview Token ---")
            session_token = preview_data.get('session_token')
            if session_token:
                # Test token on preview environment
                self.test_auth_check_with_token(PREVIEW_URL, "PREVIEW", session_token)
                # Test same token on deployed environment (should fail due to different DB)
                self.test_auth_check_with_token(DEPLOYED_URL, "DEPLOYED", session_token)
        
        # Test 5: Check backend logs
        self.log("\n--- Backend Logs Check ---")
        self.check_backend_logs()
        
        # Summary
        self.log("\n" + "=" * 60)
        self.log("COMPARISON SUMMARY")
        self.log("=" * 60)
        
        self.log(f"Preview Environment:")
        self.log(f"  - Backend Connected: {'✅' if preview_connected else '❌'}")
        self.log(f"  - User Exists: {'✅' if preview_user_exists else '❌'}")
        self.log(f"  - Login Success: {'✅' if preview_login_success else '❌'}")
        
        self.log(f"Deployed Environment:")
        self.log(f"  - Backend Connected: {'✅' if deployed_connected else '❌'}")
        self.log(f"  - User Exists: {'✅' if deployed_user_exists else '❌'}")
        self.log(f"  - Login Success: {'✅' if deployed_login_success else '❌'}")
        
        # Diagnosis
        self.log("\n--- DIAGNOSIS ---")
        if not deployed_connected:
            self.log("🔍 ISSUE: Deployed backend is not responding or not accessible")
        elif not deployed_user_exists:
            self.log("🔍 ISSUE: User kimesav@gmail.com does not exist in deployed environment database")
        elif deployed_connected and deployed_user_exists and not deployed_login_success:
            self.log("🔍 ISSUE: User exists but login fails - possible password hash mismatch or authentication logic issue")
        elif deployed_login_success:
            self.log("✅ No issue found - login working on deployed environment")
        else:
            self.log("🔍 ISSUE: Complex issue requiring further investigation")
            
        return {
            'preview_connected': preview_connected,
            'deployed_connected': deployed_connected,
            'preview_user_exists': preview_user_exists,
            'deployed_user_exists': deployed_user_exists,
            'preview_login_success': preview_login_success,
            'deployed_login_success': deployed_login_success
        }

def main():
    """Main test execution"""
    tester = DeployedLoginTester()
    results = tester.compare_environments()
    
    if results['deployed_login_success']:
        print("\n✅ DEPLOYED LOGIN: WORKING")
        exit(0)
    else:
        print("\n❌ DEPLOYED LOGIN: FAILING")
        exit(1)

if __name__ == "__main__":
    main()