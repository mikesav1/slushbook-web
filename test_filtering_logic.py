#!/usr/bin/env python3
"""
Test the filtering logic step by step
"""

import requests
import json

PRODUCTION_BASE_URL = "https://slushice-recipes.emergent.host/api"

def test_filtering_step_by_step():
    print("🔍 TESTING FILTERING LOGIC STEP BY STEP")
    print("=" * 60)
    
    session = requests.Session()
    
    # Test different scenarios
    test_cases = [
        ("citron", "include_ingredients"),
        ("mælk", "exclude_ingredients"),
        ("nonexistent123", "include_ingredients"),
        ("citron", "include_ingredients"),  # Test again to see if consistent
    ]
    
    for ingredient, filter_type in test_cases:
        print(f"\n--- Testing {filter_type}={ingredient} ---")
        
        url = f"{PRODUCTION_BASE_URL}/recipes?{filter_type}={ingredient}"
        print(f"URL: {url}")
        
        response = session.get(url)
        
        if response.status_code == 200:
            recipes = response.json()
            print(f"✅ Returned {len(recipes)} recipes")
            
            # Check first few recipes
            for i, recipe in enumerate(recipes[:3]):
                recipe_name = recipe.get('name', 'Unknown')
                ingredients = recipe.get('ingredients', [])
                
                # Check if recipe matches the filter
                ingredient_names = [ing.get('name', '').lower() for ing in ingredients]
                has_ingredient = any(ingredient.lower() in name for name in ingredient_names)
                
                if filter_type == "include_ingredients":
                    if has_ingredient:
                        print(f"  ✅ Recipe '{recipe_name}' correctly contains '{ingredient}'")
                    else:
                        print(f"  ❌ Recipe '{recipe_name}' should contain '{ingredient}' but doesn't")
                        print(f"      Ingredients: {[ing.get('name') for ing in ingredients]}")
                        
                elif filter_type == "exclude_ingredients":
                    if not has_ingredient:
                        print(f"  ✅ Recipe '{recipe_name}' correctly excludes '{ingredient}'")
                    else:
                        print(f"  ❌ Recipe '{recipe_name}' should exclude '{ingredient}' but contains it")
                        print(f"      Ingredients: {[ing.get('name') for ing in ingredients]}")
        else:
            print(f"❌ Request failed: {response.status_code} - {response.text}")
    
    # Test with no filters to see baseline
    print(f"\n--- Testing with no filters (baseline) ---")
    baseline_response = session.get(f"{PRODUCTION_BASE_URL}/recipes")
    if baseline_response.status_code == 200:
        baseline_recipes = baseline_response.json()
        print(f"✅ Baseline: {len(baseline_recipes)} total recipes")
    else:
        print(f"❌ Baseline request failed: {baseline_response.status_code}")

if __name__ == "__main__":
    test_filtering_step_by_step()