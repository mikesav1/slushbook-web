# Guide til Oversættelse af Opskrifter via CSV

## 📥 Step 1: Download CSV

Filen ligger her: `/app/recipe_translations_export.csv`

Du kan downloade den via:
- File browser i Emergent
- Eller via bash: `cat /app/recipe_translations_export.csv > din_lokale_fil.csv`

## 📊 CSV Format

CSV'en indeholder følgende kolonner:
- **Recipe ID**: Unikt ID for opskriften
- **Recipe Name**: Opskriftens navn
- **Field Type**: "Description" eller "Step"
- **Step Number**: Trin nummer (kun for steps)
- **Danish (DA)**: Dansk tekst (master)
- **German (DE)**: Tysk oversættelse (skal rettes)
- **French (FR)**: Fransk oversættelse (skal rettes)
- **English UK (EN)**: Engelsk UK oversættelse (skal rettes)
- **English US (EN_US)**: Engelsk US oversættelse (skal rettes)

## 🤖 Step 2: Brug ChatGPT til Oversættelse

### Prompt til ChatGPT:

```
Jeg har en CSV fil med opskrifts-beskrivelser og trin-for-trin instruktioner der skal oversættes fra dansk til tysk, fransk og engelsk.

Format: 
- Kolonne 1-4: ID, navn, type, trin nummer (behold som de er)
- Kolonne 5: Dansk tekst (master - behold)
- Kolonne 6-9: Tysk, Fransk, Engelsk UK, Engelsk US (erstat med korrekte oversættelser)

Regler:
1. Behold CSV strukturen præcist (samme antal rækker og kolonner)
2. Oversæt IKKE: produktnavne (Cocio, Fanta, etc.), emojis, tal, °Bx, ml
3. Oversæt ALLE andre tekster naturligt og idiomatisk
4. Brug kulinariske termer korrekt (f.eks. "blend" → DE: "mixen", FR: "mixer", EN: "blend")
5. Behold tonen: venlig, let forståelig, appetitlig

Her er CSV filen:
[INDSÆT CSV INDHOLD HER]

Returner den komplette CSV med alle korrekte oversættelser.
```

## 📤 Step 3: Gem Oversat CSV

1. Kopier den oversatte CSV fra ChatGPT
2. Gem den som `recipe_translations_import.csv`
3. Upload til `/app/recipe_translations_import.csv` på serveren

## ⚙️ Step 4: Kør Import Script

```bash
cd /app/backend
python3 import_recipes_from_csv.py
```

Dette vil:
- ✅ Indlæse alle oversættelser fra CSV
- ✅ Opdatere alle 76 opskrifter i databasen
- ✅ Gemme backup til recipe_translations.json
- ✅ Oversættelserne er live med det samme!

## 🎉 Done!

Alle opskrifter har nu korrekte, professionelle oversættelser!

---

## Alternativ: Manuel redigering via UI

Hvis du foretrækker at rette én og én opskrift:
1. Gå til `/admin/recipe-translations`
2. Vælg opskrift
3. Vælg sprog
4. Ret tekst
5. Gem alle ændringer

Men CSV-metoden er MEGET hurtigere for alle 76 opskrifter! 🚀
