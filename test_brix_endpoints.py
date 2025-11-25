#!/usr/bin/env python3
"""
Simple test script for the new Brix calculation endpoints
"""

import requests
import json

# Test data
test_ingredients = [
    {"name": "Hindbær sirup", "volume_ml": 200, "brix": 59},
    {"name": "Vand", "volume_ml": 800, "brix": 0}
]

def test_brix_calculate():
    """Test the /api/brix/calculate endpoint"""
    url = "http://localhost:8000/api/brix/calculate"
    payload = {"ingredients": test_ingredients}
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        print(f"Brix Calculate - Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Success: {result.get('success')}")
            print(f"Total Brix: {result.get('total_brix')}")
            print(f"Total Volume: {result.get('total_volume_ml')} ml")
            print(f"Stable for slush: {result.get('is_stable_for_slush')}")
            print(f"Recommendation: {result.get('recommendation')}")
        else:
            print(f"Error: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"Connection error: {e}")
    print("-" * 50)

def test_brix_adjust():
    """Test the /api/brix/adjust endpoint"""
    url = "http://localhost:8000/api/brix/adjust"
    payload = {
        "ingredients": test_ingredients,
        "target_brix": 13.0,
        "adjustment_type": "water"
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        print(f"Brix Adjust - Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Success: {result.get('success')}")
            print(f"Current Brix: {result.get('current_brix')}")
            print(f"Target Brix: {result.get('target_brix')}")
            print(f"Adjustment needed: {result.get('adjustment_ml')} ml of {result.get('adjustment_type')}")
        else:
            print(f"Error: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"Connection error: {e}")
    print("-" * 50)

if __name__ == "__main__":
    print("Testing new Brix calculation endpoints...")
    print("=" * 50)
    test_brix_calculate()
    test_brix_adjust()
    print("Test completed!")