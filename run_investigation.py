#!/usr/bin/env python3
"""
Run user sessions investigation for kimesav@gmail.com
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend_test import BackendTester, PREVIEW_BASE_URL, PRODUCTION_BASE_URL

def main():
    """Run user sessions investigation"""
    print("=" * 80)
    print("SLUSHBOOK USER SESSIONS INVESTIGATION")
    print("=" * 80)
    
    # Test both environments
    environments = [
        ("Preview", PREVIEW_BASE_URL),
        ("Production", PRODUCTION_BASE_URL)
    ]
    
    for env_name, base_url in environments:
        print(f"\n{'='*20} INVESTIGATING {env_name.upper()} ENVIRONMENT {'='*20}")
        print(f"Base URL: {base_url}")
        
        tester = BackendTester(base_url)
        
        print(f"\n--- User Sessions Investigation ---")
        try:
            result = tester.test_user_sessions_investigation()
            if result:
                print(f"✅ Investigation COMPLETED for {env_name}")
            else:
                print(f"❌ Investigation FAILED for {env_name}")
        except Exception as e:
            print(f"💥 Investigation CRASHED for {env_name}: {str(e)}")
        
        print(f"\n{env_name} Environment investigation completed")
        print("="*60)

if __name__ == "__main__":
    main()