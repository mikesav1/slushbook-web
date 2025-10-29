#!/usr/bin/env python3
"""
DETAILED LOGIN TEST - Check HTTP status codes, error messages, and backend logs
"""

import requests
import json
import subprocess
from datetime import datetime

# Configuration
BASE_URL = "https://responsive-ads.preview.emergentagent.com/api"

def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

def check_backend_logs():
    """Check backend logs for auth errors"""
    log("Checking backend logs for auth errors...")
    try:
        result = subprocess.run(['tail', '-n', '20', '/var/log/supervisor/backend.err.log'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            log("Recent backend logs:")
            for line in result.stdout.split('\n')[-10:]:
                if line.strip() and ('login' in line.lower() or 'auth' in line.lower() or 'password' in line.lower()):
                    log(f"  {line}")
        else:
            log("Could not read backend logs")
    except Exception as e:
        log(f"Error reading logs: {e}")

def detailed_login_test(email, password):
    """Detailed login test with full response analysis"""
    log(f"\n{'='*50}")
    log(f"DETAILED LOGIN TEST: {email}")
    log(f"{'='*50}")
    
    session = requests.Session()
    
    login_data = {
        "email": email,
        "password": password
    }
    
    try:
        log(f"Sending POST request to: {BASE_URL}/auth/login")
        log(f"Request body: {json.dumps(login_data, indent=2)}")
        
        response = session.post(f"{BASE_URL}/auth/login", json=login_data)
        
        log(f"\nRESPONSE DETAILS:")
        log(f"Status Code: {response.status_code}")
        log(f"Status Text: {response.reason}")
        log(f"Headers: {dict(response.headers)}")
        
        try:
            response_json = response.json()
            log(f"Response Body: {json.dumps(response_json, indent=2)}")
        except:
            log(f"Response Body (text): {response.text}")
        
        if response.status_code == 200:
            log("✅ LOGIN SUCCESSFUL")
            
            # Check cookies
            cookies = response.cookies
            log(f"Cookies set: {dict(cookies)}")
            
            # Test session validation
            log("\nTesting session validation...")
            auth_response = session.get(f"{BASE_URL}/auth/me")
            log(f"Auth check status: {auth_response.status_code}")
            
            if auth_response.status_code == 200:
                auth_data = auth_response.json()
                log(f"Auth check response: {json.dumps(auth_data, indent=2)}")
                log("✅ SESSION VALIDATION SUCCESSFUL")
                return True
            else:
                log(f"❌ SESSION VALIDATION FAILED: {auth_response.status_code}")
                return False
                
        else:
            log("❌ LOGIN FAILED")
            
            # Analyze error response
            if response.status_code == 401:
                log("Error Type: Unauthorized (401)")
                if "Invalid email or password" in response.text:
                    log("Error Reason: Invalid credentials")
                else:
                    log(f"Error Reason: {response.text}")
            elif response.status_code == 404:
                log("Error Type: Not Found (404) - User does not exist")
            elif response.status_code == 500:
                log("Error Type: Internal Server Error (500)")
            else:
                log(f"Error Type: HTTP {response.status_code}")
            
            return False
            
    except Exception as e:
        log(f"❌ REQUEST FAILED with exception: {str(e)}")
        return False

def main():
    log("🔍 DETAILED LOGIN ANALYSIS")
    log("=" * 60)
    
    # Test cases from review request
    test_cases = [
        ("ulla@itopgaver.dk", "mille0188"),
        ("kimesav@gmail.com", "admin123")
    ]
    
    results = {}
    
    for email, password in test_cases:
        success = detailed_login_test(email, password)
        results[email] = success
        
        # Check backend logs after each test
        check_backend_logs()
    
    # Test with wrong password to see error handling
    log(f"\n{'='*50}")
    log("TESTING ERROR HANDLING - Wrong Password")
    log(f"{'='*50}")
    detailed_login_test("ulla@itopgaver.dk", "wrong_password")
    check_backend_logs()
    
    # Summary
    log("\n" + "=" * 60)
    log("DETAILED LOGIN TEST SUMMARY")
    log("=" * 60)
    
    all_passed = True
    
    for email, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        log(f"{email}: {status}")
        
        if not result:
            all_passed = False
    
    if all_passed:
        log("\n✅ ALL LOGIN TESTS PASSED")
        log("🔍 FINDINGS:")
        log("   - Both users exist in database")
        log("   - Passwords are correct")
        log("   - Session tokens are generated properly")
        log("   - Authentication system is working correctly")
    else:
        log("\n❌ SOME LOGIN TESTS FAILED")
    
    return all_passed

if __name__ == "__main__":
    main()