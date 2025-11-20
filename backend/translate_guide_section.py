#!/usr/bin/env python3
"""
Translate the guide section from Danish to French, English UK, and English US
using OpenAI GPT-4o with Emergent LLM key via emergentintegrations
"""

import json
import os
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage

async def translate_guide_section(source_text, target_lang, api_key):
    """Translate guide section to target language"""
    
    lang_names = {
        'fr': 'French',
        'en': 'English (UK)',
        'en_us': 'English (US)'
    }
    
    lang_instructions = {
        'fr': 'Use proper French culinary and technical terms. Use "vous" form (formal).',
        'en': 'Use British English spelling (e.g., "flavour", "colour", "favourite").',
        'en_us': 'Use American English spelling (e.g., "flavor", "color", "favorite").'
    }
    
    prompt = f"""Translate this EXACT Danish text to {lang_names[target_lang]}.

CRITICAL RULES:
1. Translate ONLY what is given - DO NOT add extra content, explanations, or embellishments
2. Keep the EXACT same length and structure as the original
3. DO NOT translate: SLUSHBOOK, PRO, BRIX, emojis (🆕, ⭐, etc.)
4. {lang_instructions[target_lang]}
5. Translate naturally but stay concise - match the original tone and length

Danish text:
{source_text}

Return ONLY the direct translation - nothing more, nothing less."""

    # Create chat instance
    chat = LlmChat(
        api_key=api_key,
        session_id=f"translate_{target_lang}",
        system_message=f"You are a professional translator specializing in UI/UX and food & beverage content. Translate to {lang_names[target_lang]}."
    ).with_model("openai", "gpt-4o")
    
    # Send translation request
    user_message = UserMessage(text=prompt)
    response = await chat.send_message(user_message)
    
    return response.strip()

async def main():
    # Get API key
    api_key = os.environ.get('EMERGENT_LLM_KEY', 'sk-emergent-0A93663479e74011f0')
    
    # Load Danish source
    with open('/app/frontend/src/i18n/locales/da.json', 'r', encoding='utf-8') as f:
        da_data = json.load(f)
    
    guide_da = da_data['guide']
    print(f"📚 Found {len(guide_da)} keys in Danish guide section")
    
    # Load target language files
    locale_files = {
        'fr': '/app/frontend/src/i18n/locales/fr.json',
        'en': '/app/frontend/src/i18n/locales/en.json',
        'en_us': '/app/frontend/src/i18n/locales/en_us.json'
    }
    
    for lang_code, file_path in locale_files.items():
        print(f"\n🌍 Translating to {lang_code.upper()}...")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            lang_data = json.load(f)
        
        # Translate each key
        translated_guide = {}
        for i, (key, da_text) in enumerate(guide_da.items(), 1):
            print(f"  [{i}/{len(guide_da)}] {key}...", end=' ', flush=True)
            
            try:
                translated_text = await translate_guide_section(da_text, lang_code, api_key)
                translated_guide[key] = translated_text
                print("✅")
            except Exception as e:
                print(f"❌ Error: {e}")
                # Keep existing translation if error
                translated_guide[key] = lang_data['guide'].get(key, da_text)
        
        # Update the guide section
        lang_data['guide'] = translated_guide
        
        # Save back to file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(lang_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Saved {lang_code.upper()} translations to {file_path}")
    
    print("\n🎉 All guide translations completed!")

if __name__ == "__main__":
    asyncio.run(main())
