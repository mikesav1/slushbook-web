# 📦 Ingredients Collection - Complete Specification

## Collection Name: `ingredients`

---

## 🏗️ Structure

```javascript
{
  "name": "string",              // Original product name
  "brix": number | null,         // Brix value (null if unknown)
  "volume_ml": number | null,    // Default volume (null if not applicable)
  "category": "string",          // sirup, saft, juice, sodavand, alkohol, etc.
  "keywords": {                  // Multi-language keywords for AI search
    "da": [string],
    "de": [string],
    "fr": [string],
    "en_uk": [string],
    "en_us": [string]
  },
  "country": [string],           // ISO 3166-1 alpha-2 codes (["DK", "DE", "FR"])
  "alcohol_vol": number | null,  // Alcohol percentage (e.g., 40 for vodka, null for non-alcoholic)
  "links": {                     // Country-specific affiliate links
    "DK": "string or null",
    "DE": "string or null",
    "FR": "string or null",
    "EN_UK": "string or null",
    "EN_US": "string or null"
  }
}
```

---

## 📋 Field Descriptions

### `name` (string, required)
- Original product name as known in the market
- Example: `"Marie Brizard Rørsukkersirup"`
- Keep authentic brand names unchanged

### `brix` (number | null, required)
- Measured Brix value (sugar content)
- **CRITICAL:** AI must never guess - use `null` if unknown
- Example: `63` for sugar syrup, `0` for water

### `volume_ml` (number | null, required)
- Default volume in milliliters
- Use standard bottle/package size
- Set to `null` if not applicable (e.g., water, ice)
- Example: `1000` for 1L bottle

### `category` (string, required)
- Product category for filtering
- Examples: `"sirup"`, `"juice"`, `"sodavand"`, `"spiritus"`, `"likør"`, `"base"`

### `keywords` (object, required)
- **Most important for AI cross-language matching**
- Provide keywords in all 5 languages
- Each language has an array of strings
- Include synonyms, variations, and common terms

**Example for sugar syrup:**
```javascript
"keywords": {
  "da": ["rørsukker", "sukkerlage"],
  "de": ["zuckersirup", "rohrzucker"],
  "fr": ["sirop de sucre"],
  "en_uk": ["sugar syrup"],
  "en_us": ["simple syrup", "pure cane sugar syrup"]
}
```

**Rules for keywords:**
- Single words like "chokolade" must be avoided - use "chokolade sirup" (two words)
- Include brand names if relevant
- Include common misspellings if necessary
- Keep lowercase

### `country` (array, required)
- ISO 3166-1 alpha-2 country codes
- Where the product is available/sold
- Example: `["DK", "FR"]` for products sold in Denmark and France
- Will be used for country-specific recommendations later

### `alcohol_vol` (number | null, required)
- Alcohol percentage by volume
- Example: `40` for vodka, `17` for Baileys
- **Always `null` for non-alcoholic products**

### `links` (object, required)
- Country-specific product links (e.g., affiliate links, shop URLs)
- All keys present, set to `null` if not available
- Example:
```javascript
"links": {
  "DK": "https://barshopen.dk/product-url",
  "DE": null,
  "FR": null,
  "EN_UK": null,
  "EN_US": null
}
```

---

## 📝 Empty Template

Copy this template when adding new ingredients:

```javascript
{
  "name": "",
  "brix": null,
  "volume_ml": null,
  "category": "",
  "keywords": {
    "da": [],
    "de": [],
    "fr": [],
    "en_uk": [],
    "en_us": []
  },
  "country": [],
  "alcohol_vol": null,
  "links": {
    "DK": null,
    "DE": null,
    "FR": null,
    "EN_UK": null,
    "EN_US": null
  }
}
```

---

## ✅ Example: Complete Ingredient

```javascript
{
  "name": "Marie Brizard Rørsukkersirup",
  "brix": 63,
  "volume_ml": 1000,
  "category": "sirup",
  "keywords": {
    "da": ["sukkerlage", "rørsukker", "marie brizard", "canesugar", "pure sugar syrup"],
    "de": ["zuckersirup", "rohrzucker"],
    "fr": ["sirop de sucre", "marie brizard"],
    "en_uk": ["sugar syrup", "pure cane sugar syrup"],
    "en_us": ["simple syrup", "pure cane sugar syrup"]
  },
  "country": ["DK", "FR"],
  "alcohol_vol": null,
  "links": {
    "DK": null,
    "DE": null,
    "FR": null,
    "EN_UK": null,
    "EN_US": null
  }
}
```

---

## 🎯 How AI Uses This Data

### 1. Cross-Language Matching
When a user asks in English: *"Calculate Brix for sugar syrup and water"*

AI searches keywords:
- `"sugar syrup"` matches `keywords.en_uk: ["sugar syrup"]`
- Finds: `"Marie Brizard Rørsukkersirup"`
- Uses: `brix: 63`

### 2. Response in User's Language
- User query in German → AI responds in German
- User query in French → AI responds in French
- Keywords enable ingredient identification regardless of language

### 3. Brix Calculation
```javascript
// User: "300ml sugar syrup and 700ml water"
// AI finds: Marie Brizard (63°Bx) and Vand (0°Bx)
// Calculation: (63×300 + 0×700) / 1000 = 18.9°Bx
```

### 4. Alcohol Warning
If `alcohol_vol` is not null:
- AI includes alcohol percentage in calculation
- Adds warning: "⚠️ Husk: Alkohol tilsættes ALTID til sidst"

---

## 🚀 Adding Ingredients to Database

### Via Python Script
```bash
cd /app/backend
python3 add_sample_ingredients.py
```

### Via Python Code
```python
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def add_ingredient():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    new_ingredient = {
        "name": "Appelsin Sirup",
        "brix": 60,
        "volume_ml": 700,
        "category": "sirup",
        "keywords": {
            "da": ["appelsin sirup", "orange sirup"],
            "de": ["orangensirup"],
            "fr": ["sirop orange"],
            "en_uk": ["orange syrup"],
            "en_us": ["orange syrup"]
        },
        "country": ["DK"],
        "alcohol_vol": None,
        "links": {
            "DK": None,
            "DE": None,
            "FR": None,
            "EN_UK": None,
            "EN_US": None
        }
    }
    
    result = await db.ingredients.insert_one(new_ingredient)
    print(f"Added: {new_ingredient['name']}")
    client.close()

asyncio.run(add_ingredient())
```

### Via mongosh
```javascript
use flavor_sync

db.ingredients.insertOne({
  "name": "Appelsin Sirup",
  "brix": 60,
  "volume_ml": 700,
  "category": "sirup",
  "keywords": {
    "da": ["appelsin sirup"],
    "de": ["orangensirup"],
    "fr": ["sirop orange"],
    "en_uk": ["orange syrup"],
    "en_us": ["orange syrup"]
  },
  "country": ["DK"],
  "alcohol_vol": null,
  "links": {
    "DK": null,
    "DE": null,
    "FR": null,
    "EN_UK": null,
    "EN_US": null
  }
})
```

---

## 📊 Current Ingredients in Database

1. **Marie Brizard Rørsukkersirup** (63°Bx) - sirup
2. **Monin Blue Curaçao Sirup** (null°Bx) - sirup
3. **Chokolade Sirup** (null°Bx) - sirup
4. **Mynte Sirup** (null°Bx) - sirup
5. **Mountain Dew** (null°Bx) - sodavand
6. **Vand** (0°Bx) - base
7. **Vodka** (0°Bx, 40% alkohol) - spiritus
8. **Baileys** (25°Bx, 17% alkohol) - likør

---

## ✅ Validation Rules

Before adding an ingredient, verify:

- ✅ `name` is unique in database
- ✅ `brix` is either a valid number or `null` (never guess!)
- ✅ `keywords` provided for all 5 languages (at least one keyword per language)
- ✅ `category` is appropriate
- ✅ `alcohol_vol` is `null` for non-alcoholic products
- ✅ `country` uses ISO 3166-1 alpha-2 codes
- ✅ `links` object has all 5 keys

---

## 🎓 Best Practices

### Keywords Strategy
1. Include brand names if relevant
2. Add common synonyms
3. Include both singular and plural if needed
4. Keep lowercase
5. **Two-word minimum** (avoid single words like "chokolade")

### Brix Values
1. Measure if possible
2. Use `null` if unknown
3. Never estimate or guess
4. Document source if known (e.g., manufacturer specs)

### Links
1. Use affiliate links when available
2. Link to official product pages
3. Verify links are active before adding
4. Update regularly

---

**This specification ensures perfect AI ingredient matching across all 5 languages! 🚀**
