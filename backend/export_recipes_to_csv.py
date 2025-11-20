#!/usr/bin/env python3
"""
Export all recipe translations to CSV for external translation (e.g., ChatGPT)
"""

import json
import csv

# Load recipe translations
with open('/app/backend/recipe_translations.json', 'r', encoding='utf-8') as f:
    recipe_translations = json.load(f)

# Prepare CSV data
csv_rows = []

# Add header
csv_rows.append([
    'Recipe ID',
    'Recipe Name',
    'Field Type',
    'Step Number',
    'Danish (DA)',
    'German (DE)',
    'French (FR)',
    'English UK (EN)',
    'English US (EN_US)'
])

# For each recipe
for recipe_id, recipe_data in recipe_translations.items():
    recipe_name = recipe_data['name']
    translations = recipe_data['translations']
    
    # Add description row
    csv_rows.append([
        recipe_id,
        recipe_name,
        'Description',
        '',
        translations['da'].get('description', ''),
        translations['de'].get('description', ''),
        translations['fr'].get('description', ''),
        translations['en'].get('description', ''),
        translations['en_us'].get('description', '')
    ])
    
    # Add steps rows
    da_steps = translations['da'].get('steps', [])
    for step_num, da_step in enumerate(da_steps, 1):
        de_step = translations['de'].get('steps', [])[step_num-1] if step_num-1 < len(translations['de'].get('steps', [])) else ''
        fr_step = translations['fr'].get('steps', [])[step_num-1] if step_num-1 < len(translations['fr'].get('steps', [])) else ''
        en_step = translations['en'].get('steps', [])[step_num-1] if step_num-1 < len(translations['en'].get('steps', [])) else ''
        en_us_step = translations['en_us'].get('steps', [])[step_num-1] if step_num-1 < len(translations['en_us'].get('steps', [])) else ''
        
        csv_rows.append([
            recipe_id,
            recipe_name,
            'Step',
            step_num,
            da_step,
            de_step,
            fr_step,
            en_step,
            en_us_step
        ])

# Write to CSV
csv_filename = '/tmp/recipe_translations_export.csv'
with open(csv_filename, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f, quoting=csv.QUOTE_ALL)
    writer.writerows(csv_rows)

print(f"✅ Eksporteret {len(recipe_translations)} opskrifter til CSV")
print(f"📁 Fil: {csv_filename}")
print(f"📊 Total rækker: {len(csv_rows)} (inkl. header)")
print(f"\n📋 Instruktioner:")
print(f"1. Download CSV filen")
print(f"2. Åbn i Excel/Google Sheets")
print(f"3. Brug ChatGPT til at oversætte DE, FR, EN, EN_US kolonnerne")
print(f"4. Gem som CSV og upload den tilbage")
print(f"5. Kør import scriptet")
