# 🧮 Brix Calculator - Komplet Guide

## Oversigt

SlushBook har nu **3 måder** at beregne Brix på:

1. **AI Assistant** (`/api/ai/brix`) - Naturligt sprog, henter ingredienser fra database
2. **Direkte Beregning** (`/api/brix/calculate`) - Hurtig matematisk beregning
3. **Justeringsberegner** (`/api/brix/adjust`) - Beregn hvor meget vand/sirup der skal tilføjes

Alle bruger den **samme præcise formel**.

---

## 📐 Formlen

### Grundformel (Bruges i alle 3 metoder)

```
Samlet Brix = (∑(brix_i × ml_i)) / (∑ ml_i)
```

### Trin-for-trin:
1. For hver ingrediens: Brix × ml
2. Læg alle disse tal sammen (numerator)
3. Divider med total ml
4. Rund til 1-2 decimaler

### Eksempel:
```
200 ml hindbærsirup (59°Bx) + 800 ml vand (0°Bx)

Beregning:
= (59 × 200 + 0 × 800) / (200 + 800)
= (11800 + 0) / 1000
= 11.8°Bx
```

---

## 🎯 Ideal Brix for Slush

**Optimal range:** 12-14°Bx

- **Under 12°Bx:** For lavt sukkerindhold - fryser ikke stabilt, kan blive til is
- **12-14°Bx:** PERFEKT! - Stabil slush-konsistens
- **Over 14°Bx:** For højt sukkerindhold - fryser for langsomt eller slet ikke

---

## 🔢 Alkoholberegning

### Formel:
```
Alkohol% = ((ml_alkohol × vol%_alkohol / 100) / total_ml) × 100
```

### Eksempel:
```
50 ml vodka (40% vol) i 1000 ml total

Beregning:
= ((50 × 40 / 100) / 1000) × 100
= (20 / 1000) × 100
= 2.0% vol
```

### Vigtige regler for alkohol:
- ✅ Alkohol har **0 Brix** (ingen sukker)
- ⚠️ **Alkohol tilsættes ALTID til sidst**
- ⚠️ Over 10% alkohol kan påvirke frysning negativt

---

## 🚀 API Endpoints

### 1. POST `/api/ai/brix` - AI Assistant

**Formål:** Naturligt sprog, automatisk ingredient matching

**Request:**
```json
{
  "query": "Beregn Brix for 300ml jordbær sirup og 700ml vand"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Baseret på databasen har jordbærsirup 65°Bx...\n\nBeregning:\n(65×300 + 0×700) / 1000 = 19.5°Bx",
  "ingredients_count": 8
}
```

**Features:**
- ✅ Forstår naturligt sprog på 5 sprog
- ✅ Matcher ingredienser via keywords
- ✅ Henter Brix-værdier fra database
- ✅ Viser beregning trin-for-trin
- ✅ Giver anbefalinger

---

### 2. POST `/api/brix/calculate` - Direkte Beregning

**Formål:** Hurtig, præcis matematisk beregning uden AI

**Request:**
```json
{
  "ingredients": [
    {"name": "Hindbær sirup", "volume_ml": 200, "brix": 59},
    {"name": "Vand", "volume_ml": 800, "brix": 0}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "total_brix": 11.8,
  "total_volume_ml": 1000.0,
  "alcohol_percentage": null,
  "is_stable_for_slush": false,
  "recommendation": "Brix er for lav (11.8°Bx). Tilføj 0.2°Bx mere sukker/sirup for at nå 12°Bx."
}
```

**Med alkohol:**
```json
{
  "ingredients": [
    {"name": "Jordbær sirup", "volume_ml": 300, "brix": 65},
    {"name": "Vand", "volume_ml": 650, "brix": 0},
    {"name": "Vodka", "volume_ml": 50, "brix": 0, "alcohol_vol": 40}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "total_brix": 19.5,
  "total_volume_ml": 1000.0,
  "alcohol_percentage": 2.0,
  "is_stable_for_slush": false,
  "recommendation": "Brix er for høj (19.5°Bx). Tilføj mere vand... ⚠️ Husk: Alkohol tilsættes ALTID til sidst."
}
```

**Features:**
- ⚡ Meget hurtig (ingen AI latency)
- ✅ Præcis matematisk beregning
- ✅ Understøtter alkohol
- ✅ Giver stabilitetsvurdering
- ✅ Konkrete anbefalinger

---

### 3. POST `/api/brix/adjust` - Justeringsberegner

**Formål:** Beregn hvor meget vand eller sirup der skal tilføjes

**Request:**
```json
{
  "ingredients": [
    {"name": "Sirup", "volume_ml": 300, "brix": 65},
    {"name": "Vand", "volume_ml": 700, "brix": 0}
  ],
  "target_brix": 13.0,
  "adjustment_type": "water"
}
```

**Response:**
```json
{
  "success": true,
  "current_brix": 19.5,
  "target_brix": 13.0,
  "ml_to_add": 500.0,
  "ingredient": "water"
}
```

**Forklaring:**
- Nuværende Brix: 19.5°Bx
- Ønsket Brix: 13.0°Bx
- **Tilføj 500ml vand** for at nå 13.0°Bx

**adjustment_type options:**
- `"water"` - Tilføj vand for at sænke Brix
- `"syrup"` - Tilføj sirup (65°Bx) for at hæve Brix

---

## 💻 Brug i Frontend

### React/JavaScript Eksempel:

```jsx
// 1. AI Assistant (naturligt sprog)
async function askAI(question) {
  const response = await fetch(`${API_URL}/api/ai/brix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: question })
  });
  const data = await response.json();
  return data.response;
}

// 2. Direkte beregning
async function calculateBrix(ingredients) {
  const response = await fetch(`${API_URL}/api/brix/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredients })
  });
  const data = await response.json();
  return data;
}

// 3. Justeringsberegning
async function adjustBrix(ingredients, targetBrix) {
  const response = await fetch(`${API_URL}/api/brix/adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ingredients,
      target_brix: targetBrix,
      adjustment_type: 'water'
    })
  });
  const data = await response.json();
  return data;
}

// Brug:
const ingredients = [
  { name: "Jordbær sirup", volume_ml: 300, brix: 65 },
  { name: "Vand", volume_ml: 700, brix: 0 }
];

const result = await calculateBrix(ingredients);
console.log(`Total Brix: ${result.total_brix}°Bx`);
console.log(`Stable: ${result.is_stable_for_slush}`);
console.log(`Advice: ${result.recommendation}`);

// Hvis Brix er for høj/lav:
const adjustment = await adjustBrix(ingredients, 13.0);
console.log(`Add ${adjustment.ml_to_add}ml water to reach 13°Bx`);
```

---

## 🧪 Test Eksempler

### Test 1: Basis Beregning
```bash
curl -X POST http://localhost:8001/api/brix/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "ingredients": [
      {"name": "Hindbær sirup", "volume_ml": 200, "brix": 59},
      {"name": "Vand", "volume_ml": 800, "brix": 0}
    ]
  }'
```

**Forventet:** `11.8°Bx` (lidt for lavt, anbefal mere sirup)

### Test 2: Med Alkohol
```bash
curl -X POST http://localhost:8001/api/brix/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "ingredients": [
      {"name": "Jordbær sirup", "volume_ml": 300, "brix": 65},
      {"name": "Vand", "volume_ml": 650, "brix": 0},
      {"name": "Vodka", "volume_ml": 50, "brix": 0, "alcohol_vol": 40}
    ]
  }'
```

**Forventet:** `19.5°Bx`, `2.0% alkohol` (for højt, anbefal mere vand)

### Test 3: Justering
```bash
curl -X POST http://localhost:8001/api/brix/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "ingredients": [
      {"name": "Sirup", "volume_ml": 300, "brix": 65},
      {"name": "Vand", "volume_ml": 700, "brix": 0}
    ],
    "target_brix": 13.0,
    "adjustment_type": "water"
  }'
```

**Forventet:** Tilføj ~500ml vand

---

## 📊 Python Utility Functions

Alle funktioner findes i `/app/backend/utils/brix_calculator.py`:

```python
from utils.brix_calculator import (
    calculate_brix,
    calculate_adjustment_to_target_brix,
    Ingredient
)

# Opret ingredienser
ingredients = [
    Ingredient(name="Sirup", volume_ml=200, brix=65),
    Ingredient(name="Vand", volume_ml=800, brix=0)
]

# Beregn Brix
result = calculate_brix(ingredients)
print(f"Brix: {result.total_brix}°Bx")
print(f"Stable: {result.is_stable_for_slush}")
print(f"Advice: {result.recommendation}")

# Beregn justering
adjustment = calculate_adjustment_to_target_brix(ingredients, target_brix=13.0)
print(f"Add {adjustment['ml_to_add']}ml water")
```

---

## ✅ Hvornår Bruge Hvilken?

| Use Case | Endpoint | Hvorfor? |
|----------|----------|----------|
| User stiller spørgsmål | `/api/ai/brix` | Forstår naturligt sprog, finder ingredienser |
| Beregn fra opskrift | `/api/brix/calculate` | Hurtigst, præcis, ingen AI latency |
| Juster opskrift | `/api/brix/adjust` | Beregn præcist hvor meget der skal tilføjes |
| Vis ingrediens-info | `/api/ai/brix` | Kan forklare hvorfor |
| Real-time calculator i UI | `/api/brix/calculate` | Instant feedback |

---

## 🎓 Best Practices

### For Frontend Udviklere:
1. Brug `/api/brix/calculate` til real-time beregninger i UI
2. Brug `/api/ai/brix` til chat/assistance features
3. Cache ingredient Brix-værdier for performance
4. Vis altid stabilitetsindikatoren (12-14°Bx)

### For Opskriftsforfattere:
1. Mål altid i ml (ikke gram)
2. Verificer Brix-værdier i ingredients database
3. Test opskrifter med calculator før publicering
4. Husk: Alkohol tilføjes sidst

### For AI Prompts:
1. AI'en bruger nu den præcise formel automatisk
2. AI'en viser altid beregningen trin-for-trin
3. AI'en advarer om ustabile Brix-værdier
4. AI'en bruger kun database-værdier (aldrig gætter)

---

## 🚀 Klar til Brug

Alle 3 endpoints er testet og klar i preview:

```
POST https://bugfix-intl-tour.preview.emergentagent.com/api/ai/brix
POST https://bugfix-intl-tour.preview.emergentagent.com/api/brix/calculate
POST https://bugfix-intl-tour.preview.emergentagent.com/api/brix/adjust
```

**Matematikken er korrekt. Formlen virker. Start med at integrere i UI! 🎉**
