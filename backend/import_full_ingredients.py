#!/usr/bin/env python3
"""
Import complete ingredients dataset into MongoDB
"""

import asyncio
import os
import json
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load environment variables
load_dotenv(Path(__file__).parent / '.env')

async def import_ingredients():
    """Import all ingredients"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Connected to database: {db_name}")
    
    # Complete dataset
    ingredients = [
        {
            "name": "Vand",
            "brix": 0,
            "volume_ml": None,
            "category": "vand",
            "keywords": {
                "da": ["vand", "postevand"],
                "de": ["wasser"],
                "fr": ["eau"],
                "en_uk": ["water"],
                "en_us": ["water"]
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
        },
        {
            "name": "Sukkerlage (rig, ca. 65 Brix)",
            "brix": 65.0,
            "volume_ml": None,
            "category": "sirup",
            "keywords": {
                "da": ["sukkerlage", "sukkersirup", "rig sukkerlage"],
                "de": ["zuckersirup", "zuckerloesung"],
                "fr": ["sirop de sucre"],
                "en_uk": ["rich sugar syrup", "sugar syrup"],
                "en_us": ["rich simple syrup", "simple syrup"]
            },
            "country": ["DK", "DE", "FR", "EN_UK", "EN_US"],
            "alcohol_vol": None,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Marie Brizard Rørsukkersirup",
            "brix": 63.0,
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
            "alcohol_vol": None,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Monin Pure Cane Sugar Syrup",
            "brix": 65.1,
            "volume_ml": 1000,
            "category": "sirup",
            "keywords": {
                "da": ["sukkerlage", "canesugar", "monin sukker"],
                "de": ["monin zuckersirup", "zuckersirup"],
                "fr": ["monin sirop sucre de canne", "sirop sucre de canne"],
                "en_uk": ["monin pure cane", "sugar syrup"],
                "en_us": ["monin pure cane", "simple syrup"]
            },
            "country": ["DK", "DE", "FR", "EN_UK", "EN_US"],
            "alcohol_vol": None,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
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
            "brix": None,
            "volume_ml": None,
            "category": "sirup",
            "keywords": {
                "da": ["chokolade sirup"],
                "de": ["schokoladensirup"],
                "fr": ["sirop chocolat"],
                "en_uk": ["chocolate syrup"],
                "en_us": ["chocolate syrup"]
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
            "name": "Karamel Sirup",
            "brix": None,
            "volume_ml": None,
            "category": "sirup",
            "keywords": {
                "da": ["karamel sirup"],
                "de": ["karamellsirup"],
                "fr": ["sirop caramel"],
                "en_uk": ["caramel syrup"],
                "en_us": ["caramel syrup"]
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
            "name": "Coca-Cola",
            "brix": 10.0,
            "volume_ml": 330,
            "category": "sodavand",
            "keywords": {
                "da": ["coca-cola", "cola"],
                "de": ["coca-cola", "cola"],
                "fr": ["coca-cola", "cola"],
                "en_uk": ["coca-cola", "coke"],
                "en_us": ["coca-cola", "coke"]
            },
            "country": ["DK", "DE", "FR", "EN_UK", "EN_US"],
            "alcohol_vol": None,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Pepsi",
            "brix": 11.4,
            "volume_ml": 330,
            "category": "sodavand",
            "keywords": {
                "da": ["pepsi"],
                "de": ["pepsi"],
                "fr": ["pepsi"],
                "en_uk": ["pepsi"],
                "en_us": ["pepsi"]
            },
            "country": ["DK", "DE", "FR", "EN_UK", "EN_US"],
            "alcohol_vol": None,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "7-Up",
            "brix": 10.7,
            "volume_ml": 330,
            "category": "sodavand",
            "keywords": {
                "da": ["7-up", "lemon-lime sodavand"],
                "de": ["7-up"],
                "fr": ["7-up"],
                "en_uk": ["7-up"],
                "en_us": ["7-up"]
            },
            "country": ["DK", "DE", "FR", "EN_UK", "EN_US"],
            "alcohol_vol": None,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Fanta Orange",
            "brix": 9.2,
            "volume_ml": 330,
            "category": "sodavand",
            "keywords": {
                "da": ["fanta orange"],
                "de": ["fanta orange"],
                "fr": ["fanta orange"],
                "en_uk": ["fanta orange"],
                "en_us": ["fanta orange"]
            },
            "country": ["DK", "DE", "FR", "EN_UK", "EN_US"],
            "alcohol_vol": None,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Sprite",
            "brix": 10.0,
            "volume_ml": 330,
            "category": "sodavand",
            "keywords": {
                "da": ["sprite", "lemon-lime sodavand"],
                "de": ["sprite"],
                "fr": ["sprite"],
                "en_uk": ["sprite"],
                "en_us": ["sprite"]
            },
            "country": ["DK", "DE", "FR", "EN_UK", "EN_US"],
            "alcohol_vol": None,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Mirinda Orange",
            "brix": 12.9,
            "volume_ml": 330,
            "category": "sodavand",
            "keywords": {
                "da": ["mirinda", "mirinda orange"],
                "de": ["mirinda"],
                "fr": ["mirinda"],
                "en_uk": ["mirinda"],
                "en_us": ["mirinda"]
            },
            "country": ["DK", "DE", "FR", "EN_UK", "EN_US"],
            "alcohol_vol": None,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Mountain Dew",
            "brix": 11.9,
            "volume_ml": 330,
            "category": "sodavand",
            "keywords": {
                "da": ["mountain dew"],
                "de": ["mountain dew"],
                "fr": ["mountain dew"],
                "en_uk": ["mountain dew"],
                "en_us": ["mountain dew"]
            },
            "country": ["DK", "EN_US"],
            "alcohol_vol": None,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Appelsinjuice (single strength)",
            "brix": 11.8,
            "volume_ml": 1000,
            "category": "juice",
            "keywords": {
                "da": ["appelsinjuice", "orange juice"],
                "de": ["orangensaft"],
                "fr": ["jus d'orange"],
                "en_uk": ["orange juice"],
                "en_us": ["orange juice"]
            },
            "country": ["DK", "DE", "FR", "EN_UK", "EN_US"],
            "alcohol_vol": None,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Æblejuice (single strength)",
            "brix": 11.5,
            "volume_ml": 1000,
            "category": "juice",
            "keywords": {
                "da": ["æblejuice"],
                "de": ["apfelsaft"],
                "fr": ["jus de pomme"],
                "en_uk": ["apple juice"],
                "en_us": ["apple juice"]
            },
            "country": ["DK", "DE", "FR", "EN_UK", "EN_US"],
            "alcohol_vol": None,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Ananasjuice (single strength)",
            "brix": 12.8,
            "volume_ml": 1000,
            "category": "juice",
            "keywords": {
                "da": ["ananasjuice"],
                "de": ["ananas saft"],
                "fr": ["jus d'ananas"],
                "en_uk": ["pineapple juice"],
                "en_us": ["pineapple juice"]
            },
            "country": ["DK", "DE", "FR", "EN_UK", "EN_US"],
            "alcohol_vol": None,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Citronsaft (single strength)",
            "brix": 4.5,
            "volume_ml": 1000,
            "category": "juice",
            "keywords": {
                "da": ["citronsaft"],
                "de": ["zitronensaft"],
                "fr": ["jus de citron"],
                "en_uk": ["lemon juice"],
                "en_us": ["lemon juice"]
            },
            "country": ["DK", "DE", "FR", "EN_UK", "EN_US"],
            "alcohol_vol": None,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Limesaft (single strength)",
            "brix": 4.5,
            "volume_ml": 1000,
            "category": "juice",
            "keywords": {
                "da": ["limesaft"],
                "de": ["limettensaft"],
                "fr": ["jus de citron vert"],
                "en_uk": ["lime juice"],
                "en_us": ["lime juice"]
            },
            "country": ["DK", "DE", "FR", "EN_UK", "EN_US"],
            "alcohol_vol": None,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Druedjuice (single strength)",
            "brix": 16.0,
            "volume_ml": 1000,
            "category": "juice",
            "keywords": {
                "da": ["druedjuice"],
                "de": ["traubensaft"],
                "fr": ["jus de raisin"],
                "en_uk": ["grape juice"],
                "en_us": ["grape juice"]
            },
            "country": ["DK", "DE", "FR", "EN_UK", "EN_US"],
            "alcohol_vol": None,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Vodka 40%",
            "brix": 0,
            "volume_ml": 700,
            "category": "alkohol",
            "keywords": {
                "da": ["vodka", "vodka 40%"],
                "de": ["wodka"],
                "fr": ["vodka"],
                "en_uk": ["vodka"],
                "en_us": ["vodka"]
            },
            "country": ["DK", "DE", "FR", "EN_UK", "EN_US"],
            "alcohol_vol": 40.0,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Lys Rom 40%",
            "brix": 0,
            "volume_ml": 700,
            "category": "alkohol",
            "keywords": {
                "da": ["lys rom", "hvid rom"],
                "de": ["weisser rum"],
                "fr": ["rhum blanc"],
                "en_uk": ["white rum"],
                "en_us": ["white rum"]
            },
            "country": ["DK", "DE", "FR", "EN_UK", "EN_US"],
            "alcohol_vol": 40.0,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Mørk Rom 40%",
            "brix": 0,
            "volume_ml": 700,
            "category": "alkohol",
            "keywords": {
                "da": ["mørk rom"],
                "de": ["dunkler rum"],
                "fr": ["rhum brun"],
                "en_uk": ["dark rum"],
                "en_us": ["dark rum"]
            },
            "country": ["DK", "DE", "FR", "EN_UK", "EN_US"],
            "alcohol_vol": 40.0,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Gin 40%",
            "brix": 0,
            "volume_ml": 700,
            "category": "alkohol",
            "keywords": {
                "da": ["gin"],
                "de": ["gin"],
                "fr": ["gin"],
                "en_uk": ["gin"],
                "en_us": ["gin"]
            },
            "country": ["DK", "DE", "FR", "EN_UK", "EN_US"],
            "alcohol_vol": 40.0,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Tequila 38%",
            "brix": 0,
            "volume_ml": 700,
            "category": "alkohol",
            "keywords": {
                "da": ["tequila"],
                "de": ["tequila"],
                "fr": ["tequila"],
                "en_uk": ["tequila"],
                "en_us": ["tequila"]
            },
            "country": ["DK", "DE", "FR", "EN_UK", "EN_US"],
            "alcohol_vol": 38.0,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        },
        {
            "name": "Whisky 40%",
            "brix": 0,
            "volume_ml": 700,
            "category": "alkohol",
            "keywords": {
                "da": ["whisky"],
                "de": ["whisky"],
                "fr": ["whisky"],
                "en_uk": ["whisky"],
                "en_us": ["whiskey", "whisky"]
            },
            "country": ["DK", "DE", "FR", "EN_UK", "EN_US"],
            "alcohol_vol": 40.0,
            "links": {
                "DK": None,
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
        }
    ]
    
    # Clear old ingredients
    result = await db.ingredients.delete_many({})
    print(f"\n🗑️  Deleted {result.deleted_count} old ingredients")
    
    # Insert new ingredients
    result = await db.ingredients.insert_many(ingredients)
    print(f"\n✅ Successfully imported {len(result.inserted_ids)} ingredients!")
    
    # Show summary by category
    print("\n📊 Imported by category:")
    categories = {}
    for ing in ingredients:
        cat = ing['category']
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(ing['name'])
    
    for cat, items in sorted(categories.items()):
        print(f"\n{cat.upper()} ({len(items)} items):")
        for item in items[:5]:  # Show first 5
            brix = next(i['brix'] for i in ingredients if i['name'] == item)
            if brix is not None:
                print(f"  • {item} ({brix}°Bx)")
            else:
                print(f"  • {item} (Brix unknown)")
        if len(items) > 5:
            print(f"  ... and {len(items) - 5} more")
    
    # Total count
    total = await db.ingredients.count_documents({})
    print(f"\n📦 Total ingredients in database: {total}")
    
    client.close()

if __name__ == "__main__":
    print("=" * 60)
    print("SlushBook - Import Complete Ingredients Dataset")
    print("=" * 60)
    asyncio.run(import_ingredients())
