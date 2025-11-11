#!/usr/bin/env python3
"""
Dual Environment Login Test
Tests login on BOTH preview and production URLs as requested
"""

import requests
import json
from datetime import datetime

def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

def test_login_both_environments():
    """Test login on BOTH preview and production URLs as requested"""
    log("=" * 80)
    log("TESTING LOGIN ON BOTH PREVIEW AND PRODUCTION ENVIRONMENTS")
    log("=" * 80)
    
    # Test credentials
    test_users = [
        ("ulla@itopgaver.dk", "mille0188"),
        ("kimesav@gmail.com", "admin123")
    ]
    
    # Environment URLs
    environments = {
        "PREVIEW": "https://onboarding-tour.preview.emergentagent.com/api",
        "PRODUCTION": "https://slushice-recipes.emergent.host/api"
    }
    
    results = {}
    
    for env_name, base_url in environments.items():
        log(f"\n{'='*20} TESTING {env_name} ENVIRONMENT {'='*20}")
        log(f"URL: {base_url}")
        
        env_results = {}
        
        for email, password in test_users:
            log(f"\n--- Testing {email} on {env_name} ---")
            
            try:
                # Create fresh session for each test
                test_session = requests.Session()
                
                login_data = {
                    "email": email,
                    "password": password
                }
                
                # Attempt login
                response = test_session.post(f"{base_url}/auth/login", json=login_data)
                
                log(f"Login attempt: POST {base_url}/auth/login")
                log(f"Status Code: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    session_token = data.get("session_token")
                    user_data = data.get("user", {})
                    
                    log(f"✅ LOGIN SUCCESS on {env_name}")
                    log(f"   Session token: {session_token[:20] if session_token else 'None'}...")
                    log(f"   User: {user_data.get('name')} ({user_data.get('email')})")
                    log(f"   Role: {user_data.get('role')}")
                    log(f"   User ID: {user_data.get('id')}")
                    
                    # Test session validation
                    auth_response = test_session.get(f"{base_url}/auth/me")
                    if auth_response.status_code == 200:
                        log(f"✅ Session validation successful on {env_name}")
                        env_results[email] = {
                            "login_success": True,
                            "session_valid": True,
                            "user_data": user_data,
                            "error": None
                        }
                    else:
                        log(f"❌ Session validation failed on {env_name}: {auth_response.status_code}")
                        env_results[email] = {
                            "login_success": True,
                            "session_valid": False,
                            "user_data": user_data,
                            "error": f"Session validation failed: {auth_response.status_code}"
                        }
                
                elif response.status_code == 401:
                    error_text = response.text
                    log(f"❌ LOGIN FAILED on {env_name}: 401 Unauthorized")
                    log(f"   Error message: {error_text}")
                    
                    env_results[email] = {
                        "login_success": False,
                        "session_valid": False,
                        "user_data": None,
                        "error": f"401 Unauthorized: {error_text}"
                    }
                
                else:
                    error_text = response.text
                    log(f"❌ LOGIN FAILED on {env_name}: {response.status_code}")
                    log(f"   Error message: {error_text}")
                    
                    env_results[email] = {
                        "login_success": False,
                        "session_valid": False,
                        "user_data": None,
                        "error": f"{response.status_code}: {error_text}"
                    }
            
            except Exception as e:
                log(f"❌ EXCEPTION on {env_name} for {email}: {str(e)}")
                env_results[email] = {
                    "login_success": False,
                    "session_valid": False,
                    "user_data": None,
                    "error": f"Exception: {str(e)}"
                }
        
        results[env_name] = env_results
    
    # Compare results between environments
    log(f"\n{'='*20} COMPARISON ANALYSIS {'='*20}")
    
    for email, _ in test_users:
        log(f"\n--- {email} Comparison ---")
        
        preview_result = results["PREVIEW"].get(email, {})
        production_result = results["PRODUCTION"].get(email, {})
        
        preview_success = preview_result.get("login_success", False)
        production_success = production_result.get("login_success", False)
        
        if preview_success and production_success:
            log(f"✅ {email}: SUCCESS on both environments")
            
            # Compare user data
            preview_user = preview_result.get("user_data", {})
            production_user = production_result.get("user_data", {})
            
            if preview_user.get("id") == production_user.get("id"):
                log(f"✅ Same user ID on both environments: {preview_user.get('id')}")
            else:
                log(f"⚠️  Different user IDs: Preview={preview_user.get('id')}, Production={production_user.get('id')}")
            
            if preview_user.get("role") == production_user.get("role"):
                log(f"✅ Same role on both environments: {preview_user.get('role')}")
            else:
                log(f"⚠️  Different roles: Preview={preview_user.get('role')}, Production={production_user.get('role')}")
        
        elif preview_success and not production_success:
            log(f"⚠️  {email}: SUCCESS on Preview, FAILED on Production")
            log(f"   Production error: {production_result.get('error')}")
        
        elif not preview_success and production_success:
            log(f"⚠️  {email}: FAILED on Preview, SUCCESS on Production")
            log(f"   Preview error: {preview_result.get('error')}")
        
        else:
            log(f"❌ {email}: FAILED on both environments")
            log(f"   Preview error: {preview_result.get('error')}")
            log(f"   Production error: {production_result.get('error')}")
    
    # Database analysis
    log(f"\n{'='*20} DATABASE ANALYSIS {'='*20}")
    
    # Check if they're hitting the same backend/database
    preview_successes = sum(1 for result in results["PREVIEW"].values() if result.get("login_success"))
    production_successes = sum(1 for result in results["PRODUCTION"].values() if result.get("login_success"))
    
    if preview_successes == production_successes == len(test_users):
        log("✅ Both environments appear to be using the same database (all users work on both)")
    elif preview_successes > 0 and production_successes == 0:
        log("❌ Different databases: Preview has users, Production appears empty or different")
    elif preview_successes == 0 and production_successes > 0:
        log("❌ Different databases: Production has users, Preview appears empty or different")
    elif preview_successes != production_successes:
        log("⚠️  Partial database sync: Some users work on one environment but not the other")
    else:
        log("❌ Both environments appear to have issues (no successful logins)")
    
    # Final summary
    log(f"\n{'='*20} FINAL SUMMARY {'='*20}")
    
    total_tests = len(test_users) * len(environments)
    successful_logins = sum(
        sum(1 for result in env_results.values() if result.get("login_success"))
        for env_results in results.values()
    )
    
    log(f"Total login tests: {total_tests}")
    log(f"Successful logins: {successful_logins}")
    log(f"Failed logins: {total_tests - successful_logins}")
    
    # Detailed findings
    log("\nDetailed findings:")
    for env_name, env_results in results.items():
        log(f"\n{env_name} Environment:")
        for email, result in env_results.items():
            status = "✅ SUCCESS" if result.get("login_success") else "❌ FAILED"
            log(f"  {email}: {status}")
            if not result.get("login_success"):
                log(f"    Error: {result.get('error')}")
    
    # Key questions answered
    log(f"\n{'='*20} KEY QUESTIONS ANSWERED {'='*20}")
    log("1. Are they hitting the same backend?")
    if preview_successes == production_successes:
        log("   ✅ YES - Both environments show same login behavior")
    else:
        log("   ❌ NO - Different login success rates suggest different backends/databases")
    
    log("2. Are they using the same database?")
    if preview_successes == production_successes == len(test_users):
        log("   ✅ YES - All users work on both environments")
    elif preview_successes == production_successes == 0:
        log("   ⚠️  UNKNOWN - Both environments failing (could be same empty DB or different issue)")
    else:
        log("   ❌ NO - Different user availability suggests different databases")
    
    log("3. What are the exact error messages?")
    for env_name, env_results in results.items():
        log(f"   {env_name}:")
        for email, result in env_results.items():
            if not result.get("login_success"):
                log(f"     {email}: {result.get('error')}")
    
    return successful_logins == total_tests

if __name__ == "__main__":
    test_login_both_environments()