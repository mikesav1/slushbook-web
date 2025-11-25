# AI Assistant Setup Guide

## Oversigt
SlushBook har nu to AI-assistenter:
1. **Brix Assistant** (`/api/ai/brix`) - Hjælper med Brix-beregninger og ingrediensråd
2. **General Help** (`/api/ai/help`) - Generel hjælp til tips & tricks

---

## 🔧 API Endpoints

### POST /api/ai/brix
AI-assistent til Brix-beregninger med adgang til ingrediensdatabase.

**Request:**
```json
{
  "query": "Hvordan beregner jeg Brix for en jordbær slush?",
  "language": "da"
}
```

**Response:**
```json
{
  "success": true,
  "response": "For at beregne Brix...",
  "ingredients_count": 50
}
```

### POST /api/ai/help
Generel AI-hjælp uden database-opslag.

**Request:**
```json
{
  "query": "Hvordan får jeg min slush til at fryse hurtigere?",
  "language": "da"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Her er nogle tips..."
}
```

---

## 📦 MongoDB Collection: `ingredients`

### Collection Struktur (Præcis specifikation)
```javascript
{
  "name": "Marie Brizard Rørsukkersirup",  // Originalt produktnavn
  "brix": 63,                              // Brix værdi (sukkerindhold) - integer
  "volume_ml": 1000,                       // Standard volumen i ml - integer eller null
  "category": "sirup",                     // Kategori (sirup, base, juice, spiritus, likør)
  "keywords": ["sukkerlage", "rørsukker", "marie brizard", "canesugar", "pure sugar syrup"], // Søgeord til AI
  "country": ["DK", "FR"],                 // Landekoder (ISO 3166-1 alpha-2)
  "alcohol_vol": null                      // Alkoholprocent (kun ved spiritus/likør) - number eller null
}
```

**VIGTIGE REGLER:**
- `name` = originalt produktnavn (ikke oversæt)
- `brix` = integer (ikke decimal)
- `volume_ml` = integer eller null
- `keywords` = bruges til AI-søgning (inkluder både dansk og engelsk)
- `country` = array af landekoder (["DK", "FR", etc.])
- `alcohol_vol` = kun udfyldt for alkoholholdige produkter
- Alle felter er lowercase

### Eksempel på data
```javascript
// Tilføj til MongoDB via mongosh eller script:
db.ingredients.insertMany([
  {
    "name": "Marie Brizard Rørsukkersirup",
    "brix": 63,
    "volume_ml": 1000,
    "category": "sirup",
    "keywords": ["sukkerlage", "rørsukker", "marie brizard", "canesugar", "pure sugar syrup"],
    "country": ["DK", "FR"],
    "alcohol_vol": null
  },
  {
    "name": "Vodka",
    "brix": 0,
    "volume_ml": 700,
    "category": "spiritus",
    "keywords": ["vodka", "alkohol", "spiritus", "neutral"],
    "country": ["DK", "RU"],
    "alcohol_vol": 40
  },
  {
    "name": "Vand",
    "brix": 0,
    "volume_ml": null,
    "category": "base",
    "keywords": ["vand", "water", "base", "neutral"],
    "country": ["DK"],
    "alcohol_vol": null
  }
])
```

---

## 📝 System Prompts

Prompts ligger i `/app/backend/prompts/`:

### `brix_assistant.txt`
Prompt til Brix-assistenten. Har adgang til ingrediensdatabase.

**Sådan redigerer du:**
```bash
nano /app/backend/prompts/brix_assistant.txt
```

### `general_help.txt`
Prompt til generel hjælp-assistent. Ingen database-adgang.

**Sådan redigerer du:**
```bash
nano /app/backend/prompts/general_help.txt
```

---

## 🔑 Miljøvariabel

API-nøglen hentes fra miljøvariablen:
```bash
EMERGENT_LLM_KEY=sk-emergent-0A93663479e74011f0
```

Denne er allerede sat i backend/.env og bruges automatisk.

---

## 🧪 Test Endpoints

### Test Brix Assistant
```bash
curl -X POST http://localhost:8001/api/ai/brix \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Hvad er den ideelle Brix for en klassisk slushice?"
  }'
```

### Test General Help
```bash
curl -X POST http://localhost:8001/api/ai/help \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Hvordan rengør jeg min slushice maskine?"
  }'
```

---

## 📊 Tilføj Ingredienser til Database

### Via Python Script
```python
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def add_ingredients():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    ingredients = [
        {
            "name": "Jordbær sirup",
            "brix": 65.0,
            "category": "sirup.baer.jordbaer",
            "keywords": ["jordbær", "bær", "sirup"]
        },
        # Tilføj flere ingredienser her
    ]
    
    result = await db.ingredients.insert_many(ingredients)
    print(f"Inserted {len(result.inserted_ids)} ingredients")
    
    client.close()

asyncio.run(add_ingredients())
```

### Via mongosh
```javascript
use flavor_sync

db.ingredients.insertMany([
  {
    "name": "Jordbær sirup",
    "brix": 65.0,
    "category": "sirup.baer.jordbaer"
  }
])
```

---

## 🚀 Deploy til Preview

Endpoints er kun aktive i preview-miljøet. Backend genstartes automatisk efter ændringer:

```bash
sudo supervisorctl restart backend
```

---

## ⚙️ Customization

### Ændre AI Model
I `server.py` linje ~7050:
```python
.with_model("openai", "gpt-4o")  # Skift til "gpt-4o-mini" for hurtigere svar
```

### Tilføj flere felter til ingredients
Du kan udvide collection strukturen efter behov. AI'en vil automatisk se alle felter.

### Ændre maksimal context
I `server.py` linje ~7040:
```python
ingredients_cursor = db.ingredients.find({}, {"_id": 0}).limit(50)  # Ændre limit
```

---

## 📞 Support

Hvis der er problemer:
1. Tjek backend logs: `tail -f /var/log/supervisor/backend.err.log`
2. Verificer MongoDB collection: `db.ingredients.countDocuments()`
3. Test API med curl kommandoerne ovenfor
