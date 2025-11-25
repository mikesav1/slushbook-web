# 🚀 AI Assistant - Quick Start Guide

## ✅ Status: Klar til brug!

Begge AI endpoints er nu live og klar til test i preview.

---

## 📍 Endpoints

### 1. POST `/api/ai/brix` - Brix Beregninger
**URL:** `https://slushmaster.preview.emergentagent.com/api/ai/brix`

**Request:**
```json
{
  "query": "Jeg vil lave en jordbær slush med 300ml jordbær sirup og 700ml vand. Hvad bliver det samlede Brix?"
}
```

**Response:**
```json
{
  "success": true,
  "response": "For at beregne det samlede Brix... = 19.5°Bx",
  "ingredients_count": 8
}
```

**Features:**
- ✅ Henter alle ingredienser fra `ingredients` collection
- ✅ Laver præcise Brix-beregninger
- ✅ Følger reglerne: aldrig opfinde værdier, sukker = sukkerlage, alkohol til sidst
- ✅ Model: `gpt-4o`

---

### 2. POST `/api/ai/help` - Tips & Tricks
**URL:** `https://slushmaster.preview.emergentagent.com/api/ai/help`

**Request:**
```json
{
  "query": "Hvordan rengør jeg min slushice maskine?"
}
```

**Response:**
```json
{
  "success": true,
  "response": "1. Tag maskinen ud af stikkontakten...\n2. Adskil dele...\n..."
}
```

**Features:**
- ✅ Ingen database-opslag (hurtig)
- ✅ Generelle tips og tricks
- ✅ Korte, praktiske svar
- ✅ Model: `gpt-4o-mini`

---

## 📊 Ingredients Database

**Collection:** `ingredients`  
**Status:** 8 ingredienser tilføjet

### Nuværende ingredienser:
1. Marie Brizard Rørsukkersirup (63°Bx)
2. Jordbær sirup (65°Bx)
3. Vand (0°Bx)
4. Citron juice (2°Bx)
5. Hindbær sirup (64°Bx)
6. Vodka (0°Bx, 40% alkohol)
7. Baileys (25°Bx, 17% alkohol)
8. Mælk (5°Bx)

---

## 🧪 Test AI Endpoints

### Test fra terminal:
```bash
# Test Help endpoint
curl -X POST https://slushmaster.preview.emergentagent.com/api/ai/help \
  -H "Content-Type: application/json" \
  -d '{"query": "Hvordan får jeg min slush til at fryse hurtigere?"}'

# Test Brix endpoint
curl -X POST https://slushmaster.preview.emergentagent.com/api/ai/brix \
  -H "Content-Type: application/json" \
  -d '{"query": "Hvad er den ideelle Brix for en klassisk slushice?"}'
```

### Test fra JavaScript (Frontend):
```javascript
// Help endpoint
const helpResponse = await fetch(`${API_URL}/api/ai/help`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "Hvordan rengør jeg min maskine?"
  })
});
const helpData = await helpResponse.json();
console.log(helpData.response);

// Brix endpoint
const brixResponse = await fetch(`${API_URL}/api/ai/brix`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "Beregn Brix for 300ml sirup og 700ml vand"
  })
});
const brixData = await brixResponse.json();
console.log(brixData.response);
console.log(`Ingredients used: ${brixData.ingredients_count}`);
```

---

## 📝 Tilføj flere ingredienser

### Via Python script:
```bash
cd /app/backend
python3 add_sample_ingredients.py
```

### Via Python kode:
```python
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def add_ingredient():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    new_ingredient = {
        "name": "Ananas juice",
        "brix": 12,
        "volume_ml": 1000,
        "category": "juice",
        "keywords": ["ananas", "pineapple", "juice", "tropisk"],
        "country": ["DK"],
        "alcohol_vol": None
    }
    
    result = await db.ingredients.insert_one(new_ingredient)
    print(f"Added: {new_ingredient['name']}")
    client.close()

asyncio.run(add_ingredient())
```

### Via mongosh:
```javascript
use flavor_sync

db.ingredients.insertOne({
  "name": "Ananas juice",
  "brix": 12,
  "volume_ml": 1000,
  "category": "juice",
  "keywords": ["ananas", "pineapple", "juice", "tropisk"],
  "country": ["DK"],
  "alcohol_vol": null
})
```

---

## 🔧 Opdater System Prompts

### 📝 System Prompts (Med Flersprogsunderstøttelse)

**`/app/backend/prompts/brix_prompt.txt`:**
- ✅ Understøtter 5 sprog: Dansk, Engelsk (UK/US), Tysk, Fransk
- ✅ Svarer automatisk på samme sprog som spørgsmålet
- ✅ Matcher ingredienser via keywords på tværs af sprog (f.eks. "strawberry" → "Jordbær sirup")
- ✅ Må kun bruge ingrediensdata fra databasen - aldrig gætte
- ✅ Sukker = sukkerlage, Alkohol altid til sidst
- ✅ Beregner: Samlet Brix, alkohol%, mængdeforhold, frysestabilitet (12-14°Bx range)

**`/app/backend/prompts/help_prompt.txt`:**
- ✅ Understøtter 5 sprog med automatisk sprogdetektion
- ✅ Korte, praktiske svar på brugerens sprog
- ✅ Henviser til Brix-assistent ved beregningsspørgsmål
- ✅ Kun verificeret viden, følger SlushBook-regler
- ✅ Hjælpsom, rolig og teknisk klar tone

Du kan redigere disse filer direkte og genstarte backend for at opdatere AI'ens opførsel.

### Brix Assistant Prompt:
```bash
nano /app/backend/prompts/brix_prompt.txt
# Gem og genstart backend:
sudo supervisorctl restart backend
```

### Help Assistant Prompt:
```bash
nano /app/backend/prompts/help_prompt.txt
# Gem og genstart backend:
sudo supervisorctl restart backend
```

---

## 🎨 UI Integration Eksempel

### React Component:
```jsx
import React, { useState } from 'react';

function AIAssistant() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const askBrix = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ai/brix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error('AI Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const askHelp = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ai/help`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error('AI Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Stil dit spørgsmål..."
      />
      <button onClick={askBrix} disabled={loading}>
        Brix Beregning
      </button>
      <button onClick={askHelp} disabled={loading}>
        Tips & Tricks
      </button>
      {loading && <p>Tænker...</p>}
      {response && (
        <div style={{ whiteSpace: 'pre-wrap' }}>
          {response}
        </div>
      )}
    </div>
  );
}
```

---

## 🔑 API Key

Bruger Emergent LLM key fra miljøvariabel:
```
EMERGENT_LLM_KEY=sk-emergent-0A93663479e74011f0
```

Denne key er allerede konfigureret og virker.

---

## 📊 Modeller

| Endpoint | Model | Formål |
|----------|-------|--------|
| `/api/ai/brix` | `gpt-4o` | Præcise beregninger |
| `/api/ai/help` | `gpt-4o-mini` | Hurtige svar |

**Note:** Oprindeligt var planen at bruge `gpt-5.1` og `o1-mini`, men disse er ikke tilgængelige via Emergent LLM key. Vi bruger derfor `gpt-4o` og `gpt-4o-mini` som fungerer perfekt.

---

## ✅ Næste Skridt

1. **Test endpoints** fra din frontend
2. **Tilføj flere ingredienser** til databasen
3. **Tilpas system prompts** efter behov
4. **Integrer i UI** med de komponenter du vil have

Alt er klart til at køre i preview! 🚀
