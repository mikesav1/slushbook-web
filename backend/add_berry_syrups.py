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
        },
        {
            "name": "Pink Shake Sirup",
            "brand": "Monin",
            "brix": 57.4,
            "volume_ml": None,
            "category": "sirup",
            "density_g_per_ml": 1.273,
            "ph": 2.7,
            "carbs_g_per_100ml": 78.3,
            "sugars_g_per_100ml": 78.1,
            "energy_kcal_per_100ml": 314,
            "juice_content_percent": 22,
            "pink_grapefruit_juice_percent": 22,
            "flavour_profile": "Pink grapefruit, floral citrus, light bitterness",
            "color": "pink / rose",
            "acidity_type": "citric acid",
            "acid_g_per_l": 7.4,
            "keywords": {
                "da": ["pink shake", "pink shake sirup", "pink grape sirup", "pink grapefrugt sirup", "monin pink shake"],
                "de": ["pink grapefruit sirup", "pink grapefruitsirup", "monin pink grapefruit"],
                "fr": ["sirop pamplemousse rose", "sirop pamplemousse", "monin pamplemousse rose"],
                "en_uk": ["pink grapefruit syrup", "pink shake syrup", "monin pink grapefruit syrup"],
                "en_us": ["pink grapefruit syrup", "pink shake syrup", "monin pink grapefruit syrup"]
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
            "brix_source": "Monin Pink Grapefruit Syrup Product Specification (2020)"
        },
        {
            "name": "Grenadine Sirup",
            "brand": "Monin",
            "brix": 68.0,
            "volume_ml": None,
            "category": "sirup",
            "density_g_per_ml": 1.328,
            "ph": 3.1,
            "carbs_g_per_100ml": 85.7,
            "sugars_g_per_100ml": 85.4,
            "energy_kcal_per_100ml": 341,
            "juice_content_percent": 10,
            "flavour_profile": "Pomegranate and red berry flavours",
            "color": "deep red",
            "acidity_type": "citric acid",
            "acid_g_per_l": 5.9,
            "keywords": {
                "da": ["grenadine sirup", "grenadinesirup", "monin grenadine"],
                "de": ["grenadinesirup", "grenadine sirup", "monin grenadine"],
                "fr": ["sirop grenadine", "monin grenadine"],
                "en_uk": ["grenadine syrup", "monin grenadine syrup"],
                "en_us": ["grenadine syrup", "monin grenadine syrup"]
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
            "brix_source": "Monin Grenadine Syrup Product Specification (2020)"
        },
        {
            "name": "Appelsin Sirup",
            "brand": "Monin",
            "brix": 58.2,
            "volume_ml": None,
            "category": "sirup",
            "density_g_per_ml": 1.276,
            "ph": 2.9,
            "carbs_g_per_100ml": 77.8,
            "sugars_g_per_100ml": 77.5,
            "energy_kcal_per_100ml": 311,
            "juice_content_percent": 24,
            "orange_juice_percent": 24,
            "flavour_profile": "Sweet orange peel, citrus zest, mild bitterness",
            "color": "bright orange",
            "acidity_type": "citric acid",
            "acid_g_per_l": 6.9,
            "keywords": {
                "da": ["appelsin sirup", "appelsinsirup", "monin appelsin", "monin orange"],
                "de": ["orangensirup", "monin orange sirup", "orange sirup"],
                "fr": ["sirop orange", "sirop d'orange", "monin orange"],
                "en_uk": ["orange syrup", "citrus orange syrup", "monin orange syrup"],
                "en_us": ["orange syrup", "orange flavored syrup", "monin orange syrup"]
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
            "brix_source": "Monin Orange Syrup Product Specification (2020)"
        },
        {
            "name": "Monin Blue Curaçao Sirup",
            "brand": "Monin",
            "brix": 50.5,
            "volume_ml": 700,
            "category": "sirup",
            "density_g_per_ml": 1.240,
            "ph": 3.0,
            "carbs_g_per_100ml": 72.1,
            "sugars_g_per_100ml": 71.8,
            "energy_kcal_per_100ml": 285,
            "juice_content_percent": 0,
            "flavour_profile": "Citrus (bitter orange / curaçao orange), sweet, vibrant",
            "color": "bright blue (E133)",
            "acidity_type": "citric acid",
            "acid_g_per_l": 5.8,
            "keywords": {
                "da": ["blå curaçao sirup", "blå curacao sirup", "blue curacao sirup", "monin blå curaçao"],
                "de": ["blauer curaçao sirup", "blau curacao sirup", "monin curaçao blau"],
                "fr": ["sirop curaçao bleu", "sirop bleu curaçao", "monin curaçao bleu"],
                "en_uk": ["blue curaçao syrup", "blue curacao syrup", "monin blue curaçao syrup"],
                "en_us": ["blue curaçao syrup", "blue curacao syrup", "monin blue curaçao syrup"]
            },
            "country": ["FR", "DK"],
            "alcohol_vol": 0,
            "links": {
                "DK": "https://barshopen.dk/da/barudstyr/mixers-og-sirup/monin-blue-curacao-70-cl/",
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            },
            "brix_source": "Monin Blue Curaçao Syrup Product Specification (2019)"
        },
        {
            "name": "Chokolade Sirup",
            "brand": "Monin",
            "brix": 64.6,
            "volume_ml": None,
            "category": "sirup",
            "density_g_per_ml": 1.318,
            "ph": 6.0,
            "carbs_g_per_100ml": 84.7,
            "sugars_g_per_100ml": 84.4,
            "energy_kcal_per_100ml": 337,
            "juice_content_percent": 0,
            "cocoa_content_percent": 3.5,
            "flavour_profile": "Chocolate, cocoa bean, sweet creamy notes",
            "color": "dark brown",
            "allergen_info": "Contains no dairy (non-milk chocolate flavouring)",
            "acidity_type": None,
            "acid_g_per_l": None,
            "keywords": {
                "da": ["chokolade sirup", "chokoladesirup", "kakao sirup", "monin chokolade"],
                "de": ["schokoladensirup", "kakao sirup", "monin schokolade"],
                "fr": ["sirop chocolat", "sirop de chocolat", "monin chocolat"],
                "en_uk": ["chocolate syrup", "cocoa syrup", "monin chocolate syrup"],
                "en_us": ["chocolate syrup", "cocoa flavored syrup", "monin chocolate syrup"]
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
            "brix_source": "Monin Chocolate Syrup Product Specification (2020)"
        },
        {
            "name": "Kokos Sirup",
            "brand": "Monin",
            "brix": 61.2,
            "volume_ml": None,
            "category": "sirup",
            "density_g_per_ml": 1.287,
            "ph": 4.9,
            "carbs_g_per_100ml": 79.6,
            "sugars_g_per_100ml": 79.2,
            "energy_kcal_per_100ml": 321,
            "juice_content_percent": 0,
            "coconut_flavour_type": "Natural coconut flavouring",
            "color": "milky / opaque white",
            "allergen_info": "Contains no actual coconut allergen (aroma based)",
            "acidity_type": None,
            "acid_g_per_l": None,
            "keywords": {
                "da": ["kokos sirup", "kokossirup", "monin kokos", "coconut syrup"],
                "de": ["kokossirup", "kokos sirup", "monin kokosnuss"],
                "fr": ["sirop coco", "sirop de noix de coco", "monin coco"],
                "en_uk": ["coconut syrup", "coconut flavour syrup", "monin coconut syrup"],
                "en_us": ["coconut syrup", "coconut flavored syrup", "monin coconut syrup"]
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
            "brix_source": "Monin Coconut Syrup Product Specification (2020)"
        },
        {
            "name": "Mandel Sirup",
            "brand": "Monin",
            "brix": 64.0,
            "volume_ml": None,
            "category": "sirup",
            "density_g_per_ml": 1.311,
            "ph": 6.4,
            "carbs_g_per_100ml": 84.2,
            "sugars_g_per_100ml": 83.8,
            "energy_kcal_per_100ml": 336,
            "juice_content_percent": 0,
            "almond_flavour_type": "Bitter almond + orange blossom aroma",
            "contains_nut_allergen": False,
            "color": "milky white",
            "acidity_type": None,
            "acid_g_per_l": None,
            "keywords": {
                "da": ["mandel sirup", "mandelsirup", "orgeat sirup", "monin mandel", "monin orgeat"],
                "de": ["mandelsirup", "orgeat sirup", "monin mandel"],
                "fr": ["sirop orgeat", "sirop amande", "monin orgeat"],
                "en_uk": ["orgeat syrup", "almond syrup", "monin orgeat syrup"],
                "en_us": ["almond syrup", "orgeat syrup", "monin almond syrup"]
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
            "brix_source": "Monin Orgeat (Almond) Syrup Product Specification (2020)"
        },
        {
            "name": "Vandmelon Sirup",
            "brand": "Monin",
            "brix": 52.9,
            "volume_ml": None,
            "category": "sirup",
            "density_g_per_ml": 1.259,
            "ph": 3.5,
            "carbs_g_per_100ml": 73.4,
            "sugars_g_per_100ml": 73.1,
            "energy_kcal_per_100ml": 287,
            "juice_content_percent": 20,
            "watermelon_juice_percent": 20,
            "flavour_profile": "Fresh watermelon, sweet, light, summery",
            "color": "bright red / pink",
            "acidity_type": "citric acid",
            "acid_g_per_l": 6.4,
            "keywords": {
                "da": ["vandmelon sirup", "vandmelonsirup", "monin vandmelon", "watermelon syrup"],
                "de": ["wassermelone sirup", "wassermelonensirup", "monin wassermelone"],
                "fr": ["sirop pastèque", "sirop de pastèque", "monin pastèque"],
                "en_uk": ["watermelon syrup", "monin watermelon syrup"],
                "en_us": ["watermelon syrup", "watermelon flavored syrup", "monin watermelon syrup"]
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
            "brix_source": "Monin Watermelon Syrup Product Specification (2020)"
        },
        {
            "name": "Mango Sirup",
            "brand": "Monin",
            "brix": 63.0,
            "volume_ml": None,
            "category": "sirup",
            "density_g_per_ml": 1.308,
            "ph": 3.3,
            "carbs_g_per_100ml": 83.1,
            "sugars_g_per_100ml": 82.7,
            "energy_kcal_per_100ml": 334,
            "juice_content_percent": 22,
            "mango_juice_percent": 22,
            "flavour_profile": "Ripe mango, tropical, sweet, slightly floral",
            "color": "deep golden / orange",
            "acidity_type": "citric acid",
            "acid_g_per_l": 6.7,
            "keywords": {
                "da": ["mango sirup", "mangosirup", "monin mango", "mango syrup"],
                "de": ["mango sirup", "mangosirup", "monin mango"],
                "fr": ["sirop mangue", "sirop de mangue", "monin mangue"],
                "en_uk": ["mango syrup", "mango flavour syrup", "monin mango syrup"],
                "en_us": ["mango syrup", "mango flavored syrup", "monin mango syrup"]
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
            "brix_source": "Monin Mango Syrup Product Specification (2020)"
        },
        {
            "name": "Passionsfrugt Sirup",
            "brand": "Monin",
            "brix": 63.4,
            "volume_ml": None,
            "category": "sirup",
            "density_g_per_ml": 1.309,
            "ph": 3.0,
            "carbs_g_per_100ml": 83.4,
            "sugars_g_per_100ml": 83.0,
            "energy_kcal_per_100ml": 335,
            "juice_content_percent": 35,
            "passionfruit_juice_percent": 35,
            "flavour_profile": "Intense passion fruit, tart, exotic, tropical sweet-sour",
            "color": "yellow-orange",
            "acidity_type": "citric acid",
            "acid_g_per_l": 7.1,
            "keywords": {
                "da": ["passionsfrugt sirup", "passionssirup", "monin passionsfrugt", "passion fruit sirup"],
                "de": ["passionsfrucht sirup", "maracuja sirup", "monin passionsfrucht"],
                "fr": ["sirop fruit de la passion", "monin passion"],
                "en_uk": ["passion fruit syrup", "passionfruit syrup", "monin passion fruit syrup"],
                "en_us": ["passion fruit syrup", "passionfruit flavored syrup", "monin passion fruit syrup"]
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
            "brix_source": "Monin Passion Fruit Syrup Product Specification (2020)"
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
