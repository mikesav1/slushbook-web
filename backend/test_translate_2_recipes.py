#!/usr/bin/env python3
"""
Test translation of 2 recipes
"""

import asyncio
import os
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
        'en': 'Use British English spelling (e.g., "flavour", "colour"). Use "ice lolly" not "popsicle".',
        'en_us': 'Use American English spelling (e.g., "flavor", "color"). Use "popsicle" not "ice lolly".'
    }
    
    context = "recipe description" if content_type == "description" else "step-by-step instruction"
    
    prompt = f"""Translate this slushie {context} from Danish to {lang_names[target_lang]}.

Recipe: {recipe_name}

RULES:
1. Translate naturally and idiomatically for {lang_names[target_lang]}
2. DO NOT translate: Brand names (Cocio, Fanta, Sprite, Haribo, etc.), BRIX, °Bx, ml, g, %
3. Keep emojis unchanged
4. {lang_instructions[target_lang]}
5. Maintain the friendly, appetizing tone
6. Keep the same length/structure as original

Danish text:
{content}

Return ONLY the translation - nothing else."""

    chat = LlmChat(
        api_key=api_key,
        session_id=f"translate_{target_lang}_{content_type}",
        system_message=f"You are a professional food & beverage translator specializing in slushie recipes. Translate to {lang_names[target_lang]}."
    ).with_model("openai", "gpt-4o")
    
    user_message = UserMessage(text=prompt)
    response = await chat.send_message(user_message)
    
    return response.strip()

async def translate_recipe(recipe, api_key, db):
    """Translate a single recipe to all target languages"""
    
    recipe_id = recipe.get('id', 'unknown')
    recipe_name = recipe.get('name', 'Unknown Recipe')
    
    print(f"\n📝 Translating: {recipe_name} (ID: {recipe_id})")
    
    translations = recipe.get('translations', {})
    da_trans = translations.get('da', {})
    
    da_description = da_trans.get('description', '')
    da_steps = da_trans.get('steps', [])
    
    if not da_description and not da_steps:
        print(f"  ⚠️  No Danish content found, skipping")
        return
    
    target_langs = ['de', 'fr', 'en', 'en_us']
    
    for lang in target_langs:
        print(f"  🌍 {lang.upper()}...", end=' ', flush=True)
        
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
            for step_idx, da_step in enumerate(da_steps, 1):
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
            print(f"❌ Error: {e}")
            continue
    
    try:
        await db.recipes.update_one(
            {'id': recipe_id},
            {'$set': {'translations': translations}}
        )
        print(f"  💾 Saved to database")
    except Exception as e:
        print(f"  ❌ Database error: {e}")

async def main():
    api_key = os.environ.get('EMERGENT_LLM_KEY', 'sk-emergent-0A93663479e74011f0')
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'flavor_sync')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"🔗 Connected to database: {db_name}")
    
    # Fetch only 2 recipes for testing
    recipes = await db.recipes.find({}, {"_id": 0}).limit(2).to_list(2)
    
    print(f"📚 Testing with {len(recipes)} recipes")
    print(f"\n{'='*60}")
    
    for idx, recipe in enumerate(recipes, 1):
        print(f"\n[{idx}/{len(recipes)}]", end='')
        await translate_recipe(recipe, api_key, db)
    
    print(f"\n{'='*60}")
    print(f"\n🎉 Test completed! {len(recipes)} recipes translated")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
