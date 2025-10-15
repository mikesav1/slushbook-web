from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class Ingredient(BaseModel):
    name: str
    category_key: str
    quantity: float
    unit: str
    role: str = "required"  # required, optional, garnish
    brix: Optional[float] = None

class Recipe(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    image_url: str = "/api/images/placeholder.jpg"
    base_volume_ml: int = 2700
    target_brix: float = 14.0
    alcohol_flag: bool = False
    color: str = "red"
    type: str = "klassisk"  # klassisk, juice, smoothie, sodavand, cocktail, kaffe, sport, sukkerfri, maelk
    tags: List[str] = []
    ingredients: List[Ingredient]
    steps: List[str]
    author: str = "system"
    author_name: str = "SLUSHBOOK"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    rating_avg: float = 0.0
    rating_count: int = 0
    view_count: int = 0

class RecipeCreate(BaseModel):
    name: str
    description: str
    image_url: Optional[str] = "/api/images/placeholder.jpg"
    base_volume_ml: int = 2700
    target_brix: float = 14.0
    alcohol_flag: bool = False
    color: str = "red"
    type: str = "klassisk"
    tags: List[str] = []
    ingredients: List[Ingredient]
    steps: List[str]
    session_id: str

class PantryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    ingredient_name: str
    category_key: str
    brand: Optional[str] = None
    quantity: float
    unit: str
    brix: Optional[float] = None
    expires_at: Optional[datetime] = None
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PantryItemCreate(BaseModel):
    session_id: str
    ingredient_name: str
    category_key: str
    brand: Optional[str] = None
    quantity: float
    unit: str
    brix: Optional[float] = None
    expires_at: Optional[datetime] = None

class Machine(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    name: str = "Min maskine"
    tank_volumes_ml: List[int] = [12000]
    loss_margin_pct: float = 5.0
    is_default: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MachineCreate(BaseModel):
    session_id: str
    name: str = "Min maskine"
    tank_volumes_ml: List[int] = [12000]
    loss_margin_pct: float = 5.0

class Favorite(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    recipe_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Rating(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    recipe_id: str
    stars: int
    comment: Optional[str] = None
    made_again: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RatingCreate(BaseModel):
    session_id: str
    recipe_id: str
    stars: int
    comment: Optional[str] = None
    made_again: bool = False

class ShoppingListItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    ingredient_name: str
    category_key: str
    quantity: float
    unit: str
    linked_recipe_id: Optional[str] = None
    linked_recipe_name: Optional[str] = None
    checked: bool = False
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ShoppingListItemCreate(BaseModel):
    session_id: str
    ingredient_name: str
    category_key: str
    quantity: float
    unit: str
    linked_recipe_id: Optional[str] = None
    linked_recipe_name: Optional[str] = None

class Brand(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    logo_url: Optional[str] = None
    website: str
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    brand_id: str
    name: str
    category_key: str  # Maps to ingredient category
    product_url: str
    price: Optional[float] = None
    size: Optional[str] = None
    image_url: Optional[str] = None
    active: bool = True
    click_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BrandCreate(BaseModel):
    name: str
    logo_url: Optional[str] = None
    website: str

class ProductCreate(BaseModel):
    brand_id: str
    name: str
    category_key: str
    product_url: str
    price: Optional[float] = None
    size: Optional[str] = None
    image_url: Optional[str] = None

class MatchRequest(BaseModel):
    session_id: str

class ScaleRequest(BaseModel):
    recipe_id: str
    target_volume_ml: int
    margin_pct: float = 5.0

class UserInitResponse(BaseModel):
    session_id: str
    user_recipes_count: int
    can_add_recipe: bool
    limit_message: str

# Seed initial recipes
async def seed_recipes():
    count = await db.recipes.count_documents({"author": "system"})
    if count > 0:
        return
    
    recipes_data = [
        {
            "name": "Jordbær Klassisk",
            "description": "En klassisk jordbær slushice perfekt til varme sommerdage",
            "image_url": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=600&fit=crop",
            "color": "red",
            "alcohol_flag": False,
            "target_brix": 14.0,
            "tags": ["børn", "frisk", "sød", "populær"],
            "ingredients": [
                {"name": "Jordbær sirup", "category_key": "sirup.baer.jordbaer", "quantity": 250, "unit": "ml", "role": "required", "brix": 65},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 700, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Citron saft", "category_key": "citrus.citron", "quantity": 50, "unit": "ml", "role": "optional", "brix": 10}
            ],
            "steps": ["Bland jordbær sirup og vand grundigt", "Tilføj citron saft for ekstra friskhed", "Justér mod 14°Bx hvis nødvendigt", "Fyld i maskinen og vent til slush-konsistens"]
        },
        {
            "name": "Blå Hawaii",
            "description": "Eksotisk blå slushice med tropisk smag",
            "image_url": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=600&fit=crop",
            "color": "blue",
            "alcohol_flag": False,
            "target_brix": 13.0,
            "tags": ["tropisk", "eksotisk", "børn"],
            "ingredients": [
                {"name": "Blå curaçao sirup", "category_key": "sirup.blue", "quantity": 200, "unit": "ml", "role": "required", "brix": 60},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 750, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Kokos sirup", "category_key": "sirup.kokos", "quantity": 50, "unit": "ml", "role": "optional", "brix": 65}
            ],
            "steps": ["Bland blå curaçao sirup med vand", "Tilsæt kokos sirup for tropisk twist", "Rør godt og fyld i maskinen"]
        },
        {
            "name": "Citron Frisk",
            "description": "Forfriskende citron slushice med mint",
            "image_url": "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=600&fit=crop",
            "color": "yellow",
            "alcohol_flag": False,
            "target_brix": 15.0,
            "tags": ["frisk", "sur", "sommer"],
            "ingredients": [
                {"name": "Citron sirup", "category_key": "sirup.citrus.citron", "quantity": 300, "unit": "ml", "role": "required", "brix": 65},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 650, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Mynte sirup", "category_key": "sirup.mynte", "quantity": 50, "unit": "ml", "role": "optional", "brix": 60}
            ],
            "steps": ["Bland citron sirup og vand", "Tilføj mynte for ekstra friskhed", "Fyld i maskinen"]
        },
        {
            "name": "Cola Original",
            "description": "Klassisk cola slushice - altid en favorit",
            "image_url": "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400&h=600&fit=crop",
            "color": "brown",
            "alcohol_flag": False,
            "target_brix": 16.0,
            "tags": ["klassisk", "populær", "børn"],
            "ingredients": [
                {"name": "Cola sirup", "category_key": "sirup.cola", "quantity": 350, "unit": "ml", "role": "required", "brix": 68},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 650, "unit": "ml", "role": "required", "brix": 0}
            ],
            "steps": ["Bland cola sirup og vand grundigt", "Fyld i maskinen og vent på den perfekte konsistens"]
        },
        {
            "name": "Appelsin Sol",
            "description": "Solrig appelsin slushice med vaniljesmag",
            "image_url": "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=600&fit=crop",
            "color": "orange",
            "alcohol_flag": False,
            "target_brix": 14.0,
            "tags": ["sød", "frugtig", "sommer"],
            "ingredients": [
                {"name": "Appelsin sirup", "category_key": "sirup.citrus.appelsin", "quantity": 280, "unit": "ml", "role": "required", "brix": 65},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 670, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Vanilje sirup", "category_key": "sirup.vanilje", "quantity": 50, "unit": "ml", "role": "optional", "brix": 60}
            ],
            "steps": ["Bland appelsin sirup, vand og vanilje", "Rør godt og fyld i maskinen"]
        },
        {
            "name": "Hindbær Drøm",
            "description": "Skøn hindbær slushice med lime",
            "image_url": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&h=600&fit=crop",
            "color": "pink",
            "alcohol_flag": False,
            "target_brix": 14.0,
            "tags": ["sød", "frisk", "sommerlig"],
            "ingredients": [
                {"name": "Hindbær sirup", "category_key": "sirup.baer.hindbaer", "quantity": 250, "unit": "ml", "role": "required", "brix": 65},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 700, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Lime saft", "category_key": "citrus.lime", "quantity": 50, "unit": "ml", "role": "optional", "brix": 10}
            ],
            "steps": ["Bland hindbær sirup med vand", "Tilføj lime for balance", "Fyld i maskinen"]
        },
        {
            "name": "Grøn Æble",
            "description": "Frisk grøn æble slushice",
            "image_url": "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=600&fit=crop",
            "color": "green",
            "alcohol_flag": False,
            "target_brix": 14.0,
            "tags": ["frisk", "sur", "æble"],
            "ingredients": [
                {"name": "Grøn æble sirup", "category_key": "sirup.aeble", "quantity": 270, "unit": "ml", "role": "required", "brix": 65},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 680, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Citron saft", "category_key": "citrus.citron", "quantity": 50, "unit": "ml", "role": "optional", "brix": 10}
            ],
            "steps": ["Bland grøn æble sirup og vand", "Tilføj citron for ekstra syre", "Fyld i maskinen"]
        },
        {
            "name": "Fersken Sommer",
            "description": "Dejlig fersken slushice med ingefær",
            "image_url": "https://images.unsplash.com/photo-1629828874514-d4b56b1d8e46?w=400&h=600&fit=crop",
            "color": "orange",
            "alcohol_flag": False,
            "target_brix": 13.0,
            "tags": ["fruity", "sommer", "sød"],
            "ingredients": [
                {"name": "Fersken sirup", "category_key": "sirup.fersken", "quantity": 260, "unit": "ml", "role": "required", "brix": 65},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 690, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Ginger Ale", "category_key": "sodavand.ginger", "quantity": 50, "unit": "ml", "role": "optional", "brix": 10}
            ],
            "steps": ["Bland fersken sirup og vand", "Tilføj Ginger Ale for krydderi", "Fyld i maskinen"]
        },
        {
            "name": "Tropisk Paradise",
            "description": "Eksotisk blanding af mango og passionsfrugt",
            "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=600&fit=crop",
            "color": "yellow",
            "alcohol_flag": False,
            "target_brix": 14.0,
            "tags": ["tropisk", "eksotisk", "frugtig"],
            "ingredients": [
                {"name": "Mango sirup", "category_key": "sirup.mango", "quantity": 200, "unit": "ml", "role": "required", "brix": 65},
                {"name": "Passionsfrugt sirup", "category_key": "sirup.passion", "quantity": 150, "unit": "ml", "role": "required", "brix": 65},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 600, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Lime saft", "category_key": "citrus.lime", "quantity": 50, "unit": "ml", "role": "optional", "brix": 10}
            ],
            "steps": ["Bland mango og passionsfrugt sirup", "Tilføj vand og lime", "Fyld i maskinen"]
        },
        {
            "name": "Kirsebær Luksus",
            "description": "Lækker kirsebær slushice med mandel",
            "image_url": "https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400&h=600&fit=crop",
            "color": "red",
            "alcohol_flag": False,
            "target_brix": 15.0,
            "tags": ["sød", "luksus", "kirsebær"],
            "ingredients": [
                {"name": "Kirsebær sirup", "category_key": "sirup.kirsebaer", "quantity": 280, "unit": "ml", "role": "required", "brix": 65},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 670, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Mandel sirup", "category_key": "sirup.mandel", "quantity": 50, "unit": "ml", "role": "optional", "brix": 60}
            ],
            "steps": ["Bland kirsebær sirup og vand", "Tilføj mandel sirup", "Fyld i maskinen"]
        },
        {
            "name": "Vandmelon Splash",
            "description": "Forfriskende vandmelon slushice med mynte",
            "image_url": "https://images.unsplash.com/photo-1587049352846-4a222e784099?w=400&h=600&fit=crop",
            "color": "pink",
            "alcohol_flag": False,
            "target_brix": 13.0,
            "tags": ["frisk", "sommer", "let"],
            "ingredients": [
                {"name": "Vandmelon sirup", "category_key": "sirup.vandmelon", "quantity": 300, "unit": "ml", "role": "required", "brix": 60},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 650, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Mynte sirup", "category_key": "sirup.mynte", "quantity": 50, "unit": "ml", "role": "optional", "brix": 60}
            ],
            "steps": ["Bland vandmelon sirup med vand", "Tilføj mynte for friskhed", "Fyld i maskinen"]
        },
        {
            "name": "Ananas Tropical",
            "description": "Sød ananas slushice med kokos",
            "image_url": "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&h=600&fit=crop",
            "color": "yellow",
            "alcohol_flag": False,
            "target_brix": 14.0,
            "tags": ["tropisk", "sød", "ananas"],
            "ingredients": [
                {"name": "Ananas sirup", "category_key": "sirup.ananas", "quantity": 270, "unit": "ml", "role": "required", "brix": 65},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 680, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Kokos sirup", "category_key": "sirup.kokos", "quantity": 50, "unit": "ml", "role": "optional", "brix": 65}
            ],
            "steps": ["Bland ananas sirup og vand", "Tilføj kokos", "Fyld i maskinen"]
        },
        {
            "name": "Blåbær Vild",
            "description": "Intens blåbær slushice",
            "image_url": "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400&h=600&fit=crop",
            "color": "purple",
            "alcohol_flag": False,
            "target_brix": 14.0,
            "tags": ["bær", "intens", "sød"],
            "ingredients": [
                {"name": "Blåbær sirup", "category_key": "sirup.baer.blabaer", "quantity": 250, "unit": "ml", "role": "required", "brix": 65},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 700, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Citron saft", "category_key": "citrus.citron", "quantity": 50, "unit": "ml", "role": "optional", "brix": 10}
            ],
            "steps": ["Bland blåbær sirup og vand", "Tilføj citron", "Fyld i maskinen"]
        },
        {
            "name": "Solbær Intense",
            "description": "Kraftig solbær slushice med ingefær",
            "image_url": "https://images.unsplash.com/photo-1464454709131-ffd692591ee5?w=400&h=600&fit=crop",
            "color": "purple",
            "alcohol_flag": False,
            "target_brix": 15.0,
            "tags": ["intens", "bær", "kraftig"],
            "ingredients": [
                {"name": "Solbær sirup", "category_key": "sirup.baer.solbaer", "quantity": 280, "unit": "ml", "role": "required", "brix": 65},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 670, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Ingefær sirup", "category_key": "sirup.ingefaer", "quantity": 50, "unit": "ml", "role": "optional", "brix": 60}
            ],
            "steps": ["Bland solbær sirup og vand", "Tilføj ingefær", "Fyld i maskinen"]
        },
        {
            "name": "Lime Cool",
            "description": "Super frisk lime slushice med mynte",
            "image_url": "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=400&h=600&fit=crop",
            "color": "green",
            "alcohol_flag": False,
            "target_brix": 15.0,
            "tags": ["frisk", "sur", "mynte"],
            "ingredients": [
                {"name": "Lime sirup", "category_key": "sirup.citrus.lime", "quantity": 300, "unit": "ml", "role": "required", "brix": 65},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 650, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Mynte sirup", "category_key": "sirup.mynte", "quantity": 50, "unit": "ml", "role": "optional", "brix": 60}
            ],
            "steps": ["Bland lime sirup og vand", "Tilføj mynte", "Fyld i maskinen"]
        },
        {
            "name": "Mojito Slush (18+)",
            "description": "Klassisk mojito som frozen slushice",
            "image_url": "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=600&fit=crop",
            "color": "green",
            "alcohol_flag": True,
            "target_brix": 12.0,
            "tags": ["alkohol", "mojito", "mynte", "voksen"],
            "ingredients": [
                {"name": "Lime sirup", "category_key": "sirup.citrus.lime", "quantity": 200, "unit": "ml", "role": "required", "brix": 65},
                {"name": "Hvid rom", "category_key": "alkohol.rom", "quantity": 100, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 650, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Mynte sirup", "category_key": "sirup.mynte", "quantity": 50, "unit": "ml", "role": "required", "brix": 60}
            ],
            "steps": ["Bland lime sirup, rom og vand", "Tilføj mynte sirup", "Fyld i maskinen - bemærk lavere frysepunkt pga. alkohol"]
        },
        {
            "name": "Margarita Ice (18+)",
            "description": "Frozen margarita slushice",
            "image_url": "https://images.unsplash.com/photo-1618890111938-16d077babb67?w=400&h=600&fit=crop",
            "color": "yellow",
            "alcohol_flag": True,
            "target_brix": 12.0,
            "tags": ["alkohol", "margarita", "mexicansk", "voksen"],
            "ingredients": [
                {"name": "Lime sirup", "category_key": "sirup.citrus.lime", "quantity": 200, "unit": "ml", "role": "required", "brix": 65},
                {"name": "Tequila", "category_key": "alkohol.tequila", "quantity": 100, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 650, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Triple sec", "category_key": "alkohol.triplesec", "quantity": 50, "unit": "ml", "role": "optional", "brix": 30}
            ],
            "steps": ["Bland lime sirup, tequila og vand", "Tilføj triple sec", "Server med salt på kanten"]
        },
        {
            "name": "Piña Colada Slush (18+)",
            "description": "Tropisk piña colada som slushice",
            "image_url": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=600&fit=crop",
            "color": "yellow",
            "alcohol_flag": True,
            "target_brix": 13.0,
            "tags": ["alkohol", "tropisk", "kokos", "voksen"],
            "ingredients": [
                {"name": "Kokos creme", "category_key": "sirup.kokos", "quantity": 250, "unit": "ml", "role": "required", "brix": 60},
                {"name": "Hvid rom", "category_key": "alkohol.rom", "quantity": 100, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Ananas juice", "category_key": "juice.ananas", "quantity": 600, "unit": "ml", "role": "required", "brix": 12},
                {"name": "Fløde", "category_key": "mejeriprodukter.floede", "quantity": 50, "unit": "ml", "role": "optional", "brix": 5}
            ],
            "steps": ["Bland kokos creme, rom og ananas juice", "Tilføj fløde for ekstra creminess", "Fyld i maskinen"]
        },
        {
            "name": "Strawberry Daiquiri (18+)",
            "description": "Klassisk strawberry daiquiri frozen",
            "image_url": "https://images.unsplash.com/photo-1597306687537-a252f6f71f49?w=400&h=600&fit=crop",
            "color": "red",
            "alcohol_flag": True,
            "target_brix": 12.0,
            "tags": ["alkohol", "jordbær", "klassisk", "voksen"],
            "ingredients": [
                {"name": "Jordbær sirup", "category_key": "sirup.baer.jordbaer", "quantity": 250, "unit": "ml", "role": "required", "brix": 65},
                {"name": "Hvid rom", "category_key": "alkohol.rom", "quantity": 100, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 600, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Lime saft", "category_key": "citrus.lime", "quantity": 50, "unit": "ml", "role": "optional", "brix": 10}
            ],
            "steps": ["Bland jordbær sirup, rom og vand", "Tilføj lime", "Fyld i maskinen"]
        },
        {
            "name": "Blue Lagoon Frozen (18+)",
            "description": "Blå lagune som frozen drink",
            "image_url": "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=400&h=600&fit=crop",
            "color": "blue",
            "alcohol_flag": True,
            "target_brix": 12.0,
            "tags": ["alkohol", "blå", "vodka", "voksen"],
            "ingredients": [
                {"name": "Blå curaçao sirup", "category_key": "sirup.blue", "quantity": 200, "unit": "ml", "role": "required", "brix": 60},
                {"name": "Vodka", "category_key": "alkohol.vodka", "quantity": 100, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Lemonade", "category_key": "sodavand.lemon", "quantity": 650, "unit": "ml", "role": "required", "brix": 10},
                {"name": "Lime saft", "category_key": "citrus.lime", "quantity": 50, "unit": "ml", "role": "optional", "brix": 10}
            ],
            "steps": ["Bland blå curaçao, vodka og lemonade", "Tilføj lime", "Fyld i maskinen"]
        },
        {
            "name": "Sex on the Beach Slush (18+)",
            "description": "Populær cocktail som slushice",
            "image_url": "https://images.unsplash.com/photo-1609951651556-5334e2706168?w=400&h=600&fit=crop",
            "color": "orange",
            "alcohol_flag": True,
            "target_brix": 12.0,
            "tags": ["alkohol", "cocktail", "frugtig", "voksen"],
            "ingredients": [
                {"name": "Tranebær saft", "category_key": "juice.tranebaer", "quantity": 200, "unit": "ml", "role": "required", "brix": 12},
                {"name": "Appelsin juice", "category_key": "juice.appelsin", "quantity": 150, "unit": "ml", "role": "required", "brix": 12},
                {"name": "Vodka", "category_key": "alkohol.vodka", "quantity": 100, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Peach Schnapps", "category_key": "alkohol.schnapps", "quantity": 50, "unit": "ml", "role": "required", "brix": 30},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 500, "unit": "ml", "role": "required", "brix": 0}
            ],
            "steps": ["Bland alle juicer og alkohol", "Tilføj vand", "Fyld i maskinen"]
        },
        {
            "name": "Aperol Spritz Frozen (18+)",
            "description": "Italiensk favorit som slushice",
            "image_url": "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=400&h=600&fit=crop",
            "color": "orange",
            "alcohol_flag": True,
            "target_brix": 11.0,
            "tags": ["alkohol", "italiensk", "aperol", "voksen"],
            "ingredients": [
                {"name": "Aperol", "category_key": "alkohol.aperol", "quantity": 250, "unit": "ml", "role": "required", "brix": 25},
                {"name": "Prosecco", "category_key": "alkohol.prosecco", "quantity": 150, "unit": "ml", "role": "required", "brix": 5},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 550, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Danskvand", "category_key": "sodavand.danskvand", "quantity": 50, "unit": "ml", "role": "optional", "brix": 0}
            ],
            "steps": ["Bland Aperol, prosecco og vand", "Tilføj danskvand", "Fyld i maskinen"]
        },
        {
            "name": "Frozen Bellini (18+)",
            "description": "Elegant fersken prosecco slushice",
            "image_url": "https://images.unsplash.com/photo-1587223075055-82e9a937ddff?w=400&h=600&fit=crop",
            "color": "orange",
            "alcohol_flag": True,
            "target_brix": 12.0,
            "tags": ["alkohol", "elegant", "fersken", "voksen"],
            "ingredients": [
                {"name": "Fersken puré", "category_key": "sirup.fersken", "quantity": 250, "unit": "ml", "role": "required", "brix": 60},
                {"name": "Prosecco", "category_key": "alkohol.prosecco", "quantity": 150, "unit": "ml", "role": "required", "brix": 5},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 550, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Sukker sirup", "category_key": "sirup.sukker", "quantity": 50, "unit": "ml", "role": "optional", "brix": 70}
            ],
            "steps": ["Bland fersken puré, prosecco og vand", "Justér sødme med sukker sirup", "Fyld i maskinen"]
        },
        {
            "name": "Cosmopolitan Slush (18+)",
            "description": "Trendy cosmopolitan som frozen drink",
            "image_url": "https://images.unsplash.com/photo-1514361892635-6b07e31e75f9?w=400&h=600&fit=crop",
            "color": "pink",
            "alcohol_flag": True,
            "target_brix": 11.0,
            "tags": ["alkohol", "trendy", "elegant", "voksen"],
            "ingredients": [
                {"name": "Tranebær juice", "category_key": "juice.tranebaer", "quantity": 200, "unit": "ml", "role": "required", "brix": 12},
                {"name": "Vodka", "category_key": "alkohol.vodka", "quantity": 100, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Triple sec", "category_key": "alkohol.triplesec", "quantity": 50, "unit": "ml", "role": "required", "brix": 30},
                {"name": "Lime saft", "category_key": "citrus.lime", "quantity": 50, "unit": "ml", "role": "required", "brix": 10},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 600, "unit": "ml", "role": "required", "brix": 0}
            ],
            "steps": ["Bland tranebær juice, vodka, triple sec og lime", "Tilføj vand", "Fyld i maskinen"]
        },
        {
            "name": "Long Island Iced Tea Frozen (18+)",
            "description": "Stærk klassiker som slushice",
            "image_url": "https://images.unsplash.com/photo-1544145945-35c4e5f2b6cb?w=400&h=600&fit=crop",
            "color": "brown",
            "alcohol_flag": True,
            "target_brix": 11.0,
            "tags": ["alkohol", "stærk", "cocktail", "voksen"],
            "ingredients": [
                {"name": "Vodka", "category_key": "alkohol.vodka", "quantity": 50, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Hvid rom", "category_key": "alkohol.rom", "quantity": 50, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Gin", "category_key": "alkohol.gin", "quantity": 50, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Tequila", "category_key": "alkohol.tequila", "quantity": 50, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Cola sirup", "category_key": "sirup.cola", "quantity": 100, "unit": "ml", "role": "required", "brix": 68},
                {"name": "Vand/knust is", "category_key": "base.vand", "quantity": 650, "unit": "ml", "role": "required", "brix": 0},
                {"name": "Lime saft", "category_key": "citrus.lime", "quantity": 50, "unit": "ml", "role": "optional", "brix": 10}
            ],
            "steps": ["Bland alle alkohol typer", "Tilføj cola sirup og vand", "Afslut med lime", "Fyld i maskinen - meget stærk!"]
        }
    ]
    
    for recipe_data in recipes_data:
        recipe = Recipe(
            **recipe_data,
            base_volume_ml=1000,
            author="system",
            author_name="SLUSHBOOK"
        )
        doc = recipe.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.recipes.insert_one(doc)
    
    logger.info(f"Seeded {len(recipes_data)} recipes")

# Helper functions
def calculate_match_score(recipe: Dict, pantry_items: List[Dict]) -> Dict:
    score = 0
    missing = []
    have = []
    
    pantry_categories = {item['category_key'] for item in pantry_items}
    pantry_names = {item['ingredient_name'].lower() for item in pantry_items}
    
    for ingredient in recipe['ingredients']:
        if ingredient['role'] == 'garnish':
            continue
        
        matched = (
            ingredient['name'].lower() in pantry_names or
            ingredient['category_key'] in pantry_categories
        )
        
        if matched:
            if ingredient['role'] == 'required':
                score += 2
                have.append(ingredient['name'])
            else:
                score += 1
                have.append(ingredient['name'])
        else:
            if ingredient['role'] == 'required':
                score -= 2
                missing.append(ingredient['name'])
    
    total_required = len([i for i in recipe['ingredients'] if i['role'] == 'required'])
    matched_required = len([i for i in have if any(ing['name'] == i and ing['role'] == 'required' for ing in recipe['ingredients'])])
    match_pct = (matched_required / total_required * 100) if total_required > 0 else 0
    
    return {
        'score': score,
        'match_pct': round(match_pct, 1),
        'have': have,
        'missing': missing,
        'can_make_now': len(missing) == 0 and score > 0,
        'almost': len(missing) <= 2 and len(missing) > 0
    }

def scale_recipe(recipe: Dict, target_volume_ml: int, margin_pct: float = 5.0) -> Dict:
    base_volume = recipe['base_volume_ml']
    scale_factor = (target_volume_ml * (1 + margin_pct/100)) / base_volume
    
    scaled_ingredients = []
    total_brix_weighted = 0
    total_volume = 0
    
    for ingredient in recipe['ingredients']:
        scaled_qty = ingredient['quantity'] * scale_factor
        scaled_ingredients.append({
            'name': ingredient['name'],
            'quantity': round(scaled_qty, 1),
            'unit': ingredient['unit'],
            'role': ingredient['role']
        })
        
        if ingredient.get('brix') is not None:
            total_brix_weighted += scaled_qty * ingredient['brix']
            total_volume += scaled_qty
    
    resulting_brix = total_brix_weighted / total_volume if total_volume > 0 else 0
    brix_diff = resulting_brix - recipe['target_brix']
    adjustment = ''
    
    if abs(brix_diff) > 1:
        if brix_diff > 0:
            adjustment = f"Tilføj {abs(int(brix_diff * 10))}ml ekstra vand for at nå {recipe['target_brix']}°Bx"
        else:
            adjustment = f"Tilføj {abs(int(brix_diff * 10))}ml ekstra sirup for at nå {recipe['target_brix']}°Bx"
    
    return {
        'scaled_ingredients': scaled_ingredients,
        'target_volume_ml': target_volume_ml,
        'scale_factor': round(scale_factor, 2),
        'resulting_brix': round(resulting_brix, 1),
        'target_brix': recipe['target_brix'],
        'brix_adjustment': adjustment
    }

# Routes
@api_router.get("/")
async def root():
    return {"message": "SLUSHBOOK API"}

# User initialization
@api_router.post("/user/init", response_model=UserInitResponse)
async def init_user():
    session_id = str(uuid.uuid4())
    return UserInitResponse(
        session_id=session_id,
        user_recipes_count=0,
        can_add_recipe=True,
        limit_message="Gratis: Maks 2 egne opskrifter. Opgradér til Pro for ubegrænset!"
    )

@api_router.get("/user/{session_id}/limits")
async def get_user_limits(session_id: str):
    count = await db.user_recipes.count_documents({"session_id": session_id})
    can_add = count < 2
    return {
        "user_recipes_count": count,
        "can_add_recipe": can_add,
        "limit_message": "Gratis: Maks 2 egne opskrifter. Opgradér til Pro for ubegrænset!" if not can_add else f"Du kan tilføje {2 - count} mere opskrift(er)"
    }

# Recipes
@api_router.get("/recipes")
async def get_recipes(
    alcohol: str = "both",
    color: Optional[str] = None,
    search: Optional[str] = None,
    session_id: Optional[str] = None
):
    query = {}
    
    if alcohol == "none":
        query["alcohol_flag"] = False
    elif alcohol == "only":
        query["alcohol_flag"] = True
    
    if color:
        query["color"] = color
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    # Get system recipes
    system_recipes = await db.recipes.find({**query, "author": "system"}, {"_id": 0}).to_list(1000)
    
    # Get user recipes if session_id provided
    user_recipes = []
    if session_id:
        user_query = {**query, "session_id": session_id}
        user_recipes = await db.user_recipes.find(user_query, {"_id": 0}).to_list(1000)
    
    all_recipes = system_recipes + user_recipes
    
    # Parse datetime
    for recipe in all_recipes:
        if isinstance(recipe.get('created_at'), str):
            recipe['created_at'] = datetime.fromisoformat(recipe['created_at'])
    
    # Add favorite and rating info
    if session_id:
        favorites = await db.favorites.find({"session_id": session_id}, {"_id": 0}).to_list(1000)
        favorite_ids = {fav['recipe_id'] for fav in favorites}
        
        for recipe in all_recipes:
            recipe['is_favorite'] = recipe['id'] in favorite_ids
            
            # Get user rating
            rating = await db.ratings.find_one(
                {"session_id": session_id, "recipe_id": recipe['id']},
                {"_id": 0}
            )
            recipe['user_rating'] = rating.get('stars') if rating else None
    
    return all_recipes

@api_router.get("/recipes/{recipe_id}")
async def get_recipe(recipe_id: str, session_id: Optional[str] = None):
    # Try system recipes first
    recipe = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    
    # Try user recipes
    if not recipe and session_id:
        recipe = await db.user_recipes.find_one(
            {"id": recipe_id, "session_id": session_id},
            {"_id": 0}
        )
    
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    # Parse datetime
    if isinstance(recipe.get('created_at'), str):
        recipe['created_at'] = datetime.fromisoformat(recipe['created_at'])
    
    # Add favorite and rating info
    if session_id:
        favorite = await db.favorites.find_one(
            {"session_id": session_id, "recipe_id": recipe_id}
        )
        recipe['is_favorite'] = favorite is not None
        
        rating = await db.ratings.find_one(
            {"session_id": session_id, "recipe_id": recipe_id},
            {"_id": 0}
        )
        recipe['user_rating'] = rating.get('stars') if rating else None
    
    # Increment view count
    await db.recipes.update_one(
        {"id": recipe_id},
        {"$inc": {"view_count": 1}}
    )
    
    return recipe

@api_router.post("/recipes", response_model=Recipe)
async def create_recipe(recipe_data: RecipeCreate):
    # Check user limit
    count = await db.user_recipes.count_documents({"session_id": recipe_data.session_id})
    if count >= 2:
        raise HTTPException(
            status_code=403,
            detail="Gratis limit nået! Maks 2 egne opskrifter. Opgradér til Pro for ubegrænset adgang."
        )
    
    recipe_dict = recipe_data.model_dump()
    session_id = recipe_dict.pop('session_id')
    
    recipe = Recipe(
        **recipe_dict,
        author=session_id,
        author_name="Mig"
    )
    
    doc = recipe.model_dump()
    doc['session_id'] = session_id
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.user_recipes.insert_one(doc)
    return recipe

@api_router.put("/recipes/{recipe_id}", response_model=Recipe)
async def update_recipe(recipe_id: str, recipe_data: RecipeCreate):
    # Check ownership
    existing = await db.user_recipes.find_one(
        {"id": recipe_id, "session_id": recipe_data.session_id}
    )
    
    if not existing:
        raise HTTPException(status_code=404, detail="Recipe not found or not owned by you")
    
    recipe_dict = recipe_data.model_dump()
    session_id = recipe_dict.pop('session_id')
    
    recipe = Recipe(
        **recipe_dict,
        id=recipe_id,
        author=session_id,
        author_name="Mig",
        created_at=datetime.fromisoformat(existing['created_at']) if isinstance(existing['created_at'], str) else existing['created_at']
    )
    
    doc = recipe.model_dump()
    doc['session_id'] = session_id
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.user_recipes.replace_one(
        {"id": recipe_id},
        doc
    )
    
    return recipe

@api_router.delete("/recipes/{recipe_id}")
async def delete_recipe(recipe_id: str, session_id: str):
    result = await db.user_recipes.delete_one(
        {"id": recipe_id, "session_id": session_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recipe not found or not owned by you")
    
    return {"message": "Recipe deleted"}

# Pantry
@api_router.get("/pantry/{session_id}")
async def get_pantry(session_id: str):
    items = await db.user_pantry.find({"session_id": session_id}, {"_id": 0}).to_list(1000)
    
    for item in items:
        if isinstance(item.get('added_at'), str):
            item['added_at'] = datetime.fromisoformat(item['added_at'])
        if isinstance(item.get('expires_at'), str):
            item['expires_at'] = datetime.fromisoformat(item['expires_at'])
    
    return items

@api_router.post("/pantry", response_model=PantryItem)
async def add_pantry_item(item_data: PantryItemCreate):
    # Check if exists, update if so
    existing = await db.user_pantry.find_one({
        "session_id": item_data.session_id,
        "ingredient_name": item_data.ingredient_name
    })
    
    if existing:
        await db.user_pantry.update_one(
            {"id": existing['id']},
            {"$set": {
                "quantity": item_data.quantity,
                "unit": item_data.unit,
                "brand": item_data.brand,
                "brix": item_data.brix
            }}
        )
        item = PantryItem(**{**existing, **item_data.model_dump()})
    else:
        item = PantryItem(**item_data.model_dump())
        doc = item.model_dump()
        doc['added_at'] = doc['added_at'].isoformat()
        if doc.get('expires_at'):
            doc['expires_at'] = doc['expires_at'].isoformat()
        await db.user_pantry.insert_one(doc)
    
    return item

@api_router.delete("/pantry/{session_id}/{ingredient_name}")
async def delete_pantry_item(session_id: str, ingredient_name: str):
    result = await db.user_pantry.delete_one({
        "session_id": session_id,
        "ingredient_name": ingredient_name
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    return {"message": "Ingredient removed from pantry"}

# Matching
@api_router.post("/match")
async def match_recipes(request: MatchRequest):
    # Get user pantry
    pantry_items = await db.user_pantry.find(
        {"session_id": request.session_id},
        {"_id": 0}
    ).to_list(1000)
    
    if not pantry_items:
        return {"message": "Tilføj ingredienser til dit pantry først!", "matches": []}
    
    # Get all recipes
    recipes = await db.recipes.find({"author": "system"}, {"_id": 0}).to_list(1000)
    user_recipes = await db.user_recipes.find(
        {"session_id": request.session_id},
        {"_id": 0}
    ).to_list(1000)
    
    all_recipes = recipes + user_recipes
    
    # Calculate matches
    matches = []
    for recipe in all_recipes:
        match_result = calculate_match_score(recipe, pantry_items)
        matches.append({
            "recipe": recipe,
            "match": match_result
        })
    
    # Sort by score
    matches.sort(key=lambda x: x['match']['score'], reverse=True)
    
    # Categorize
    can_make = [m for m in matches if m['match']['can_make_now']]
    almost = [m for m in matches if m['match']['almost']]
    need_more = [m for m in matches if not m['match']['can_make_now'] and not m['match']['almost']]
    
    return {
        "can_make_now": can_make[:10],
        "almost": almost[:10],
        "need_more": need_more[:10],
        "total_matches": len(matches)
    }

# Scaling
@api_router.post("/scale")
async def scale_recipe_endpoint(request: ScaleRequest):
    # Get recipe
    recipe = await db.recipes.find_one({"id": request.recipe_id}, {"_id": 0})
    
    if not recipe:
        recipe = await db.user_recipes.find_one({"id": request.recipe_id}, {"_id": 0})
    
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    scaled = scale_recipe(recipe, request.target_volume_ml, request.margin_pct)
    return scaled

# Machines
@api_router.get("/machines/{session_id}")
async def get_machines(session_id: str):
    machines = await db.machines.find({"session_id": session_id}, {"_id": 0}).to_list(100)
    
    for machine in machines:
        if isinstance(machine.get('created_at'), str):
            machine['created_at'] = datetime.fromisoformat(machine['created_at'])
    
    return machines

@api_router.post("/machines", response_model=Machine)
async def create_machine(machine_data: MachineCreate):
    # Set all existing machines to not default
    await db.machines.update_many(
        {"session_id": machine_data.session_id},
        {"$set": {"is_default": False}}
    )
    
    machine = Machine(**machine_data.model_dump())
    doc = machine.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.machines.insert_one(doc)
    return machine

@api_router.put("/machines/{machine_id}")
async def update_machine(machine_id: str, machine_data: MachineCreate):
    result = await db.machines.update_one(
        {"id": machine_id, "session_id": machine_data.session_id},
        {"$set": machine_data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    return {"message": "Machine updated"}

# Favorites
@api_router.get("/favorites/{session_id}")
async def get_favorites(session_id: str):
    favorites = await db.favorites.find({"session_id": session_id}, {"_id": 0}).to_list(1000)
    
    # Get full recipe details
    recipe_ids = [fav['recipe_id'] for fav in favorites]
    recipes = await db.recipes.find({"id": {"$in": recipe_ids}}, {"_id": 0}).to_list(1000)
    user_recipes = await db.user_recipes.find(
        {"id": {"$in": recipe_ids}, "session_id": session_id},
        {"_id": 0}
    ).to_list(1000)
    
    all_recipes = recipes + user_recipes
    
    for recipe in all_recipes:
        if isinstance(recipe.get('created_at'), str):
            recipe['created_at'] = datetime.fromisoformat(recipe['created_at'])
        recipe['is_favorite'] = True
    
    return all_recipes

@api_router.post("/favorites")
async def add_favorite(session_id: str, recipe_id: str):
    # Check if already exists
    existing = await db.favorites.find_one({
        "session_id": session_id,
        "recipe_id": recipe_id
    })
    
    if existing:
        return {"message": "Already in favorites"}
    
    favorite = Favorite(session_id=session_id, recipe_id=recipe_id)
    doc = favorite.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.favorites.insert_one(doc)
    return {"message": "Added to favorites"}

@api_router.delete("/favorites/{session_id}/{recipe_id}")
async def remove_favorite(session_id: str, recipe_id: str):
    result = await db.favorites.delete_one({
        "session_id": session_id,
        "recipe_id": recipe_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    return {"message": "Removed from favorites"}

# Ratings
@api_router.get("/ratings/{session_id}/{recipe_id}")
async def get_rating(session_id: str, recipe_id: str):
    rating = await db.ratings.find_one(
        {"session_id": session_id, "recipe_id": recipe_id},
        {"_id": 0}
    )
    
    if not rating:
        return None
    
    if isinstance(rating.get('created_at'), str):
        rating['created_at'] = datetime.fromisoformat(rating['created_at'])
    
    return rating

@api_router.post("/ratings", response_model=Rating)
async def create_rating(rating_data: RatingCreate):
    # Check if exists, update if so
    existing = await db.ratings.find_one({
        "session_id": rating_data.session_id,
        "recipe_id": rating_data.recipe_id
    })
    
    if existing:
        await db.ratings.update_one(
            {"id": existing['id']},
            {"$set": rating_data.model_dump()}
        )
        rating = Rating(**{**existing, **rating_data.model_dump()})
    else:
        rating = Rating(**rating_data.model_dump())
        doc = rating.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.ratings.insert_one(doc)
    
    # Update recipe rating average
    all_ratings = await db.ratings.find({"recipe_id": rating_data.recipe_id}).to_list(1000)
    if all_ratings:
        avg = sum(r['stars'] for r in all_ratings) / len(all_ratings)
        await db.recipes.update_one(
            {"id": rating_data.recipe_id},
            {"$set": {"rating_avg": round(avg, 1), "rating_count": len(all_ratings)}}
        )
    
    return rating

# Shopping List
@api_router.get("/shopping-list/{session_id}")
async def get_shopping_list(session_id: str):
    items = await db.shopping_list.find({"session_id": session_id}, {"_id": 0}).to_list(1000)
    
    for item in items:
        if isinstance(item.get('added_at'), str):
            item['added_at'] = datetime.fromisoformat(item['added_at'])
    
    return items

@api_router.post("/shopping-list", response_model=ShoppingListItem)
async def add_shopping_list_item(item_data: ShoppingListItemCreate):
    # Check if exists
    existing = await db.shopping_list.find_one({
        "session_id": item_data.session_id,
        "ingredient_name": item_data.ingredient_name
    })
    
    if existing:
        # Update quantity
        new_qty = existing['quantity'] + item_data.quantity
        await db.shopping_list.update_one(
            {"id": existing['id']},
            {"$set": {"quantity": new_qty}}
        )
        item = ShoppingListItem(**{**existing, "quantity": new_qty})
    else:
        item = ShoppingListItem(**item_data.model_dump())
        doc = item.model_dump()
        doc['added_at'] = doc['added_at'].isoformat()
        await db.shopping_list.insert_one(doc)
    
    return item

@api_router.put("/shopping-list/{item_id}")
async def update_shopping_list_item(item_id: str, checked: bool):
    result = await db.shopping_list.update_one(
        {"id": item_id},
        {"$set": {"checked": checked}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {"message": "Item updated"}

@api_router.delete("/shopping-list/{item_id}")
async def delete_shopping_list_item(item_id: str):
    result = await db.shopping_list.delete_one({"id": item_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {"message": "Item deleted"}

# Brands & Products (Leverandører)
@api_router.post("/brands", response_model=Brand)
async def create_brand(brand_data: BrandCreate):
    brand = Brand(**brand_data.model_dump())
    doc = brand.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.brands.insert_one(doc)
    return brand

@api_router.get("/brands")
async def get_brands():
    brands = await db.brands.find({"active": True}, {"_id": 0}).to_list(100)
    for brand in brands:
        if isinstance(brand.get('created_at'), str):
            brand['created_at'] = datetime.fromisoformat(brand['created_at'])
    return brands

@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate):
    product = Product(**product_data.model_dump())
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.products.insert_one(doc)
    return product

@api_router.get("/products")
async def get_products(category_key: Optional[str] = None):
    query = {"active": True}
    if category_key:
        query["category_key"] = category_key
    
    products = await db.products.find(query, {"_id": 0}).to_list(100)
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    # Get brand info for each product
    for product in products:
        brand = await db.brands.find_one({"id": product['brand_id']}, {"_id": 0})
        if brand:
            product['brand'] = brand
    
    return products

@api_router.post("/products/{product_id}/click")
async def track_product_click(product_id: str):
    result = await db.products.update_one(
        {"id": product_id},
        {"$inc": {"click_count": 1}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Click tracked"}

# Image upload
@api_router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Only images allowed")
    
    # Generate unique filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = UPLOADS_DIR / filename
    
    # Save file
    with open(file_path, 'wb') as f:
        shutil.copyfileobj(file.file, f)
    
    return {"image_url": f"/api/images/{filename}"}

@api_router.get("/images/{filename}")
async def get_image(filename: str):
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(file_path)

@api_router.post("/admin/update-recipe-images")
async def update_recipe_images():
    """Migration endpoint to update existing recipes with image URLs"""
    image_mappings = {
        "Hindbær Drøm": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&h=600&fit=crop",
        "Grøn Æble": "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=600&fit=crop",
        "Fersken Sommer": "https://images.unsplash.com/photo-1629828874514-d4b56b1d8e46?w=400&h=600&fit=crop",
        "Tropisk Paradise": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=600&fit=crop",
        "Kirsebær Luksus": "https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400&h=600&fit=crop",
        "Vandmelon Splash": "https://images.unsplash.com/photo-1587049352846-4a222e784099?w=400&h=600&fit=crop",
        "Ananas Tropical": "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&h=600&fit=crop",
        "Blåbær Vild": "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400&h=600&fit=crop",
        "Solbær Intense": "https://images.unsplash.com/photo-1464454709131-ffd692591ee5?w=400&h=600&fit=crop",
        "Lime Cool": "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=400&h=600&fit=crop",
        "Mojito Slush (18+)": "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=600&fit=crop",
        "Margarita Ice (18+)": "https://images.unsplash.com/photo-1618890111938-16d077babb67?w=400&h=600&fit=crop",
        "Piña Colada Slush (18+)": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=600&fit=crop",
        "Strawberry Daiquiri (18+)": "https://images.unsplash.com/photo-1597306687537-a252f6f71f49?w=400&h=600&fit=crop",
        "Blue Lagoon Frozen (18+)": "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=400&h=600&fit=crop",
        "Sex on the Beach Slush (18+)": "https://images.unsplash.com/photo-1609951651556-5334e2706168?w=400&h=600&fit=crop",
        "Aperol Spritz Frozen (18+)": "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=400&h=600&fit=crop",
        "Frozen Bellini (18+)": "https://images.unsplash.com/photo-1587223075055-82e9a937ddff?w=400&h=600&fit=crop",
        "Cosmopolitan Slush (18+)": "https://images.unsplash.com/photo-1514361892635-6b07e31e75f9?w=400&h=600&fit=crop",
        "Long Island Iced Tea Frozen (18+)": "https://images.unsplash.com/photo-1544145945-35c4e5f2b6cb?w=400&h=600&fit=crop"
    }
    
    updated_count = 0
    for recipe_name, image_url in image_mappings.items():
        result = await db.recipes.update_one(
            {"name": recipe_name, "author": "system"},
            {"$set": {"image_url": image_url}}
        )
        if result.modified_count > 0:
            updated_count += 1
    
    return {"message": f"Updated {updated_count} recipes with images", "total_mapped": len(image_mappings)}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Startup event
@app.on_event("startup")
async def startup_event():
    await seed_recipes()
    logger.info("SLUSHBOOK API started")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()