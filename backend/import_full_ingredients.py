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
            "brix": None,
            "volume_ml": 700,
            "category": "sirup",
            "keywords": {
                "da": ["blå curaçao sirup", "blue curacao sirup"],
                "de": ["blau curaçao sirup"],
                "fr": ["sirop curaçao bleu"],
                "en_uk": ["blue curacao syrup"],
                "en_us": ["blue curacao syrup"]
            },
            "country": ["DK"],
            "alcohol_vol": None,
            "links": {
                "DK": "https://barshopen.dk/da/barudstyr/mixers-og-sirup/monin-blue-curacao-70-cl/",
                "DE": None,
                "FR": None,
                "EN_UK": None,
                "EN_US": None
            }
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
            "brix": None,
            "volume_ml": None,
            "category": "sirup",
            "keywords": {
                "da": ["mynte sirup"],
                "de": ["minzsirup"],
                "fr": ["sirop menthe"],
                "en_uk": ["mint syrup"],
                "en_us": ["mint syrup"]
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
            "brix": None,
            "volume_ml": None,
            "category": "sirup",
            "keywords": {
                "da": ["hasselnød sirup"],
                "de": ["haselnusssirup"],
                "fr": ["sirop noisette"],
                "en_uk": ["hazelnut syrup"],
                "en_us": ["hazelnut syrup"]
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
            "name": "Pink Shake Sirup",
            "brix": None,
            "volume_ml": None,
            "category": "sirup",
            "keywords": {
                "da": ["pink shake", "pink grape sirup"],
                "de": ["pink grapefruit sirup"],
                "fr": ["sirop pamplemousse rose"],
                "en_uk": ["pink grapefruit syrup"],
                "en_us": ["pink grapefruit syrup"]
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
            "brix": None,
            "volume_ml": None,
            "category": "sirup",
            "keywords": {
                "da": ["vanilje sirup"],
                "de": ["vanillesirup"],
                "fr": ["sirop vanille"],
                "en_uk": ["vanilla syrup"],
                "en_us": ["vanilla syrup"]
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
