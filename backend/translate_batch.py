#!/usr/bin/env python3
"""
Translate recipes in batches
"""

import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage

async def translate_recipe_content(content, content_type, recipe_name, target_lang, api_key):
    """Translate recipe description or step"""
    
    lang_names = {
        'de': 'German',
        'fr': 'French',
        'en': 'English (UK)',
        'en_us': 'English (US)'
    }
    
    lang_instructions = {
        'de': 'Use proper German culinary terms. Use natural German phrasing.',
        'fr': 'Use proper French culinary terms. Use "vous" form (formal). Natural French phrasing.',
        'en': 'Use British English spelling (e.g., "flavour", "colour").',
        'en_us': 'Use American English spelling (e.g., "flavor", "color").'
    }
    
    context = "recipe description" if content_type == "description" else "step-by-step instruction"
    
    prompt = f"""Translate this slushie {context} from Danish to {lang_names[target_lang]}.

Recipe: {recipe_name}

RULES:
1. Translate naturally and idiomatically
2. DO NOT translate: Brand names, BRIX, °Bx, ml, g, %
3. Keep emojis unchanged
4. {lang_instructions[target_lang]}
5. Maintain the friendly, appetizing tone

Danish text:
{content}

Return ONLY the translation."""

    chat = LlmChat(
        api_key=api_key,
        session_id=f"translate_{target_lang}_{content_type}",
        system_message=f"You are a professional food & beverage translator. Translate to {lang_names[target_lang]}."
    ).with_model("openai", "gpt-4o")
    
    user_message = UserMessage(text=prompt)
    response = await chat.send_message(user_message)
    
    return response.strip()

async def translate_recipe(recipe, api_key, db):
    """Translate a single recipe"""
    
    recipe_id = recipe.get('id')
    recipe_name = recipe.get('name')
    
    print(f"  📝 {recipe_name}")
    
    translations = recipe.get('translations', {})
    da_trans = translations.get('da', {})
    
    da_description = da_trans.get('description', '')
    da_steps = da_trans.get('steps', [])
    
    if not da_description and not da_steps:
        print(f"    ⚠️  No Danish content, skipping")
        return
    
    target_langs = ['de', 'fr', 'en', 'en_us']
    
    for lang in target_langs:
        print(f"    🌍 {lang.upper()}...", end=' ', flush=True)
        
        try:
            translated_desc = ''
            if da_description:
                translated_desc = await translate_recipe_content(
                    da_description, 
                    'description', 
                    recipe_name,
                    lang, 
                    api_key
                )
            
            translated_steps = []
            for da_step in da_steps:
                translated_step = await translate_recipe_content(
                    da_step,
                    'step',
                    recipe_name,
                    lang,
                    api_key
                )
                translated_steps.append(translated_step)
            
            if lang not in translations:
                translations[lang] = {}
            
            translations[lang]['description'] = translated_desc
            translations[lang]['steps'] = translated_steps
            
            print("✅")
            
        except Exception as e:
            print(f"❌ {str(e)[:50]}")
            continue
    
    try:
        await db.recipes.update_one(
            {'id': recipe_id},
            {'$set': {'translations': translations}}
        )
        print(f"    💾 Saved")
    except Exception as e:
        print(f"    ❌ DB error: {e}")

async def main():
    start_idx = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    batch_size = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    
    api_key = os.environ.get('EMERGENT_LLM_KEY', 'sk-emergent-0A93663479e74011f0')
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'flavor_sync')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"🔗 Database: {db_name}")
    
    # Fetch all recipes
    all_recipes = await db.recipes.find({}, {"_id": 0}).to_list(None)
    
    # Get batch
    recipes = all_recipes[start_idx:start_idx + batch_size]
    
    print(f"📚 Batch {start_idx}-{start_idx + len(recipes)} of {len(all_recipes)} total")
    print(f"{'='*60}\n")
    
    for idx, recipe in enumerate(recipes, start_idx + 1):
        print(f"[{idx}/{len(all_recipes)}]")
        await translate_recipe(recipe, api_key, db)
        print()
    
    print(f"{'='*60}")
    print(f"✅ Batch complete!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
