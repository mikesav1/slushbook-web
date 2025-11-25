# Guide til Oversættelse af Opskrifter via CSV

## 📥 Step 1: Download CSV

**Download linket:** https://bugfix-intl-tour.preview.emergentagent.com/recipe_translations_export.csv

Filen indeholder:
- 81 opskrifter
- 463 rækker total (1 header + beskrivelser og trin)
- Ca. 262KB

## 📊 CSV Format

CSV'en indeholder følgende kolonner:
- **Recipe ID**: Unikt ID for opskriften (BEHOLD SOM DEN ER)
- **Recipe Name**: Opskriftens navn (BEHOLD SOM DEN ER)
- **Field Type**: "Description" eller "Step" (BEHOLD SOM DEN ER)
- **Step Number**: Trin nummer, kun for steps (BEHOLD SOM DEN ER)
- **Danish (DA)**: Dansk tekst - DIN KILDETEKST (BEHOLD SOM DEN ER)
- **German (DE)**: Tysk oversættelse (ERSTAT MED KORREKT OVERSÆTTELSE)
- **French (FR)**: Fransk oversættelse (ERSTAT MED KORREKT OVERSÆTTELSE)
- **English UK (EN)**: Engelsk UK oversættelse (ERSTAT MED KORREKT OVERSÆTTELSE)
- **English US (EN_US)**: Engelsk US oversættelse (ERSTAT MED KORREKT OVERSÆTTELSE)

## 🤖 Step 2: Brug ChatGPT til Oversættelse

### Prompt til ChatGPT (kopier hele denne tekst):

```
Jeg har en CSV fil med 81 opskrifter (slush-drinks) der skal have professionelle oversættelser fra dansk til tysk, fransk og engelsk.

VIGTIGT OM FORMAT:
- CSV'en har 463 rækker (inkl. header)
- Du skal returnere PRÆCIS samme antal rækker og kolonner
- Behold alle quotes og kommaer som i originalen
- Returner den komplette CSV (alle 463 rækker)

HVAD SKAL OVERSÆTTES:
- Kolonne 6 (German/DE): Erstat med korrekt tysk oversættelse
- Kolonne 7 (French/FR): Erstat med korrekt fransk oversættelse
- Kolonne 8 (English UK/EN): Erstat med korrekt engelsk oversættelse
- Kolonne 9 (English US/EN_US): Erstat med korrekt amerikansk engelsk oversættelse

HVAD SKAL IKKE ÆNDRES:
- Kolonne 1-4: Recipe ID, Recipe Name, Field Type, Step Number (behold præcist)
- Kolonne 5: Danish (DA) - kildeteksten (behold præcist)
- Produktnavne: Cocio, Fanta, Sprite, Haribo, etc. (behold uændret i alle sprog)
- Emojis (behold uændret)
- Tal og enheder: °Bx, ml, g, % (behold uændret)
- Linje-skift (\n) i tekst (bevar disse)

OVERSÆTTELSESREGLER:
1. Naturlig, idiomatisk oversættelse - ikke ord-for-ord
2. Brug korrekte kulinariske termer for hvert sprog
3. Behold tonen: venlig, appetitlig, let forståelig
4. Tænk på målgruppen: både børn og voksne elsker slush
5. English UK vs US: UK bruger "flavour", US bruger "flavor", etc.

KVALITETSKRAV:
- Professionel fødevarebeskrivelse-kvalitet
- Ingen rester af dansk eller andre sprog i oversættelserne
- Grammatisk korrekt
- Lækkert og appetitligt sprog

Her er CSV filen (463 rækker):

[INDSÆT CSV INDHOLD HER - kopiér hele filen fra Excel/tekstprogram]

Returner nu den komplette CSV med alle 463 rækker og korrekte oversættelser i kolonne 6-9.
```

### Tips til arbejdet med ChatGPT:
1. **Åbn CSV'en i Excel/Google Sheets først** - tjek at den ser korrekt ud
2. **Kopiér hele CSV indholdet** (alle 463 rækker) fra Excel
3. **Indsæt i ChatGPT** sammen med prompten ovenfor
4. **ChatGPT vil muligvis opdele svaret** - bed den fortsætte indtil alle 463 rækker er færdige
5. **Verificér at du får præcis 463 rækker retur**

## 📤 Step 3: Gem den Oversatte CSV

Når ChatGPT er færdig:

1. **Kopiér hele ChatGPT's svar** (alle 463 rækker)
2. **Gem som en ny .csv fil på din computer** (f.eks. `recipe_translations_DONE.csv`)
3. **Åbn filen i Excel** og tjek:
   - At der er 463 rækker (samme som før)
   - At kolonne 1-5 er uændret
   - At kolonne 6-9 har nye, korrekte oversættelser
   - At der ikke er mærkelige tegn eller formatfejl
4. **Upload filen tilbage til mig** når du er klar

## ⚙️ Step 4: Import (gøres af agent)

Når du har uploaded den færdige CSV:
- Fortæl mig det, og jeg kører import-scriptet
- Jeg opdaterer alle 81 opskrifter i databasen
- Oversættelserne er live med det samme!

## 🎉 Færdig!

Alle opskrifter vil have professionelle, højkvalitets oversættelser!

---

## 📝 Bemærkninger

- **Hvorfor ikke automatisk oversættelse?** De nuværende maskin-oversættelser er meget dårlige (blandinger af dansk/tysk/fransk). Professionelle oversættelser via ChatGPT giver meget bedre kvalitet.
- **Hvor lang tid tager det?** ChatGPT bør kunne oversætte hele CSV'en på 5-10 minutter.
- **Alternativ:** Du kan også bruge den manuelle editor på `/admin/recipe-translations`, men det vil tage mange timer for 81 opskrifter.
