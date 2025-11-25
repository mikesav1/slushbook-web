#!/usr/bin/env python3
"""
URGENT LOGIN TEST - Test specific users as requested in review
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "https://bugfix-intl-tour.preview.emergentagent.com/api"

def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

def test_login(email, password):
    """Test login for specific user"""
    log(f"Testing login for: {email}")
    
    session = requests.Session()
    
    login_data = {
        "email": email,
        "password": password
    }
    
    try:
        response = session.post(f"{BASE_URL}/auth/login", json=login_data)
        
        log(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            session_token = data.get("session_token")
            user_data = data.get("user", {})
            
            log(f"✅ LOGIN SUCCESS for {email}")
            log(f"✅ Session token: {session_token[:20] if session_token else 'None'}...")
            log(f"✅ User data: {user_data}")
            
            # Test session validation
            auth_response = session.get(f"{BASE_URL}/auth/me")
            if auth_response.status_code == 200:
                auth_user_data = auth_response.json()
                log(f"✅ Session validation successful: {auth_user_data}")
                return True, "Login and session validation successful"
            else:
                log(f"❌ Session validation failed: {auth_response.status_code}")
                return False, f"Session validation failed: {auth_response.status_code}"
                
        elif response.status_code == 401:
            error_text = response.text
            log(f"❌ LOGIN FAILED: 401 - {error_text}")
            
            if "Invalid email or password" in error_text:
                return False, "Invalid email or password (user may not exist or wrong password)"
            else:
                return False, f"Authentication failed: {error_text}"
                
        else:
            log(f"❌ LOGIN FAILED: {response.status_code} - {response.text}")
            return False, f"HTTP {response.status_code}: {response.text}"
            
    except Exception as e:
        log(f"❌ LOGIN FAILED with exception: {str(e)}")
        return False, f"Exception: {str(e)}"

def main():
    log("🚨 URGENT LOGIN VERIFICATION TEST")
    log("=" * 60)
    
    # Test cases from review request
    test_cases = [
        ("ulla@itopgaver.dk", "mille0188"),
        ("kimesav@gmail.com", "admin123")
    ]
    
    results = {}
    
    for email, password in test_cases:
        log(f"\n--- Testing {email} / {password} ---")
        success, message = test_login(email, password)
        results[email] = {
            "success": success,
            "message": message
        }
    
    # Summary
    log("\n" + "=" * 60)
    log("🚨 URGENT LOGIN TEST SUMMARY")
    log("=" * 60)
    
    all_passed = True
    
    for email, result in results.items():
        status = "✅ PASS" if result["success"] else "❌ FAIL"
        log(f"{email}: {status}")
        log(f"   Message: {result['message']}")
        
        if not result["success"]:
            all_passed = False
    
    if all_passed:
        log("\n✅ ALL LOGIN TESTS PASSED - Users can access the site")
    else:
        log("\n❌ LOGIN ISSUES DETECTED - Users cannot access the site")
        log("\n🔍 TROUBLESHOOTING:")
        log("   1. Check backend logs: tail -f /var/log/supervisor/backend.err.log")
        log("   2. Verify users exist in database")
        log("   3. Check password hashes are correct")
    
    return all_passed

if __name__ == "__main__":
    main()