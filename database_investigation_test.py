#!/usr/bin/env python3
"""
Database Investigation Test
Investigates database differences between preview and deployed environments
"""

import requests
import json
import time
from datetime import datetime

# Configuration
DEPLOYED_URL = "https://slushice-recipes.emergent.host/api"
PREVIEW_URL = "https://prod-onboard.preview.emergentagent.com/api"
TEST_EMAIL = "kimesav@gmail.com"
TEST_PASSWORD = "admin123"

class DatabaseInvestigator:
    def __init__(self):
        self.session = requests.Session()
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def test_admin_endpoints(self, base_url, env_name, session_token):
        """Test admin endpoints to get user information"""
        self.log(f"Testing {env_name} admin endpoints...")
        
        headers = {"Authorization": f"Bearer {session_token}"}
        
        try:
            # Try to get all members (admin only)
            response = self.session.get(f"{base_url}/admin/members", headers=headers, timeout=10)
            
            if response.status_code == 200:
                members = response.json()
                self.log(f"✅ {env_name} admin members endpoint accessible")
                self.log(f"Total members: {len(members)}")
                
                # Look for our test user
                target_user = None
                for member in members:
                    if member.get('email') == TEST_EMAIL:
                        target_user = member
                        break
                        
                if target_user:
                    self.log(f"✅ Found user {TEST_EMAIL} in {env_name}")
                    self.log(f"User details: ID={target_user.get('id')}, Name={target_user.get('name')}, Role={target_user.get('role')}")
                    
                    # Get detailed user info
                    user_id = target_user.get('id') or target_user.get('email')
                    detail_response = self.session.get(f"{base_url}/admin/members/{user_id}/details", headers=headers, timeout=10)
                    
                    if detail_response.status_code == 200:
                        user_details = detail_response.json()
                        self.log(f"✅ {env_name} user details retrieved")
                        self.log(f"Created at: {user_details.get('created_at')}")
                        self.log(f"Has hashed_password field: {'hashed_password' in user_details}")
                        return True, target_user
                    else:
                        self.log(f"❌ {env_name} user details failed: {detail_response.status_code}")
                        return True, target_user
                else:
                    self.log(f"❌ User {TEST_EMAIL} NOT found in {env_name} members list")
                    return False, None
                    
            elif response.status_code == 403:
                self.log(f"❌ {env_name} admin access denied (user not admin)")
                return False, None
            else:
                self.log(f"❌ {env_name} admin members failed: {response.status_code} - {response.text}")
                return False, None
                
        except Exception as e:
            self.log(f"❌ {env_name} admin endpoint test failed: {str(e)}")
            return False, None
            
    def test_password_reset_flow(self, base_url, env_name):
        """Test password reset to see if user exists in database"""
        self.log(f"Testing {env_name} password reset flow...")
        
        try:
            reset_data = {"email": TEST_EMAIL}
            response = self.session.post(f"{base_url}/auth/forgot-password", json=reset_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                reset_token = data.get('reset_token')
                
                if reset_token:
                    self.log(f"✅ {env_name} password reset token generated: {reset_token[:20]}...")
                    self.log(f"✅ This confirms user {TEST_EMAIL} exists in {env_name} database")
                    return True, reset_token
                else:
                    self.log(f"⚠️  {env_name} password reset response without token (production mode)")
                    return True, None
            else:
                self.log(f"❌ {env_name} password reset failed: {response.status_code} - {response.text}")
                return False, None
                
        except Exception as e:
            self.log(f"❌ {env_name} password reset test failed: {str(e)}")
            return False, None
            
    def test_create_admin_user(self, base_url, env_name, session_token):
        """Test creating the admin user if it doesn't exist"""
        self.log(f"Testing {env_name} admin user creation...")
        
        headers = {"Authorization": f"Bearer {session_token}"}
        
        user_data = {
            "email": TEST_EMAIL,
            "name": "Admin",
            "password": TEST_PASSWORD,
            "role": "admin"
        }
        
        try:
            response = self.session.post(f"{base_url}/admin/members/create", json=user_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ {env_name} admin user created successfully: {data}")
                return True
            elif response.status_code == 400:
                error_data = response.json()
                if "already registered" in error_data.get("detail", "").lower():
                    self.log(f"✅ {env_name} admin user already exists")
                    return True
                else:
                    self.log(f"❌ {env_name} admin user creation failed: {error_data}")
                    return False
            else:
                self.log(f"❌ {env_name} admin user creation failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ {env_name} admin user creation test failed: {str(e)}")
            return False
            
    def investigate_databases(self):
        """Investigate database differences between environments"""
        self.log("INVESTIGATING DATABASE DIFFERENCES")
        self.log("=" * 60)
        
        # Step 1: Login to preview environment to get admin token
        self.log("\n--- Step 1: Get Preview Admin Token ---")
        login_data = {"email": TEST_EMAIL, "password": TEST_PASSWORD}
        
        preview_response = self.session.post(f"{PREVIEW_URL}/auth/login", json=login_data)
        
        if preview_response.status_code == 200:
            preview_data = preview_response.json()
            preview_token = preview_data.get('session_token')
            preview_user = preview_data.get('user', {})
            
            self.log(f"✅ Preview login successful")
            self.log(f"User role: {preview_user.get('role')}")
            
            if preview_user.get('role') == 'admin':
                # Step 2: Check preview database
                self.log("\n--- Step 2: Check Preview Database ---")
                preview_admin_success, preview_user_data = self.test_admin_endpoints(PREVIEW_URL, "PREVIEW", preview_token)
                
                # Step 3: Check deployed database using password reset
                self.log("\n--- Step 3: Check Deployed Database ---")
                deployed_reset_success, deployed_reset_token = self.test_password_reset_flow(DEPLOYED_URL, "DEPLOYED")
                
                # Step 4: Try to create admin user in deployed environment if we have admin access
                if preview_admin_success:
                    self.log("\n--- Step 4: Try Admin Operations on Deployed ---")
                    
                    # First try to access deployed admin endpoints (will fail without valid session)
                    deployed_admin_success, deployed_user_data = self.test_admin_endpoints(DEPLOYED_URL, "DEPLOYED", preview_token)
                    
                    if not deployed_admin_success:
                        self.log("Expected: Deployed admin access failed with preview token (different databases)")
                        
                        # Try to create a temporary admin user to investigate
                        self.log("Attempting to create temporary admin user for investigation...")
                        
                        # Create a temporary user first
                        temp_email = f"temp.admin.{int(time.time())}@example.com"
                        temp_password = "temppass123"
                        
                        temp_signup = {
                            "email": temp_email,
                            "password": temp_password,
                            "name": "Temp Admin"
                        }
                        
                        signup_response = self.session.post(f"{DEPLOYED_URL}/auth/signup", json=temp_signup)
                        
                        if signup_response.status_code == 200:
                            self.log(f"✅ Temporary user created: {temp_email}")
                            
                            # Login as temp user
                            temp_login = self.session.post(f"{DEPLOYED_URL}/auth/login", json={
                                "email": temp_email,
                                "password": temp_password
                            })
                            
                            if temp_login.status_code == 200:
                                temp_data = temp_login.json()
                                temp_token = temp_data.get('session_token')
                                
                                self.log("✅ Temporary user login successful")
                                
                                # Check if we can see members (probably not, as temp user is not admin)
                                temp_admin_check, _ = self.test_admin_endpoints(DEPLOYED_URL, "DEPLOYED", temp_token)
                                
                                if not temp_admin_check:
                                    self.log("Expected: Temp user doesn't have admin access")
                                    
                # Summary
                self.log("\n--- INVESTIGATION SUMMARY ---")
                
                if preview_admin_success and deployed_reset_success:
                    self.log("🔍 FINDINGS:")
                    self.log("  - Preview environment: User exists and has admin access")
                    self.log("  - Deployed environment: User exists (password reset works) but login fails")
                    self.log("  - This suggests different password hashes in different databases")
                    self.log("  - OR different authentication logic/configuration")
                    
                    self.log("\n💡 RECOMMENDED ACTIONS:")
                    self.log("  1. Check if deployed environment uses different database")
                    self.log("  2. Verify password hash for kimesav@gmail.com in deployed database")
                    self.log("  3. Check if authentication configuration differs between environments")
                    self.log("  4. Consider using password reset flow to set known password in deployed environment")
                    
                elif not deployed_reset_success:
                    self.log("🔍 FINDINGS:")
                    self.log("  - User may not exist in deployed database at all")
                    self.log("  - Deployed environment may use completely different database")
                    
                else:
                    self.log("🔍 FINDINGS:")
                    self.log("  - Complex authentication issue requiring deeper investigation")
                    
            else:
                self.log("❌ Preview user is not admin, cannot perform database investigation")
                
        else:
            self.log(f"❌ Preview login failed: {preview_response.status_code}")
            self.log("Cannot proceed with database investigation without admin access")

def main():
    """Main investigation execution"""
    investigator = DatabaseInvestigator()
    investigator.investigate_databases()

if __name__ == "__main__":
    main()