#!/usr/bin/env python3
"""
Password Reset Fix Test
Tests using password reset to fix login issue on deployed environment
"""

import requests
import json
import time
from datetime import datetime

# Configuration
DEPLOYED_URL = "https://slushice-recipes.emergent.host/api"
TEST_EMAIL = "kimesav@gmail.com"
NEW_PASSWORD = "admin123"  # Reset to the same password

class PasswordResetFixer:
    def __init__(self):
        self.session = requests.Session()
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def fix_deployed_login(self):
        """Fix deployed login using password reset flow"""
        self.log("FIXING DEPLOYED LOGIN USING PASSWORD RESET")
        self.log("=" * 60)
        
        # Step 1: Request password reset
        self.log("\n--- Step 1: Request Password Reset ---")
        
        reset_request = {"email": TEST_EMAIL}
        
        try:
            response = self.session.post(f"{DEPLOYED_URL}/auth/forgot-password", json=reset_request, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                reset_token = data.get("reset_token")
                
                if reset_token:
                    self.log(f"✅ Password reset token received: {reset_token[:20]}...")
                    
                    # Step 2: Reset password
                    self.log("\n--- Step 2: Reset Password ---")
                    
                    reset_data = {
                        "reset_token": reset_token,
                        "new_password": NEW_PASSWORD
                    }
                    
                    reset_response = self.session.post(f"{DEPLOYED_URL}/auth/reset-password", json=reset_data, timeout=10)
                    
                    if reset_response.status_code == 200:
                        self.log("✅ Password reset successful")
                        
                        # Step 3: Test login with new password
                        self.log("\n--- Step 3: Test Login with Reset Password ---")
                        
                        login_data = {
                            "email": TEST_EMAIL,
                            "password": NEW_PASSWORD
                        }
                        
                        login_response = self.session.post(f"{DEPLOYED_URL}/auth/login", json=login_data, timeout=10)
                        
                        if login_response.status_code == 200:
                            login_result = login_response.json()
                            user_data = login_result.get('user', {})
                            
                            self.log("🎉 LOGIN SUCCESSFUL!")
                            self.log(f"User: {user_data.get('name')} ({user_data.get('email')})")
                            self.log(f"Role: {user_data.get('role')}")
                            self.log(f"Session token: {login_result.get('session_token', '')[:20]}...")
                            
                            # Step 4: Test auth check
                            self.log("\n--- Step 4: Test Auth Check ---")
                            
                            session_token = login_result.get('session_token')
                            if session_token:
                                headers = {"Authorization": f"Bearer {session_token}"}
                                auth_response = self.session.get(f"{DEPLOYED_URL}/auth/me", headers=headers, timeout=10)
                                
                                if auth_response.status_code == 200:
                                    auth_data = auth_response.json()
                                    self.log("✅ Auth check successful")
                                    self.log(f"Authenticated as: {auth_data.get('name')} ({auth_data.get('role')})")
                                    
                                    return True
                                else:
                                    self.log(f"❌ Auth check failed: {auth_response.status_code}")
                                    return False
                            else:
                                self.log("❌ No session token received")
                                return False
                                
                        else:
                            self.log(f"❌ Login still failed after password reset: {login_response.status_code}")
                            self.log(f"Response: {login_response.text}")
                            return False
                            
                    else:
                        self.log(f"❌ Password reset failed: {reset_response.status_code}")
                        self.log(f"Response: {reset_response.text}")
                        return False
                        
                else:
                    self.log("⚠️  No reset token in response (production mode)")
                    self.log("In production, check email for reset link")
                    return False
                    
            else:
                self.log(f"❌ Password reset request failed: {response.status_code}")
                self.log(f"Response: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Password reset fix failed: {str(e)}")
            return False
            
    def verify_fix(self):
        """Verify the fix by testing login multiple times"""
        self.log("\n--- VERIFICATION: Multiple Login Tests ---")
        
        login_data = {
            "email": TEST_EMAIL,
            "password": NEW_PASSWORD
        }
        
        success_count = 0
        total_tests = 3
        
        for i in range(total_tests):
            self.log(f"Login test {i+1}/{total_tests}...")
            
            try:
                response = self.session.post(f"{DEPLOYED_URL}/auth/login", json=login_data, timeout=10)
                
                if response.status_code == 200:
                    self.log(f"✅ Login test {i+1} successful")
                    success_count += 1
                else:
                    self.log(f"❌ Login test {i+1} failed: {response.status_code}")
                    
            except Exception as e:
                self.log(f"❌ Login test {i+1} error: {str(e)}")
                
            time.sleep(1)  # Brief pause between tests
            
        self.log(f"\nVerification results: {success_count}/{total_tests} login tests successful")
        
        if success_count == total_tests:
            self.log("🎉 DEPLOYED LOGIN FULLY FIXED!")
            return True
        else:
            self.log("⚠️  Login still has issues")
            return False

def main():
    """Main fix execution"""
    fixer = PasswordResetFixer()
    
    # Attempt to fix the login issue
    fix_success = fixer.fix_deployed_login()
    
    if fix_success:
        # Verify the fix works consistently
        verify_success = fixer.verify_fix()
        
        if verify_success:
            print("\n✅ DEPLOYED LOGIN: FIXED AND VERIFIED")
            exit(0)
        else:
            print("\n⚠️  DEPLOYED LOGIN: PARTIALLY FIXED")
            exit(1)
    else:
        print("\n❌ DEPLOYED LOGIN: FIX FAILED")
        exit(1)

if __name__ == "__main__":
    main()