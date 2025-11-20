#!/usr/bin/env python3
"""
Script to inject translations from recipe_translations.json directly into server.py
This ensures translations are always available when the app starts, including mobile apps.
"""

import json
import re

# Load translations
with open('/app/backend/recipe_translations.json', 'r', encoding='utf-8') as f:
    recipe_translations = json.load(f)

print(f"📂 Loaded {len(recipe_translations)} recipe translations")

# Read server.py
with open('/app/backend/server.py', 'r', encoding='utf-8') as f:
    server_content = f.read()

print(f"📄 Read server.py ({len(server_content)} chars)")

# Find the recipes_data array
# Pattern: recipes_data = [ ... ]
pattern = r'(recipes_data = \[)(.*?)(\n    \])'
match = re.search(pattern, server_content, re.DOTALL)

if not match:
    print("❌ Could not find recipes_data array in server.py")
    exit(1)

print(f"✅ Found recipes_data array")

# Parse individual recipes from the array
recipe_pattern = r'\{[^}]*"name":\s*"([^"]+)"[^}]*\}'
recipes_in_code = re.findall(recipe_pattern, match.group(2))

print(f"📊 Found {len(recipes_in_code)} recipes in server.py")

# For each recipe in code, inject translations
updated_content = server_content
injection_count = 0

for recipe_name in recipes_in_code:
    # Find translation data for this recipe
    trans_data = None
    for trans_id, data in recipe_translations.items():
        if data['name'] == recipe_name:
            trans_data = data['translations']
            break
    
    if not trans_data:
        print(f"⚠️  No translation found for: {recipe_name}")
        continue
    
    # Build translations string
    trans_str = json.dumps(trans_data, ensure_ascii=False, indent=12)
    
    # Find this recipe's dict in the code and add/update translations
    # Pattern: {..."name": "recipe_name"...}
    recipe_dict_pattern = rf'(\{{[^}}]*"name":\s*"{re.escape(recipe_name)}"[^}}]*)(,"translations":\s*\{{[^}}]*\}})?(\}})'
    
    def replace_translations(match):
        recipe_start = match.group(1)
        recipe_end = match.group(3)
        return f'{recipe_start},\n            "translations": {trans_str}{recipe_end}'
    
    # Replace in the content
    new_content = re.sub(recipe_dict_pattern, replace_translations, updated_content, count=1, flags=re.DOTALL)
    
    if new_content != updated_content:
        updated_content = new_content
        injection_count += 1
        print(f"✅ {injection_count}. Injected translations for: {recipe_name}")

print(f"\n📝 Writing updated server.py...")

# Write back to server.py
with open('/app/backend/server.py', 'w', encoding='utf-8') as f:
    f.write(updated_content)

print(f"✅ Updated server.py with {injection_count} recipe translations")
print(f"\nℹ️  Backend will auto-reload with new translations")
