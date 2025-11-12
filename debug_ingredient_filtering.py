#!/usr/bin/env python3
"""
Debug script for ingredient filtering issues
"""

import requests
import json

PRODUCTION_BASE_URL = "https://slushice-recipes.emergent.host/api"

def debug_production_filtering():
    print("🔍 DEBUGGING PRODUCTION INGREDIENT FILTERING")
    print("=" * 60)
    
    session = requests.Session()
    
    # Test 1: Get all recipes first
    print("\n--- Getting all recipes ---")
    all_response = session.get(f"{PRODUCTION_BASE_URL}/recipes")
    
    if all_response.status_code == 200:
        all_recipes = all_response.json()
        print(f"✅ Total recipes: {len(all_recipes)}")
        
        # Check first few recipes for citron ingredients
        print("\n--- Checking first 10 recipes for citron ingredients ---")
        for i, recipe in enumerate(all_recipes[:10]):
            recipe_name = recipe.get('name', 'Unknown')
            ingredients = recipe.get('ingredients', [])
            
            citron_ingredients = []
            for ing in ingredients:
                ing_name = ing.get('name', '').lower()
                if 'citron' in ing_name:
                    citron_ingredients.append(ing.get('name'))
            
            if citron_ingredients:
                print(f"  ✅ Recipe '{recipe_name}' has citron: {citron_ingredients}")
            else:
                print(f"  ❌ Recipe '{recipe_name}' has NO citron ingredients")
                # Show all ingredients for debugging
                all_ing_names = [ing.get('name') for ing in ingredients]
                print(f"      All ingredients: {all_ing_names}")
    
    # Test 2: Test the filtering endpoint
    print("\n--- Testing citron filtering endpoint ---")
    filter_response = session.get(f"{PRODUCTION_BASE_URL}/recipes?include_ingredients=citron")
    
    if filter_response.status_code == 200:
        filtered_recipes = filter_response.json()
        print(f"✅ Filtered recipes: {len(filtered_recipes)}")
        
        # Check if filtering is working correctly
        print("\n--- Verifying filtered results ---")
        for i, recipe in enumerate(filtered_recipes[:5]):
            recipe_name = recipe.get('name', 'Unknown')
            ingredients = recipe.get('ingredients', [])
            
            citron_ingredients = []
            for ing in ingredients:
                ing_name = ing.get('name', '').lower()
                if 'citron' in ing_name:
                    citron_ingredients.append(ing.get('name'))
            
            if citron_ingredients:
                print(f"  ✅ Filtered recipe '{recipe_name}' correctly has citron: {citron_ingredients}")
            else:
                print(f"  ❌ Filtered recipe '{recipe_name}' should have citron but doesn't!")
                all_ing_names = [ing.get('name') for ing in ingredients]
                print(f"      All ingredients: {all_ing_names}")
                return False
    else:
        print(f"❌ Filter request failed: {filter_response.status_code}")
        return False
    
    return True

if __name__ == "__main__":
    debug_production_filtering()