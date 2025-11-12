#!/usr/bin/env python3
"""
Test script specifically for the NEW Ingredient Filtering Feature
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend_test import BackendTester, PREVIEW_BASE_URL, PRODUCTION_BASE_URL

def main():
    print("🔍 TESTING NEW INGREDIENT FILTERING FEATURE")
    print("=" * 80)
    
    # Test on Preview environment
    print("\n🌐 Testing Preview Environment")
    print("-" * 50)
    
    preview_tester = BackendTester(PREVIEW_BASE_URL)
    preview_result = preview_tester.test_ingredient_filtering_feature()
    
    # Test on Production environment  
    print("\n🌐 Testing Production Environment")
    print("-" * 50)
    
    production_tester = BackendTester(PRODUCTION_BASE_URL)
    production_result = production_tester.test_ingredient_filtering_feature()
    
    # Summary
    print("\n" + "=" * 80)
    print("INGREDIENT FILTERING TEST SUMMARY")
    print("=" * 80)
    
    preview_status = "✅ PASS" if preview_result else "❌ FAIL"
    production_status = "✅ PASS" if production_result else "❌ FAIL"
    
    print(f"Preview Environment: {preview_status}")
    print(f"Production Environment: {production_status}")
    
    total_passed = sum([preview_result, production_result])
    print(f"\nTotal: {total_passed}/2 environments passed")
    
    if total_passed == 2:
        print("🎉 ALL INGREDIENT FILTERING TESTS PASSED!")
        return True
    else:
        print(f"⚠️  {2 - total_passed} environment(s) FAILED")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)