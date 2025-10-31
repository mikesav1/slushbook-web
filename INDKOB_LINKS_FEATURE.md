# Indkøb Links på Opskrifter - Feature Dokumentation

## Dato: 31. Oktober 2025

## Feature Beskrivelse
Produktlinks ("Indkøb") er nu integreret direkte i opskrifterne, så brugere kan købe ingredienser med ét klik fra leverandører.

## Funktionalitet

### Hvor vises det?
På **opskrift detail siden** ved hver ingrediens der har en tilknyttet produkt mapping.

### Hvordan ser det ud?
- 🛒 **Kurv-ikon** ved siden af ingrediens navnet
- Tekst: **"Indkøb"**
- Farve: Grøn (emerald-600) med hover effekt
- Eksternt link ikon (åbner i nyt vindue)

### Eksempel
```
Lime sirup                          200 ml
🛒 Indkøb ↗
```

## Hvordan det virker

### 1. Matching System
Systemet matcher automatisk ingrediens navne til produkt mappings baseret på **keywords**:

```javascript
// Eksempel fra koden:
const mappingId = getMappingForIngredient("Lime sirup");
// Returnerer: "power-flavours-category" (hvis match findes)
```

**Matching logik:**
- Tjekker ingrediens navn mod alle mapping keywords
- Vælger den **længste match** (mest specifik)
- Eksempel: "lime sirup" matcher keyword "lime" i mapping

### 2. Redirect Flow
Når bruger klikker på "Indkøb":

1. **Klik** på 🛒 Indkøb link
2. **Redirect** til `/api/go/{mapping_id}`
3. **Backend** finder aktiv supplier option
4. **Tilføjer** UTM tracking parametre
5. **Logger** klik i MongoDB
6. **Redirecter** bruger til leverandør website

**URL struktur:**
```
Frontend link: /api/go/power-flavours-category
↓
Backend finder: power-flavours-category mapping
↓
Henter active option: power.dk URL
↓
Tilføjer UTM: ?utm_source=slushbook&utm_medium=app&utm_campaign=buy
↓
Redirect til leverandør
```

### 3. Click Tracking
Alle klik logges automatisk i MongoDB:
```javascript
{
  id: "uuid",
  mappingId: "power-flavours-category",
  ts: "2025-10-31T09:00:00.000Z",
  userAgent: "Mozilla/5.0...",
  referer: "https://slushice-recipes.emergent.host/recipe/123"
}
```

## Teknisk Implementation

### Frontend Ændringer

**Fil:** `/app/frontend/src/pages/RecipeDetailPage.js`

```javascript
// Opdateret API URLs (fjernet proxy)
const REDIRECT_API = `${API}/go`;  // FØR: /redirect-proxy/go
const ADMIN_REDIRECT_API = `${API}/admin`;

// Ingrediens rendering med Indkøb link
{mappingId && (
  <a
    href={`${REDIRECT_API}/${mappingId}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-colors"
  >
    <FaShoppingCart className="w-4 h-4" />
    <span>Indkøb</span>
    <svg className="w-3 h-3">...</svg> {/* Eksternt link ikon */}
  </a>
)}
```

### Backend Endpoints

**Fil:** `/app/backend/redirect_routes.py`

**Redirect endpoint:**
```python
@go_router.get("/{mapping_id}")
async def redirect_to_product(mapping_id: str, ...):
    # 1. Log click
    await db.redirect_clicks.insert_one({...})
    
    # 2. Find active option
    option = await db.redirect_options.find_one(
        {"mappingId": mapping_id, "status": "active"}
    )
    
    # 3. Build redirect URL with UTM
    target_url = add_utm(wrap_affiliate(option["url"]))
    
    # 4. Redirect (302)
    return Response(status_code=302, headers={"Location": target_url})
```

## Hvem ser det?

✅ **Alle brugere** kan se og bruge Indkøb links:
- Guests (ikke logget ind)
- Free brugere
- Pro brugere
- Admin

Dette er forskelligt fra "Tilføj til Liste" knappen som kun er tilgængelig for Pro brugere.

## Mapping Management

Admin kan administrere produktlinks i **Admin → Links & Leverandører**:

1. **Opret Mapping:**
   - Produkt navn: "SodaStream Pepsi 440 ml"
   - Keywords: "pepsi,cola,sodastream pepsi"
   - EAN (optional)

2. **Tilføj Options:**
   - Leverandør: Power
   - URL: https://www.power.dk/...
   - Titel: "SodaStream Pepsi 440 ml"
   - Status: Aktiv/Inaktiv

3. **Auto-matching:**
   - Når en opskrift har ingrediens "Pepsi sirup"
   - System matcher "pepsi" keyword
   - Viser Indkøb link der redirecter til Power

## Test Resultater ✅

### Lokal Test
- ✅ Indkøb links vises korrekt på opskrifter
- ✅ Kun ingredienser med mappings får link
- ✅ Kurv-ikon og "Indkøb" tekst vises
- ✅ Link URL format: `/api/go/{mapping_id}`
- ✅ Finder 2 Indkøb links i test opskrift

### Eksempel Mappings
**Fungerende links fundet:**
1. "Lime sirup" → `/api/go/power-flavours-category`
2. "Mynte sirup" → `/api/go/power-flavours-category`

**Ingen link (som forventet):**
- "Hvid rom" (ingen mapping endnu)
- "Vand/knust is" (ingen mapping endnu)

## Fordele

✅ **For Brugere:**
- Nem adgang til ingredienser med ét klik
- Åbner i nyt vindue (forstyrrer ikke opskrift browsing)
- Visuelt klart med kurv-ikon

✅ **For Admin:**
- Fuld kontrol over hvilke links der vises
- Kan tilføje/fjerne/opdatere links efter behov
- Kan se click statistics

✅ **For Business:**
- Affiliate tracking via UTM parametre
- Click logging for analytics
- Kan opgradere til affiliate netværk (Skimlinks) senere

## Næste Skridt

### Anbefalinger til Brugeren:
1. **Tilføj flere mappings** i Admin Links for mere ingredienser
2. **Test links** i produktion efter deployment
3. **Overvej affiliate program** for at tjene provision

### Potentielle Forbedringer:
- Vis leverandør logo/navn ved siden af Indkøb
- "Vis alle leverandører" hvis flere options findes
- Pris information (hvis tilgængelig)
- "Køb alle ingredienser" samlet funktion

## Deployment Klar

✅ Alle ændringer er implementeret og testet lokalt
✅ Klar til deployment sammen med redirect-service migration
✅ Ingen breaking changes for eksisterende funktionalitet
