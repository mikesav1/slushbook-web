"""
Add/update Monin syrups to ingredients collection with verified data
Berry syrups (Jordbær, Hindbær, Blåbær) + Citrus syrups (Citron, Lime)
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def add_monin_syrups():
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'slushbook')
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Connected to database: {db_name}")
    
    monin_syrups = [
        {
            "name": "Jordbær Sirup",
            "brand": "Monin",
            "brix": 64.4,
            "volume_ml": None,
            "category": "sirup",
            "density_g_per_ml": 1.31,
            "ph": 2.9,
            "water_activity": 0.849,
            "carbs_g_per_100ml": 83.7,
            "sugars_g_per_100ml": 83.6,
            "energy_kcal_per_100ml": 339,
            "juice_content_percent": 18,
            "dilution_recommendation": "1+8 (1 del sirup til 8 dele væske)",
            "keywords": {
                "da": ["jordbær sirup", "jordbærsirup", "monin jordbær", "monin strawberry"],
                "de": ["erdbeer sirup", "erdbeersirup", "monin erdbeer"],
                "fr": ["sirop fraise", "sirop de fraise", "monin fraise"],
                "en_uk": ["strawberry syrup", "strawberry flavour syrup", "monin strawberry syrup"],
                "en_us": ["strawberry syrup", "strawberry flavored syrup", "monin strawberry syrup"]
            },
            "country": ["FR", "DK"],
            "alcohol_vol": 0,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            },
            "brix_source": "Monin Strawberry Syrup product specification, 10/03/2021"
        },
        {
            "name": "Hindbær Sirup",
            "brand": "Monin",
            "brix": 65.6,
            "volume_ml": None,
            "category": "sirup",
            "density_g_per_ml": 1.319,
            "acidity_g_per_l_citric": 6.2,
            "added_sugar_g_per_l": 843,
            "carbs_g_per_100g": 85.5,
            "sugars_g_per_100g": 85.4,
            "energy_kj_per_100g": 1470,
            "energy_kcal_per_100g": 339,
            "total_juice_percent": 27.6,
            "raspberry_juice_percent": 20.0,
            "ingredient_declaration": "Sugar, water, concentrated raspberry juice, concentrated lemon juice, natural raspberry flavouring, concentrated elderberry juice. Total fruit juice: 27.6%, including 20% raspberry juice.",
            "keywords": {
                "da": ["hindbær sirup", "hindbærsirup", "monin hindbær", "monin raspberry"],
                "de": ["himbeer sirup", "himbeersirup", "monin himbeer"],
                "fr": ["sirop framboise", "sirop de framboise", "monin framboise"],
                "en_uk": ["raspberry syrup", "raspberry flavour syrup", "monin raspberry syrup"],
                "en_us": ["raspberry syrup", "raspberry flavored syrup", "monin raspberry syrup"]
            },
            "country": ["MY", "FR", "DK"],
            "alcohol_vol": 0,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            },
            "brix_source": "Monin Raspberry Syrup 0.7L Product Fact Sheet, Stuart Alexander & Co Pty Ltd, 27.04.2019"
        },
        {
            "name": "Blåbær Sirup",
            "brand": "Monin",
            "brix": 65.3,
            "volume_ml": None,
            "category": "sirup",
            "density_g_per_ml": 1.317,
            "ph": 2.8,
            "carbs_g_per_100ml": 84.9,
            "sugars_g_per_100ml": 84.7,
            "energy_kcal_per_100ml": 339,
            "juice_content_percent": 17,
            "blueberry_juice_percent": 12,
            "keywords": {
                "da": ["blåbær sirup", "blåbærsirup", "monin blåbær"],
                "de": ["heidelbeersirup", "blau beer sirup", "monin heidelbeer"],
                "fr": ["sirop myrtille", "sirop de myrtille", "monin myrtille"],
                "en_uk": ["blueberry syrup", "blueberry flavour syrup", "monin blueberry syrup"],
                "en_us": ["blueberry syrup", "blueberry flavored syrup", "monin blueberry syrup"]
            },
            "country": ["DK", "FR"],
            "alcohol_vol": 0,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            },
            "brix_source": "Monin Blueberry Syrup specification 2018"
        },
        {
            "name": "Citron Sirup",
            "brand": "Monin",
            "brix": 55.7,
            "volume_ml": None,
            "category": "sirup",
            "density_g_per_ml": 1.269,
            "ph": 2.5,
            "carbs_g_per_100ml": 76.9,
            "sugars_g_per_100ml": 76.6,
            "energy_kcal_per_100ml": 308,
            "juice_content_percent": 22,
            "lemon_juice_percent": 22,
            "acidity_type": "citric acid",
            "acid_g_per_l": 8.1,
            "keywords": {
                "da": ["citron sirup", "citronsirup", "monin citron", "monin lemon"],
                "de": ["zitronensirup", "zitrone sirup", "monin zitrone"],
                "fr": ["sirop citron", "sirop de citron", "monin citron"],
                "en_uk": ["lemon syrup", "lemon flavour syrup", "monin lemon syrup"],
                "en_us": ["lemon syrup", "lemon flavored syrup", "monin lemon syrup"]
            },
            "country": ["FR", "DK"],
            "alcohol_vol": 0,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            },
            "brix_source": "Monin Lemon Syrup Product Specification 2020"
        },
        {
            "name": "Lime Sirup",
            "brand": "Monin",
            "brix": 55.1,
            "volume_ml": None,
            "category": "sirup",
            "density_g_per_ml": 1.268,
            "ph": 2.4,
            "carbs_g_per_100ml": 76.5,
            "sugars_g_per_100ml": 76.2,
            "energy_kcal_per_100ml": 307,
            "juice_content_percent": 20,
            "lime_juice_percent": 20,
            "acidity_type": "citric acid",
            "acid_g_per_l": 8.5,
            "keywords": {
                "da": ["lime sirup", "limesirup", "monin lime", "lime flavor"],
                "de": ["limetten sirup", "limettensirup", "monin limette"],
                "fr": ["sirop citron vert", "sirop de lime", "monin citron vert"],
                "en_uk": ["lime syrup", "lime flavour syrup", "monin lime syrup"],
                "en_us": ["lime syrup", "lime flavored syrup", "monin lime syrup"]
            },
            "country": ["FR", "DK"],
            "alcohol_vol": 0,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            },
            "brix_source": "Monin Lime Syrup Product Specification 2020"
        },
        {
            "name": "Vanilje Sirup",
            "brand": "Monin",
            "brix": 60.1,
            "volume_ml": None,
            "category": "sirup",
            "density_g_per_ml": 1.284,
            "ph": 3.0,
            "carbs_g_per_100ml": 79.8,
            "sugars_g_per_100ml": 79.6,
            "energy_kcal_per_100ml": 322,
            "vanilla_origin": "Madagascar Bourbon",
            "vanilla_type": "Natural vanilla flavouring",
            "juice_content_percent": 0,
            "acidity_type": None,
            "acid_g_per_l": None,
            "keywords": {
                "da": ["vanilje sirup", "vaniljesirup", "monin vanilje", "vanilla syrup"],
                "de": ["vanille sirup", "vanillesirup", "monin vanille"],
                "fr": ["sirop vanille", "sirop de vanille", "monin vanille"],
                "en_uk": ["vanilla syrup", "vanilla flavour syrup", "monin vanilla syrup"],
                "en_us": ["vanilla syrup", "vanilla flavored syrup", "monin vanilla syrup"]
            },
            "country": ["FR", "DK"],
            "alcohol_vol": 0,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            },
            "brix_source": "Monin Vanilla Syrup Product Specification (2020)"
        },
        {
            "name": "Hasselnød Sirup",
            "brand": "Monin",
            "brix": 63.9,
            "volume_ml": None,
            "category": "sirup",
            "density_g_per_ml": 1.309,
            "ph": 3.1,
            "carbs_g_per_100ml": 83.5,
            "sugars_g_per_100ml": 82.9,
            "energy_kcal_per_100ml": 336,
            "juice_content_percent": 0,
            "nut_content_type": "Natural hazelnut flavouring",
            "contains_nut_allergen": False,
            "color": "amber / golden",
            "acidity_type": None,
            "acid_g_per_l": None,
            "keywords": {
                "da": ["hasselnød sirup", "hasselnødsirup", "monin hasselnød", "monin hazelnut"],
                "de": ["haselnuss sirup", "haselnusssirup", "monin haselnuss"],
                "fr": ["sirop noisette", "sirop de noisette", "monin noisette"],
                "en_uk": ["hazelnut syrup", "hazelnut flavour syrup", "monin hazelnut syrup"],
                "en_us": ["hazelnut syrup", "hazelnut flavored syrup", "monin hazelnut syrup"]
            },
            "country": ["FR", "DK"],
            "alcohol_vol": 0,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            },
            "brix_source": "Monin Hazelnut Syrup Product Specification (2020)"
        },
        {
            "name": "Mynte Sirup",
            "brand": "Monin",
            "brix": 55.8,
            "volume_ml": None,
            "category": "sirup",
            "density_g_per_ml": 1.257,
            "water_activity": 0.898,
            "carbs_g_per_100ml": 70,
            "sugars_g_per_100ml": 70,
            "energy_kcal_per_100ml": 282,
            "juice_content_percent": 0,
            "mint_flavour_type": "Natural mint flavouring",
            "color": "clear / pale green",
            "keywords": {
                "da": ["mynte sirup", "mynte-sirup", "monin mynte", "monin mint"],
                "de": ["minzsirup", "minze sirup", "monin minze"],
                "fr": ["sirop menthe", "sirop de menthe", "monin menthe"],
                "en_uk": ["mint syrup", "mint flavour syrup", "monin mint syrup"],
                "en_us": ["mint syrup", "mint flavored syrup", "monin mint syrup"]
            },
            "country": ["FR", "DK"],
            "alcohol_vol": 0,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            },
            "brix_source": "Monin Mojito Mint Syrup Product Specification, 10/02/2021"
        }
    ]
    
    # Insert or update each syrup
    for syrup in monin_syrups:
        existing = await db.ingredients.find_one({"name": syrup["name"]})
        
        if existing:
            # Update
            result = await db.ingredients.update_one(
                {"name": syrup["name"]},
                {"$set": syrup}
            )
            print(f"✅ Updated {syrup['name']} - Brix: {syrup['brix']}°Bx")
        else:
            # Insert
            result = await db.ingredients.insert_one(syrup)
            print(f"✅ Added {syrup['name']} - Brix: {syrup['brix']}°Bx")
    
    # Show total count
    total = await db.ingredients.count_documents({})
    print(f"\n📦 Total ingredients in database: {total}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_monin_syrups())
