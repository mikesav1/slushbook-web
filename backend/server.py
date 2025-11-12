from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends, Request, Response, Body
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from PIL import Image
import io
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import shutil
import httpx
import subprocess
import cloudinary
import cloudinary.uploader
import cloudinary.api

# Version
__version__ = "2.0.0"

# Import geolocation service
import geolocation_service

# Import auth module
from auth import (
    User, UserInDB, UserSession, PasswordReset,
    SignupRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest,
    get_password_hash, verify_password, create_session_token, create_reset_token,
    get_current_user, require_auth, require_role,
    can_edit_recipe, can_view_recipe, can_create_recipe,
    security
)

# Import redirect routes
import redirect_routes

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET'),
    secure=True  # Use HTTPS URLs
)

print(f"[INFO] Cloudinary configured: {os.environ.get('CLOUDINARY_CLOUD_NAME')}")

# Debug CORS configuration
cors_origins_str = os.environ.get('CORS_ORIGINS', '*')
print(f"[DEBUG] CORS_ORIGINS from env: {cors_origins_str}")
print(f"[DEBUG] CORS_ORIGINS split: {cors_origins_str.split(',')}")


# NOTE: Redirect-service startup removed - now using integrated FastAPI routes

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


# Dependency to inject database
async def get_db():
    return db

# Wrapper for get_current_user that injects db
async def get_current_user_with_db(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    return await get_current_user(request, credentials, db)


# Create uploads directory
UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI()

# Startup event to clean up old sessions
@app.on_event("startup")
async def cleanup_old_sessions():
    """Clean up sessions inactive for more than 30 days on startup"""
    try:
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        result = await db.user_sessions.delete_many({
            "last_active": {"$lt": thirty_days_ago}
        })
        logger.info(f"Cleaned up {result.deleted_count} old inactive sessions on startup")
    except Exception as e:
        logger.warning(f"Failed to cleanup old sessions on startup: {e}")

# CORS - MUST be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins_str.split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    is_free: bool = False  # True = accessible to guests
    is_published: bool = False  # True = visible to all, False = only to creator
    approval_status: str = "approved"  # pending, approved, rejected
    rejection_reason: Optional[str] = None

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
    is_published: bool = False  # Default to private
    approval_status: str = "pending"  # New recipes default to pending

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
    is_system: bool = False
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

# Comment Models
class Comment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    recipe_id: str
    user_id: str
    user_name: str  # Denormalized for display
    comment: str
    language: str = "da"  # Auto-detected from user.country, default Danish
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None
    likes: int = 0
    liked_by: List[str] = []  # List of user_ids who liked
    status: str = "visible"  # visible, hidden

class CommentCreate(BaseModel):
    recipe_id: str
    comment: str
    language: Optional[str] = None  # Optional, will auto-detect if not provided

class CommentUpdate(BaseModel):
    comment: str

# Tips & Tricks Models
class Tip(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = Field(..., max_length=100)
    content: str = Field(..., max_length=1000)
    category: str  # Maskiner, Produkter, Rengøring, Teknik, Brugertips, Tilbehør
    language: str = "da"  # da, de, fr, en, en-US
    country: str = "DK"  # DK, DE, FR, GB, US
    is_international: bool = False  # Show across all countries
    image_url: Optional[str] = None  # Path to uploaded image
    created_by: str  # User ID
    creator_name: str  # Denormalized for display
    likes: int = 0
    liked_by: List[str] = []  # List of user_ids who liked
    is_public: bool = False  # Must be approved by admin
    approval_status: str = "pending"  # pending, approved, rejected
    rejection_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class TipCreate(BaseModel):
    title: str = Field(..., max_length=100)
    content: str = Field(..., max_length=1000)
    category: str
    is_international: bool = False

class TipUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=100)
    content: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = None

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

# Advertisement Models
class Advertisement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    image: str
    link: str
    country: str  # ISO country code (DK, DE, FR, GB, US, etc.)
    placement: str  # bottom_banner, recipe_list, homepage_hero, sidebar
    active: bool = True
    title: Optional[str] = None
    description: Optional[str] = None
    clicks: int = 0
    impressions: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdCreate(BaseModel):
    image: str
    link: str
    country: str
    placement: str
    active: bool = True
    title: Optional[str] = None
    description: Optional[str] = None

class AdUpdate(BaseModel):
    image: Optional[str] = None
    link: Optional[str] = None
    country: Optional[str] = None
    placement: Optional[str] = None
    active: Optional[bool] = None
    title: Optional[str] = None
    description: Optional[str] = None

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
    
    # Build pantry items with normalized names (lowercase, no extra spaces)
    pantry_items_normalized = []
    for item in pantry_items:
        normalized_name = ' '.join(item['ingredient_name'].lower().split())
        pantry_items_normalized.append({
            'original': item['ingredient_name'],
            'normalized': normalized_name,
            'category': item.get('category_key', '')
        })
    
    for ingredient in recipe['ingredients']:
        if ingredient['role'] == 'garnish':
            continue
        
        ingredient_name_normalized = ' '.join(ingredient['name'].lower().split())
        
        # Try exact normalized match first
        matched = any(
            ingredient_name_normalized == pantry_item['normalized']
            for pantry_item in pantry_items_normalized
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
    return {
        "message": "SLUSHBOOK API",
        "version": __version__,
        "status": "healthy"
    }

# =============================================================================
# AUTHENTICATION ENDPOINTS
# =============================================================================

@api_router.post("/auth/signup")
async def signup(request: SignupRequest):
    """Sign up new user"""
    # Check if user exists
    existing_user = await db.users.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(request.password)
    
    # Validate country code - fallback to GB if invalid
    valid_countries = ["DK", "DE", "FR", "GB", "US"]
    country_code = request.country if request.country in valid_countries else "GB"
    
    user = {
        "id": user_id,
        "email": request.email,
        "name": request.name,
        "role": "guest",  # Start as guest, can upgrade to pro
        "picture": None,
        "hashed_password": hashed_password,
        "country": country_code,  # Save user's country preference
        "language": "dk" if country_code == "DK" else "en-us",  # Set language based on country
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user)
    
    return {"message": "User created successfully", "user_id": user_id}


# OPTIONS handler for CORS preflight
@api_router.options("/auth/login")
async def login_options():
    """Handle CORS preflight for login"""
    return {}

@api_router.post("/auth/login")
async def login(request: LoginRequest, response: Response, http_request: Request):
    """Login with email/password with device limit enforcement"""
    logger.info(f"Login attempt for: {request.email}")
    
    # Find user
    user_doc = await db.users.find_one({"email": request.email})
    if not user_doc:
        logger.warning(f"User not found: {request.email}")
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    
    logger.info(f"User found: {request.email}, verifying password...")
    
    # Verify password
    password_valid = verify_password(request.password, user_doc["hashed_password"])
    logger.info(f"Password verification result: {password_valid}")
    
    if not password_valid:
        logger.warning(f"Password verification failed for: {request.email}")
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    
    # Get device info from request
    device_id = getattr(request, 'device_id', None)
    device_name = getattr(request, 'device_name', 'Unknown Device')
    user_agent = http_request.headers.get('user-agent', 'Unknown')
    ip_address = http_request.client.host
    
    # Determine max devices based on user role
    role = user_doc.get("role", "guest")
    if role == "admin":
        max_devices = 999  # Unlimited for admin
    elif role == "pro":
        max_devices = 3
    else:
        max_devices = 1  # Guest/free users
    
    # Check active sessions for this user
    active_sessions = await db.user_sessions.find({
        "user_id": user_doc["id"],
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    }).sort("last_active", 1).to_list(length=None)
    
    # Filter out current device if already logged in
    if device_id:
        active_sessions = [s for s in active_sessions if s.get("device_id") != device_id]
    
    # If at or over limit, remove oldest session(s)
    if len(active_sessions) >= max_devices:
        sessions_to_remove = len(active_sessions) - max_devices + 1
        for i in range(sessions_to_remove):
            oldest_session = active_sessions[i]
            await db.user_sessions.delete_one({"_id": oldest_session["_id"]})
            logger.info(f"Removed oldest session for user {user_doc['id']} due to device limit")
    
    # Create new session with 30 day expiration
    session_token = create_session_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)  # Extended from 7 to 30 days
    
    session = {
        "user_id": user_doc["id"],
        "session_token": session_token,
        "device_id": device_id,
        "device_name": device_name,
        "user_agent": user_agent,
        "ip_address": ip_address,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
        "last_active": datetime.now(timezone.utc)
    }
    
    await db.user_sessions.insert_one(session)
    
    # Update last_login timestamp
    await db.users.update_one(
        {"id": user_doc["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc)}}
    )
    
    # Set cookie with 30 day expiration
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=30 * 24 * 60 * 60  # 30 days (matches session expiration)
    )
    
    # Remove password from response
    user_doc.pop("hashed_password", None)
    
    return {
        "message": "Login successful",
        "user": {
            "id": user_doc["id"],
            "email": user_doc["email"],
            "name": user_doc["name"],
            "role": user_doc["role"],
            "picture": user_doc.get("picture"),
            "country": user_doc.get("country_preference", user_doc.get("country", "DK")),  # Read from country_preference first
            "language": user_doc.get("language_preference", user_doc.get("language", "dk"))  # Read from language_preference first
        },
        "session_token": session_token,
        "device_limit": {
            "current": len(active_sessions) + 1,
            "max": max_devices
        }
    }


# ===== DEVICE MANAGEMENT ENDPOINTS =====

@api_router.get("/auth/devices")
async def get_user_devices(request: Request):
    """Get all active devices for current user (last 7 days)"""
    user = await get_current_user(request, None, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Only show sessions active in the last 7 days to avoid clutter
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    # Get all active sessions from last 7 days
    sessions = await db.user_sessions.find({
        "user_id": user.id,
        "expires_at": {"$gt": datetime.now(timezone.utc)},
        "last_active": {"$gt": seven_days_ago}  # Only sessions active in last 7 days
    }).sort("last_active", -1).to_list(length=None)
    
    # Get current session token
    current_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
    
    devices = []
    for session in sessions:
        devices.append({
            "device_id": session.get("device_id"),
            "session_token": session.get("session_token"),  # Include session_token as fallback
            "device_name": session.get("device_name", "Unknown Device"),
            "user_agent": session.get("user_agent", ""),
            "ip_address": session.get("ip_address"),
            "last_active": session.get("last_active", session.get("created_at")).isoformat(),
            "is_current": session.get("session_token") == current_token
        })
    
    # Determine max devices
    role = user.role
    if role == "admin":
        max_devices = 999
    elif role == "pro":
        max_devices = 3
    else:
        max_devices = 1
    
    return {
        "devices": devices,
        "current_count": len(devices),
        "max_devices": max_devices
    }

@api_router.post("/auth/devices/logout")
async def logout_device(request: Request):
    """Logout a specific device by device_id or session_token"""
    user = await get_current_user(request, None, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get device_id or session_token from request body
    body = await request.json()
    device_id = body.get("device_id")
    session_token = body.get("session_token")
    
    if not device_id and not session_token:
        raise HTTPException(status_code=422, detail="device_id or session_token is required")
    
    # Build query - prefer device_id, fallback to session_token
    query = {"user_id": user.id}
    if device_id:
        query["device_id"] = device_id
    else:
        query["session_token"] = session_token
    
    # Delete the session
    result = await db.user_sessions.delete_one(query)
    
    if result.deleted_count > 0:
        return {"message": "Device logged out successfully"}
    else:
        raise HTTPException(status_code=404, detail="Device not found")

@api_router.post("/auth/devices/logout-all")
async def logout_all_devices(request: Request):
    """Logout all devices except current"""
    user = await get_current_user(request, None, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get current session token
    current_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
    
    # Delete all sessions except current
    result = await db.user_sessions.delete_many({
        "user_id": user.id,
        "session_token": {"$ne": current_token}
    })
    
    return {
        "message": f"Logged out {result.deleted_count} devices",
        "count": result.deleted_count
    }

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current user info"""
    async def get_user_with_db(req):
        return await get_current_user(req, None, db)
    
    user = await get_user_with_db(request)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )
    
    return user


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    
    if session_token:
        # Delete session from database
        await db.user_sessions.delete_one({"session_token": session_token})
    
    # Clear cookie
    response.delete_cookie("session_token")
    
    return {"message": "Logged out successfully"}


@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Request password reset"""
    # Find user
    user = await db.users.find_one({"email": request.email})
    if not user:
        # Don't reveal if email exists
        return {"message": "If email exists, reset link will be sent"}
    
    # Create reset token
    reset_token = create_reset_token()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Delete old reset tokens for this email
    await db.password_resets.delete_many({"email": request.email})
    
    # Save new reset token
    reset = {
        "email": request.email,
        "reset_token": reset_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.password_resets.insert_one(reset)
    
    # TODO: Send email with reset link (for now, return token in response for testing)
    # In production, send email here
    
    return {
        "message": "If email exists, reset link will be sent",
        "reset_token": reset_token  # REMOVE THIS IN PRODUCTION
    }


@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password with token"""
    # Find reset token
    reset = await db.password_resets.find_one({
        "reset_token": request.reset_token,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })
    
    if not reset:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token"
        )
    
    # Update user password
    hashed_password = get_password_hash(request.new_password)
    await db.users.update_one(
        {"email": reset["email"]},
        {"$set": {"hashed_password": hashed_password}}
    )
    
    # Delete reset token
    await db.password_resets.delete_one({"reset_token": request.reset_token})
    
    # Delete all sessions for this user
    user = await db.users.find_one({"email": reset["email"]})
    if user:
        await db.user_sessions.delete_many({"user_id": user["id"]})
    
    return {"message": "Password reset successful"}


@api_router.put("/auth/profile")
async def update_profile(request: Request, update_data: dict):
    """Update user profile"""
    user = await get_current_user(request, None, db)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )
    
    update_fields = {}
    
    # Update name
    if "name" in update_data and update_data["name"]:
        update_fields["name"] = update_data["name"]
    
    # Update email
    if "email" in update_data and update_data["email"]:
        # Check if email already exists
        existing = await db.users.find_one({
            "email": update_data["email"],
            "id": {"$ne": user.id}
        })
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Email er allerede registreret"
            )
        update_fields["email"] = update_data["email"]
    
    # Update password if provided
    if "new_password" in update_data and update_data["new_password"]:
        if "current_password" not in update_data:
            raise HTTPException(
                status_code=400,
                detail="Nuværende password påkrævet"
            )
        
        # Verify current password
        user_doc = await db.users.find_one({"id": user.id})
        if not verify_password(update_data["current_password"], user_doc["hashed_password"]):
            raise HTTPException(
                status_code=400,
                detail="Forkert nuværende password"
            )
        
        update_fields["hashed_password"] = get_password_hash(update_data["new_password"])
    
    # Update user
    if update_fields:
        await db.users.update_one(
            {"id": user.id},
            {"$set": update_fields}
        )
    
    return {"message": "Profil opdateret"}


# =============================================================================
# ADMIN ENDPOINTS - Members Management
# =============================================================================

@api_router.get("/admin/members")
async def get_all_members(request: Request):
    """Get all members (admin only)"""
    user = await get_current_user(request, None, db)
    if not user or user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Kun admin har adgang"
        )
    
    # Get all users
    users = await db.users.find({}).to_list(length=None)
    
    # Remove password hashes, add id field, and add recipe count
    for u in users:
        u.pop("hashed_password", None)
        # Use email as id if id doesn't exist
        if "id" not in u:
            u["id"] = u.get("email")
        u["_id"] = str(u.get("_id", ""))
        
        # Add recipe count
        recipe_count = await db.user_recipes.count_documents({"author": u.get("email")})
        u["recipe_count"] = recipe_count
    
    return users


@api_router.get("/admin/members/{user_id}/details")
async def get_member_details(user_id: str, request: Request):
    """Get detailed information about a specific member (admin only)"""
    user = await get_current_user(request, None, db)
    if not user or user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Kun admin har adgang"
        )
    
    # Get user by id or email
    target_user = await db.users.find_one({"$or": [{"id": user_id}, {"email": user_id}]})
    
    if not target_user:
        raise HTTPException(status_code=404, detail="Bruger ikke fundet")
    
    # Remove password
    target_user.pop("hashed_password", None)
    target_user["_id"] = str(target_user.get("_id", ""))
    
    # Get user's recipes
    recipes = await db.user_recipes.find({"author": target_user.get("email")}).to_list(length=None)
    for recipe in recipes:
        recipe["_id"] = str(recipe.get("_id", ""))
    
    # Get user's favorites
    favorites = target_user.get("favorites", [])
    
    # Create activity log (based on recipes created)
    activities = []
    for recipe in recipes:
        activities.append({
            "action": f"Oprettet opskrift: {recipe['name']}",
            "timestamp": recipe.get("created_at", datetime.now(timezone.utc).isoformat())
        })
    
    # Sort activities by timestamp (newest first)
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    
    # ===== TEMPORARY: Get recipe view statistics for testing period =====
    # TODO: Remove this before final production release
    view_stats = {"unique_recipes_viewed": 0, "total_views": 0}
    if target_user.get("email"):
        # Get all views for this user
        views = await db.recipe_views.find({"user_email": target_user["email"]}).to_list(length=None)
        view_stats["total_views"] = len(views)
        
        # Count unique recipes
        unique_recipes = set([v["recipe_id"] for v in views])
        view_stats["unique_recipes_viewed"] = len(unique_recipes)
    # ===== END TEMPORARY =====
    
    return {
        **target_user,
        "recipes": recipes,
        "favorites": favorites,
        "activities": activities[:20],  # Limit to 20 most recent activities
        "view_stats": view_stats  # Temporary field for testing
    }


@api_router.put("/admin/members/{user_id}/role")
async def update_member_role(user_id: str, role_data: dict, request: Request):
    """Update user role (admin only)"""
    user = await get_current_user(request, None, db)
    if not user or user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Kun admin har adgang"
        )
    
    new_role = role_data.get("role")
    if new_role not in ["guest", "pro", "editor", "admin"]:
        raise HTTPException(
            status_code=400,
            detail="Ugyldig rolle"
        )
    
    # Update role
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": new_role}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Bruger ikke fundet"
        )
    
    return {"message": "Rolle opdateret"}


@api_router.post("/admin/members/create")
async def create_member(member_data: dict, request: Request):
    """Create new user (admin only)"""
    user = await get_current_user(request, None, db)
    if not user or user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Kun admin har adgang"
        )
    
    email = member_data.get("email")
    name = member_data.get("name")
    password = member_data.get("password")
    role = member_data.get("role", "guest")
    
    if not email or not name or not password:
        raise HTTPException(
            status_code=400,
            detail="Email, navn og password påkrævet"
        )
    
    # Check if user exists
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email er allerede registreret"
        )
    
    # Create user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(password)
    
    new_user = {
        "id": user_id,
        "email": email,
        "name": name,
        "role": role,
        "picture": None,
        "hashed_password": hashed_password,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(new_user)
    
    return {"message": "Bruger oprettet", "user_id": user_id}


@api_router.put("/admin/members/{user_id}/reset-password")
async def reset_member_password(user_id: str, password_data: dict, request: Request):
    """Reset user password (admin only)"""
    user = await get_current_user(request, None, db)
    if not user or user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Kun admin har adgang"
        )
    
    new_password = password_data.get("password")
    if not new_password or len(new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password skal være mindst 6 tegn"
        )
    
    # Update password
    hashed_password = get_password_hash(new_password)
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"hashed_password": hashed_password}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Bruger ikke fundet"
        )
    
    # Delete all sessions for this user
    await db.user_sessions.delete_many({"user_id": user_id})
    
    return {"message": "Password nulstillet"}



@api_router.delete("/admin/members/{user_id}")
async def delete_member(user_id: str, request: Request):
    """Delete a user (admin only)"""
    user = await get_current_user(request, None, db)
    if not user or user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Kun admin har adgang"
        )
    
    # Prevent admin from deleting themselves
    if user.id == user_id:
        raise HTTPException(
            status_code=400,
            detail="Du kan ikke slette dig selv"
        )
    
    # Delete user
    result = await db.users.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Bruger ikke fundet"
        )
    
    # Clean up user data
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.recipes.delete_many({"created_by": user_id})
    await db.favorites.delete_many({"session_id": user_id})
    await db.pantry_items.delete_many({"session_id": user_id})
    await db.shopping_list.delete_many({"session_id": user_id})
    await db.machines.delete_many({"session_id": user_id})
    
    return {"message": "Bruger slettet"}

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
async def get_user_limits(session_id: str, request: Request):
    # Get current user
    user = await get_current_user(request, None, db)
    
    if user and user.role in ["admin", "editor", "pro"]:
        # Unlimited for admin, editor, pro
        if user.role == "admin":
            count = await db.user_recipes.count_documents({"author": user.id})
        elif user.role == "editor":
            count = await db.user_recipes.count_documents({"author": user.id})
        else:  # pro
            count = await db.user_recipes.count_documents({"author": user.id})
        
        return {
            "user_recipes_count": count,
            "can_add_recipe": True,
            "limit_message": f"{user.role.capitalize()}: Ubegrænset opskrifter!"
        }
    else:
        # Guest or regular user - limited to 2
        if user:
            count = await db.user_recipes.count_documents({"author": user.id})
        else:
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
    request: Request,
    alcohol: str = "both",
    color: Optional[str] = None,
    type: Optional[str] = None,
    search: Optional[str] = None,
    session_id: Optional[str] = None,
    include_ingredients: Optional[str] = None,  # Comma-separated list
    exclude_ingredients: Optional[str] = None,   # Comma-separated list
    author: Optional[str] = None  # Filter by author ID
):
    # Get current user (can be None for guests)
    user = await get_current_user(request, None, db)
    
    query = {}
    
    if alcohol == "none":
        query["alcohol_flag"] = False
    elif alcohol == "only":
        query["alcohol_flag"] = True
    
    if color:
        query["color"] = color
    
    if type:
        query["type"] = type
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    # Get system recipes with filtering based on user role and is_published status
    # IMPORTANT: Only show published recipes (is_published=True) unless user is admin
    # Guests see ALL published recipes (including locked ones) to create "hook" for upgrading
    # Frontend will display locked recipes with blur/overlay
    if user and user.role == "admin":
        # Admin users see ALL system recipes (including unpublished)
        system_recipes = await db.recipes.find({**query, "author": "system"}, {"_id": 0}).to_list(1000)
        logger.info(f"[RECIPES] Admin user, returning {len(system_recipes)} system recipes (all)")
    else:
        # Pro and Guest users see ONLY published system recipes
        system_recipes = await db.recipes.find(
            {**query, "author": "system", "is_published": True},
            {"_id": 0}
        ).to_list(1000)
        logger.info(f"[RECIPES] Non-admin user, returning {len(system_recipes)} published system recipes")
    
    # Get published user recipes (is_published = true AND approved)
    published_user_recipes = await db.user_recipes.find(
        {**query, "is_published": True, "approval_status": "approved"},
        {"_id": 0}
    ).to_list(1000)
    
    # Get current user's own recipes (private + pending + rejected) if logged in
    own_recipes = []
    if session_id:
        # Get current user to access their id and email
        user = await db.users.find_one({"id": session_id})
        
        if user:
            user_id = user.get("id")
            user_email = user.get("email")
            
            # Build query to match ANY of: session_id, author (user_id), or author (email)
            # This handles all cases: old recipes, new recipes, different session IDs
            user_query = {"$or": [
                {"session_id": session_id},  # Current session
                {"author": user_id},          # Author is user ID
                {"author": user_email},       # Author is email (legacy)
                {"session_id": user_id}       # Session_id is user ID (some recipes)
            ]}
            
            # Get user's private recipes (not published)
            private_recipes = await db.user_recipes.find(
                {**query, **user_query, "is_published": {"$ne": True}},
                {"_id": 0}
            ).to_list(1000)
            
            # Get user's pending/rejected published recipes (so they can see their own submissions)
            pending_recipes = await db.user_recipes.find(
                {**query, **user_query, "is_published": True, "approval_status": {"$in": ["pending", "rejected"]}},
                {"_id": 0}
            ).to_list(1000)
            
            own_recipes = private_recipes + pending_recipes
    
    all_recipes = system_recipes + published_user_recipes + own_recipes
    
    # Filter by author if specified
    if author:
        all_recipes = [r for r in all_recipes if r.get('author') == author]
    
    # Filter by ingredients if specified
    if include_ingredients or exclude_ingredients:
        include_list = [ing.strip().lower() for ing in include_ingredients.split(',')] if include_ingredients else []
        exclude_list = [ing.strip().lower() for ing in exclude_ingredients.split(',')] if exclude_ingredients else []
        
        filtered_recipes = []
        for recipe in all_recipes:
            # Get all ingredient names from recipe (lowercase for case-insensitive matching)
            recipe_ingredients = [ing['name'].lower() for ing in recipe.get('ingredients', [])]
            
            # Check if recipe contains ALL included ingredients
            if include_list:
                has_all_included = all(
                    any(include_ing in recipe_ing for recipe_ing in recipe_ingredients)
                    for include_ing in include_list
                )
                if not has_all_included:
                    continue  # Skip this recipe
            
            # Check if recipe contains ANY excluded ingredients
            if exclude_list:
                has_any_excluded = any(
                    any(exclude_ing in recipe_ing for recipe_ing in recipe_ingredients)
                    for exclude_ing in exclude_list
                )
                if has_any_excluded:
                    continue  # Skip this recipe
            
            # Recipe passed all filters
            filtered_recipes.append(recipe)
        
        all_recipes = filtered_recipes
    
    # Parse datetime
    for recipe in all_recipes:
        if isinstance(recipe.get('created_at'), str):
            recipe['created_at'] = datetime.fromisoformat(recipe['created_at'])
    
    # IMPORTANT: Sort recipes so FREE recipes appear FIRST
    # This ensures guests see free recipes before locked ones on homepage
    all_recipes.sort(key=lambda r: (
        # Primary sort: Free recipes first (is_free=True comes before is_free=False)
        not r.get('is_free', False),
        # Secondary sort: Newest first
        -(r.get('created_at', datetime.min.replace(tzinfo=timezone.utc)).timestamp())
    ))
    
    # Add favorite and rating info + author name for user recipes
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
            
            # Add author name for user-created recipes
            if recipe.get('author') and recipe.get('author') != 'system':
                author_user = await db.users.find_one({"id": recipe['author']}, {"_id": 0, "name": 1})
                if author_user:
                    recipe['author_name'] = author_user.get('name', 'Ukendt')
                else:
                    recipe['author_name'] = 'Ukendt'
    else:
        # Even without session_id, add author names for display
        for recipe in all_recipes:
            if recipe.get('author') and recipe.get('author') != 'system':
                author_user = await db.users.find_one({"id": recipe['author']}, {"_id": 0, "name": 1})
                if author_user:
                    recipe['author_name'] = author_user.get('name', 'Ukendt')
                else:
                    recipe['author_name'] = 'Ukendt'
    
    return all_recipes

@api_router.get("/recipes/{recipe_id}")
async def get_recipe(recipe_id: str, session_id: Optional[str] = None, request: Request = None):
    # Get current user if logged in
    user = None
    if request:
        try:
            user = await get_current_user(request, None, db)
        except:
            pass
    
    # Try system recipes first
    recipe = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    
    # If system recipe found, check if user has access
    if recipe:
        is_admin = user and user.role == "admin"
        is_published = recipe.get("is_published", False)
        
        # Non-admin users can only see published system recipes
        if not is_admin and not is_published:
            raise HTTPException(status_code=404, detail="Recipe not found")
    
    # Try user recipes if not found in system recipes
    if not recipe:
        # First, try to find approved user recipes (public to all)
        approved_recipe = await db.user_recipes.find_one({
            "id": recipe_id,
            "approval_status": "approved"
        }, {"_id": 0})
        
        if approved_recipe:
            recipe = approved_recipe
        elif session_id:
            # If not approved, search by session_id OR author (for logged-in users)
            query = {"id": recipe_id}
            if user:
                # If logged in, search by author (user.id) or session_id
                query["$or"] = [
                    {"session_id": session_id},
                    {"author": user.id},
                    {"author": user.email}
                ]
            else:
                # If guest, search by session_id only
                query["session_id"] = session_id
                
            recipe = await db.user_recipes.find_one(query, {"_id": 0})
    
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
    
    # Add author name for user-created recipes
    if recipe.get('author') and recipe.get('author') != 'system':
        author_user = await db.users.find_one({"id": recipe['author']}, {"_id": 0, "name": 1})
        if author_user:
            recipe['author_name'] = author_user.get('name', 'Ukendt')
        else:
            recipe['author_name'] = 'Ukendt'
    
    # Increment view count (only for system recipes)
    if recipe.get('author') == 'system':
        await db.recipes.update_one(
            {"id": recipe_id},
            {"$inc": {"view_count": 1}}
        )
    
    # ===== TEMPORARY: Track recipe views for testing period =====
    # TODO: Remove this before final production release
    if user:
        await db.recipe_views.insert_one({
            "user_id": user.id,
            "user_email": user.email,
            "recipe_id": recipe_id,
            "recipe_name": recipe.get('name', ''),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    # ===== END TEMPORARY =====
    
    return recipe

@api_router.delete("/recipes/{recipe_id}")
async def delete_recipe(recipe_id: str, request: Request):
    """Delete a recipe (admin or recipe author)"""
    # Get current user
    user = await get_current_user(request, None, db)
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Du skal være logget ind for at slette opskrifter"
        )
    
    # Check if recipe exists and get it
    recipe = await db.recipes.find_one({"id": recipe_id})
    if not recipe:
        recipe = await db.user_recipes.find_one({"id": recipe_id})
    
    if not recipe:
        raise HTTPException(
            status_code=404,
            detail="Opskrift ikke fundet"
        )
    
    # Check if user is admin OR the recipe author
    is_admin = user.role == "admin"
    is_author = recipe.get("author") == user.id or recipe.get("author") == user.email
    
    if not (is_admin or is_author):
        raise HTTPException(
            status_code=403,
            detail="Du kan kun slette dine egne opskrifter"
        )
    
    # Delete recipe from main recipes collection
    result = await db.recipes.delete_one({"id": recipe_id})
    
    # Also try to delete from user_recipes if it exists there
    if result.deleted_count == 0:
        result = await db.user_recipes.delete_one({"id": recipe_id})
    
    # Clean up related data
    await db.favorites.delete_many({"recipe_id": recipe_id})
    await db.ratings.delete_many({"recipe_id": recipe_id})
    
    return {
        "message": "Opskrift slettet",
        "recipe_id": recipe_id
    }

@api_router.post("/recipes", response_model=Recipe)
async def create_recipe(recipe_data: RecipeCreate, request: Request):
    # Get current user
    user = await get_current_user(request, None, db)
    
    # Check user limit based on role
    if not user:
        # Guest user - check session limit
        count = await db.user_recipes.count_documents({"session_id": recipe_data.session_id})
        if count >= 2:
            raise HTTPException(
                status_code=403,
                detail="Gæste limit nået! Maks 2 egne opskrifter. Log ind eller opgradér til Pro for ubegrænset adgang."
            )
        author_id = recipe_data.session_id
        author_name = "Gæst"
    elif user.role in ["admin", "editor", "pro"]:
        # Admin, Editor, Pro - unlimited
        author_id = user.id
        author_name = user.name
    else:
        # Regular guest user (logged in but not pro) - still limited to 2
        count = await db.user_recipes.count_documents({"author": user.id})
        if count >= 2:
            raise HTTPException(
                status_code=403,
                detail="Gratis limit nået! Maks 2 egne opskrifter. Opgradér til Pro for ubegrænset adgang."
            )
        author_id = user.id
        author_name = user.name
    
    recipe_dict = recipe_data.model_dump()
    session_id = recipe_dict.pop('session_id')
    
    # Set approval status based on is_published
    if recipe_dict.get('is_published') and user and user.role != "admin":
        # Non-admin trying to publish - needs approval
        recipe_dict['approval_status'] = 'pending'
    elif user and user.role == "admin":
        # Admin can publish directly
        recipe_dict['approval_status'] = 'approved'
    else:
        # Private recipes don't need approval
        recipe_dict['approval_status'] = 'approved'
    
    recipe = Recipe(
        **recipe_dict,
        author=author_id,
        author_name=author_name
    )
    
    doc = recipe.model_dump()
    doc['session_id'] = session_id
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.user_recipes.insert_one(doc)
    return recipe

@api_router.put("/recipes/{recipe_id}", response_model=Recipe)
async def update_recipe(recipe_id: str, recipe_data: RecipeCreate, request: Request):
    # Get current user
    user = await get_current_user(request, None, db)
    
    # Check if recipe exists in user_recipes first
    existing_user = await db.user_recipes.find_one({"id": recipe_id})
    
    # Check if it's a system recipe
    existing_system = await db.recipes.find_one({"id": recipe_id})
    
    if not existing_user and not existing_system:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    recipe_dict = recipe_data.model_dump()
    session_id = recipe_dict.pop('session_id')
    
    # Check permissions
    if existing_system:
        # System recipe - only admin can edit
        if not user or user.role != "admin":
            raise HTTPException(
                status_code=403,
                detail="Kun admin kan redigere system opskrifter"
            )
        existing = existing_system
        collection = db.recipes
        recipe = Recipe(
            **recipe_dict,
            id=recipe_id,
            author=existing.get('author', 'system'),
            author_name=existing.get('author_name', 'SLUSHBOOK'),
            created_at=datetime.fromisoformat(existing['created_at']) if isinstance(existing['created_at'], str) else existing['created_at']
        )
        doc = recipe.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
    else:
        # User recipe - check ownership
        existing = existing_user
        
        # Admin can edit all, others only their own
        if user:
            if user.role != "admin" and existing.get('author') != user.id:
                raise HTTPException(
                    status_code=403,
                    detail="Du kan kun redigere dine egne opskrifter"
                )
        else:
            # Guest user - check session
            if existing.get('session_id') != session_id:
                raise HTTPException(
                    status_code=403,
                    detail="Du kan kun redigere dine egne opskrifter"
                )
        
        collection = db.user_recipes
        recipe = Recipe(
            **recipe_dict,
            id=recipe_id,
            author=existing.get('author', session_id),
            author_name=existing.get('author_name', 'Mig'),
            created_at=datetime.fromisoformat(existing['created_at']) if isinstance(existing['created_at'], str) else existing['created_at']
        )
        doc = recipe.model_dump()
        doc['session_id'] = session_id
        doc['created_at'] = doc['created_at'].isoformat()
        
        # IMPORTANT: When editing an existing recipe, set status to "pending" for re-approval
        # (unless user is admin - admins can edit without re-approval)
        if user and user.role == "admin":
            # Admin edits keep their current status (or set to approved if new)
            doc['status'] = existing.get('status', 'approved')
        else:
            # Non-admin edits require re-approval
            doc['status'] = 'pending'
            logger.info(f"Recipe {recipe_id} edited by non-admin, set to pending for re-approval")
    
    await collection.replace_one(
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
async def get_pantry(
    session_id: str,
    user: Optional[User] = Depends(get_current_user_with_db)
):
    # Only pro users can use pantry - return empty for guests
    if not user or user.role == "guest":
        return []
    items = await db.user_pantry.find({"session_id": session_id}, {"_id": 0}).to_list(1000)
    
    for item in items:
        if isinstance(item.get('added_at'), str):
            item['added_at'] = datetime.fromisoformat(item['added_at'])
        if isinstance(item.get('expires_at'), str):
            item['expires_at'] = datetime.fromisoformat(item['expires_at'])
    
    return items

@api_router.post("/pantry", response_model=PantryItem)
async def add_pantry_item(
    item_data: PantryItemCreate,
    user: User = Depends(require_role(["pro", "editor", "admin"], db))
):
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

@api_router.delete("/pantry/{session_id}/{item_id}")
async def delete_pantry_item(
    session_id: str, 
    item_id: str,
    user: User = Depends(require_role(["pro", "editor", "admin"], db))
):
    result = await db.user_pantry.delete_one({
        "session_id": session_id,
        "id": item_id
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
    
    # Get all recipes that user has access to
    # System recipes: Only published ones (unless user is admin)
    recipes = await db.recipes.find(
        {"author": "system", "is_published": True}, 
        {"_id": 0}
    ).to_list(1000)
    
    # User recipes: User's own recipes + approved public recipes
    user_recipes_query = {
        "$or": [
            {"session_id": request.session_id},  # User's own recipes
            {"approval_status": "approved"}  # Approved public recipes
        ]
    }
    user_recipes = await db.user_recipes.find(user_recipes_query, {"_id": 0}).to_list(1000)
    
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
    
    # Categorize - Show recipes where user has AT LEAST ONE ingredient
    # Sort by how many ingredients they have (most matches first)
    recipes_with_matches = [m for m in matches if len(m['match']['have']) > 0]
    recipes_with_matches.sort(key=lambda x: (len(x['match']['have']), -len(x['match']['missing'])), reverse=True)
    
    can_make = [m for m in recipes_with_matches if m['match']['can_make_now']]
    has_some = [m for m in recipes_with_matches if not m['match']['can_make_now']]
    
    return {
        "can_make_now": can_make[:50],  # Increased limit
        "almost": has_some[:50],  # These are recipes where user has some ingredients
        "need_more": [],  # Not used
        "total_matches": len(recipes_with_matches)
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


@api_router.delete("/machines/{machine_id}")
async def delete_machine(machine_id: str, session_id: str):
    result = await db.machines.delete_one({"id": machine_id, "session_id": session_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    return {"message": "Machine deleted"}

# Favorites
@api_router.get("/favorites/{session_id}")
async def get_favorites(
    session_id: str,
    user: Optional[User] = Depends(get_current_user_with_db)
):
    # Only pro users can have favorites - return empty for guests
    if not user or user.role == "guest":
        return []
    favorites = await db.favorites.find({"session_id": session_id}, {"_id": 0}).to_list(1000)
    
    # Get full recipe details
    recipe_ids = [fav['recipe_id'] for fav in favorites]
    
    # Get system recipes
    recipes = await db.recipes.find({"id": {"$in": recipe_ids}}, {"_id": 0}).to_list(1000)
    
    # Get user recipes - include approved recipes (public) OR own recipes
    user_recipes = await db.user_recipes.find(
        {
            "id": {"$in": recipe_ids},
            "$or": [
                {"session_id": session_id},  # Own recipes
                {"approval_status": "approved"}  # Approved public recipes
            ]
        },
        {"_id": 0}
    ).to_list(1000)
    
    all_recipes = recipes + user_recipes
    
    for recipe in all_recipes:
        if isinstance(recipe.get('created_at'), str):
            recipe['created_at'] = datetime.fromisoformat(recipe['created_at'])
        recipe['is_favorite'] = True
    
    return all_recipes

@api_router.post("/favorites")
async def add_favorite(
    session_id: str, 
    recipe_id: str,
    user: User = Depends(require_role(["pro", "editor", "admin"], db))
):
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
async def remove_favorite(
    session_id: str, 
    recipe_id: str,
    user: User = Depends(require_role(["pro", "editor", "admin"], db))
):
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

# ==================== COMMENTS ====================

@api_router.get("/comments/{recipe_id}")
async def get_comments(
    recipe_id: str,
    language: Optional[str] = None,
    user: Optional[User] = Depends(get_current_user_with_db)
):
    """Get all visible comments for a recipe, filtered by language"""
    query = {
        "recipe_id": recipe_id,
        "status": "visible"
    }
    
    # If language specified, filter by it
    # Otherwise, show user's language first if they're logged in
    if language:
        query["language"] = language
    
    comments = await db.recipe_comments.find(query, {"_id": 0}).to_list(1000)
    
    # Parse dates
    for comment in comments:
        if isinstance(comment.get('created_at'), str):
            comment['created_at'] = datetime.fromisoformat(comment['created_at'])
        if isinstance(comment.get('updated_at'), str):
            comment['updated_at'] = datetime.fromisoformat(comment['updated_at'])
    
    # Sort by newest first
    comments.sort(key=lambda x: x['created_at'], reverse=True)
    
    return comments

@api_router.get("/admin/comments/all")
async def get_all_comments_admin(
    user: User = Depends(require_role(["admin"], db)),
    status: Optional[str] = None,
    language: Optional[str] = None
):
    """Admin: Get all comments (including hidden) with optional filters"""
    query = {}
    
    if status:
        query["status"] = status
    
    # Special handling for language filter
    if language:
        # Also include comments without language field when filtering
        query["$or"] = [
            {"language": language},
            {"language": {"$exists": False}}  # Include old comments without language
        ]
    
    comments = await db.recipe_comments.find(query, {"_id": 0}).to_list(10000)
    
    # Parse dates, fix missing languages, and enrich with recipe info
    for comment in comments:
        # Fix missing language field (backward compatibility)
        if 'language' not in comment or not comment.get('language'):
            # Try to detect from user
            comment_user = await db.users.find_one({"id": comment['user_id']}, {"_id": 0, "country": 1})
            if comment_user and comment_user.get('country'):
                country_to_lang = {
                    'DK': 'da',
                    'DE': 'de',
                    'FR': 'fr',
                    'GB': 'en',
                    'US': 'en-US',
                }
                comment['language'] = country_to_lang.get(comment_user['country'], 'da')
            else:
                comment['language'] = 'da'  # Default to Danish
            
            # Update in database for future
            await db.recipe_comments.update_one(
                {"id": comment['id']},
                {"$set": {"language": comment['language']}}
            )
        
        if isinstance(comment.get('created_at'), str):
            comment['created_at'] = datetime.fromisoformat(comment['created_at'])
        if isinstance(comment.get('updated_at'), str):
            comment['updated_at'] = datetime.fromisoformat(comment['updated_at'])
        
        # Add recipe name
        recipe = await db.recipes.find_one({"id": comment['recipe_id']}, {"_id": 0, "name": 1})
        comment['recipe_name'] = recipe['name'] if recipe else "Unknown"
    
    # Sort by newest first
    comments.sort(key=lambda x: x['created_at'], reverse=True)
    
    return comments

@api_router.post("/comments", response_model=Comment)
async def create_comment(
    comment_data: CommentCreate,
    user: User = Depends(require_role(["pro", "editor", "admin"], db))
):
    """Create a new comment (Pro users only)"""
    # Auto-detect language from user's country if not provided
    language = comment_data.language
    if not language:
        # Map country codes to language codes
        country_to_lang = {
            'DK': 'da',  # Denmark -> Danish
            'DE': 'de',  # Germany -> German
            'FR': 'fr',  # France -> French
            'GB': 'en',  # UK -> English
            'US': 'en-US',  # USA -> American English
        }
        language = country_to_lang.get(user.country, 'da')  # Default to Danish
    
    # Create comment with user info and language
    comment = Comment(
        recipe_id=comment_data.recipe_id,
        user_id=user.id,
        user_name=user.name,  # Store user name for display
        comment=comment_data.comment.strip(),
        language=language
    )
    
    # Save to database
    doc = comment.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.recipe_comments.insert_one(doc)
    
    logger.info(f"Comment created by {user.name} on recipe {comment_data.recipe_id} in {language}")
    
    return comment

@api_router.put("/comments/{comment_id}", response_model=Comment)
async def update_comment(
    comment_id: str,
    comment_data: CommentUpdate,
    user: User = Depends(require_role(["pro", "editor", "admin"], db))
):
    """Update own comment"""
    # Find comment
    existing = await db.recipe_comments.find_one({"id": comment_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check ownership
    if existing['user_id'] != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit this comment")
    
    # Update comment
    updated_at = datetime.now(timezone.utc)
    await db.recipe_comments.update_one(
        {"id": comment_id},
        {"$set": {
            "comment": comment_data.comment.strip(),
            "updated_at": updated_at.isoformat()
        }}
    )
    
    # Return updated comment
    updated = await db.recipe_comments.find_one({"id": comment_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return Comment(**updated)

@api_router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    user: User = Depends(require_role(["pro", "editor", "admin"], db))
):
    """Delete own comment"""
    # Find comment
    existing = await db.recipe_comments.find_one({"id": comment_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check ownership (admin can delete any)
    if existing['user_id'] != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    # Delete comment
    await db.recipe_comments.delete_one({"id": comment_id})
    
    logger.info(f"Comment {comment_id} deleted by {user.name}")
    
    return {"message": "Comment deleted"}

@api_router.post("/comments/{comment_id}/like")
async def toggle_comment_like(
    comment_id: str,
    user: User = Depends(require_role(["pro", "editor", "admin"], db))
):
    """Toggle like on a comment"""
    # Find comment
    comment = await db.recipe_comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    liked_by = comment.get('liked_by', [])
    
    if user.id in liked_by:
        # Unlike
        liked_by.remove(user.id)
        action = "unliked"
    else:
        # Like
        liked_by.append(user.id)
        action = "liked"
    
    # Update in database
    await db.recipe_comments.update_one(
        {"id": comment_id},
        {"$set": {
            "liked_by": liked_by,
            "likes": len(liked_by)
        }}
    )
    
    return {"message": f"Comment {action}", "likes": len(liked_by)}

@api_router.put("/comments/{comment_id}/hide")
async def hide_comment(
    comment_id: str,
    user: User = Depends(require_role(["admin"], db))
):
    """Admin: Hide a comment"""
    # Find comment
    comment = await db.recipe_comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Toggle status
    new_status = "hidden" if comment.get('status') == "visible" else "visible"
    
    await db.recipe_comments.update_one(
        {"id": comment_id},
        {"$set": {"status": new_status}}
    )
    
    logger.info(f"Comment {comment_id} set to {new_status} by admin {user.name}")
    
    return {"message": f"Comment {new_status}"}

# ==================== TIPS & TRICKS ====================

@api_router.get("/tips")
async def get_tips(
    category: Optional[str] = None,
    language: Optional[str] = None,
    country: Optional[str] = None,
    show_international: bool = True,
    user: Optional[User] = Depends(get_current_user_with_db)
):
    """Get all approved tips with optional filters"""
    query = {"is_public": True, "approval_status": "approved"}
    
    if category:
        query["category"] = category
    
    # Language and country filtering
    if user and hasattr(user, 'country') and user.country:
        user_country = user.country
        user_lang_map = {'DK': 'da', 'DE': 'de', 'FR': 'fr', 'GB': 'en', 'US': 'en-US'}
        user_lang = user_lang_map.get(user_country, 'da')
        
        if show_international:
            # Show tips from user's country OR international tips
            query["$or"] = [
                {"country": user_country, "language": user_lang},
                {"is_international": True}
            ]
        else:
            # Only user's country tips
            query["country"] = user_country
            query["language"] = user_lang
    elif language and country:
        # Manual filter
        query["country"] = country
        query["language"] = language
    # else: show all approved tips (no country filter)
    
    tips = await db.tips_and_tricks.find(query, {"_id": 0}).to_list(10000)
    
    # Parse dates
    for tip in tips:
        if isinstance(tip.get('created_at'), str):
            tip['created_at'] = datetime.fromisoformat(tip['created_at'])
        if isinstance(tip.get('updated_at'), str):
            tip['updated_at'] = datetime.fromisoformat(tip['updated_at'])
    
    # Sort by likes (most liked first), then by newest
    tips.sort(key=lambda x: (-x.get('likes', 0), -x['created_at'].timestamp()))
    
    return tips

@api_router.post("/tips", response_model=Tip)
async def create_tip(
    tip_data: TipCreate,
    user: User = Depends(require_role(["pro", "family", "editor", "admin"], db))
):
    """Create a new tip (PRO and Family users only)"""
    # Auto-detect language and country from user
    country_to_lang = {'DK': 'da', 'DE': 'de', 'FR': 'fr', 'GB': 'en', 'US': 'en-US'}
    user_country = getattr(user, 'country', 'DK')  # Default to DK if country not set
    language = country_to_lang.get(user_country, 'da')
    
    # Create tip - automatically public (no approval needed)
    tip = Tip(
        title=tip_data.title.strip(),
        content=tip_data.content.strip(),
        category=tip_data.category,
        language=language,
        country=user_country,
        is_international=tip_data.is_international,
        created_by=user.id,
        creator_name=user.name,
        is_public=True,  # Automatically public
        approval_status="approved"  # Automatically approved
    )
    
    # Save to database
    doc = tip.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.tips_and_tricks.insert_one(doc)
    
    logger.info(f"Tip created by {user.name}: {tip.title}")
    
    return tip

@api_router.post("/tips/{tip_id}/upload-image")
async def upload_tip_image(
    tip_id: str,
    file: UploadFile = File(...),
    user: User = Depends(require_role(["pro", "family", "editor", "admin"], db))
):
    """Upload and compress image for a tip (max 80KB)"""
    # Find tip
    tip = await db.tips_and_tricks.find_one({"id": tip_id})
    if not tip:
        raise HTTPException(status_code=404, detail="Tip not found")
    
    # Check ownership (admin can edit any)
    if tip['created_by'] != user.id and user.role not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this tip")
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if necessary (for PNG with transparency)
        if image.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        
        # Compress image iteratively until under 80KB
        max_size = 80 * 1024  # 80KB
        quality = 95
        output = io.BytesIO()
        
        # Start with reasonable dimensions
        max_dimension = 1200
        if image.width > max_dimension or image.height > max_dimension:
            image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
        
        # Iteratively reduce quality until under 80KB
        while quality > 10:
            output.seek(0)
            output.truncate()
            image.save(output, format='JPEG', quality=quality, optimize=True)
            size = output.tell()
            
            if size <= max_size:
                break
            
            # Reduce quality or dimensions
            if quality > 50:
                quality -= 5
            else:
                # If quality is already low, reduce dimensions
                new_size = (int(image.width * 0.9), int(image.height * 0.9))
                image = image.resize(new_size, Image.Resampling.LANCZOS)
                quality = 85  # Reset quality after resize
        
        # Save to file
        tips_upload_dir = ROOT_DIR / 'uploads' / 'tips'
        tips_upload_dir.mkdir(parents=True, exist_ok=True)
        
        filename = f"{tip_id}_{uuid.uuid4().hex[:8]}.jpg"
        filepath = tips_upload_dir / filename
        
        with open(filepath, 'wb') as f:
            f.write(output.getvalue())
        
        # Update tip with image URL
        image_url = f"/uploads/tips/{filename}"
        await db.tips_and_tricks.update_one(
            {"id": tip_id},
            {"$set": {"image_url": image_url}}
        )
        
        logger.info(f"Image uploaded for tip {tip_id}: {filename} ({size} bytes)")
        
        return {"message": "Image uploaded", "image_url": image_url, "size": size}
    
    except Exception as e:
        logger.error(f"Error uploading image: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@api_router.put("/tips/{tip_id}", response_model=Tip)
async def update_tip(
    tip_id: str,
    tip_data: TipUpdate,
    user: User = Depends(require_role(["pro", "family", "editor", "admin"], db))
):
    """Update own tip (or admin can edit any)"""
    # Find tip
    existing = await db.tips_and_tricks.find_one({"id": tip_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Tip not found")
    
    # Check ownership (admin can edit any)
    if existing['created_by'] != user.id and user.role not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this tip")
    
    # Prepare update
    update_data = {}
    if tip_data.title:
        update_data["title"] = tip_data.title.strip()
    if tip_data.content:
        update_data["content"] = tip_data.content.strip()
    if tip_data.category:
        update_data["category"] = tip_data.category
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Update in database
    await db.tips_and_tricks.update_one({"id": tip_id}, {"$set": update_data})
    
    # Return updated tip
    updated = await db.tips_and_tricks.find_one({"id": tip_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return Tip(**updated)

@api_router.delete("/tips/{tip_id}")
async def delete_tip(
    tip_id: str,
    user: User = Depends(require_role(["pro", "family", "editor", "admin"], db))
):
    """Delete own tip (or admin can delete any)"""
    # Find tip
    existing = await db.tips_and_tricks.find_one({"id": tip_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Tip not found")
    
    # Check ownership (admin can delete any)
    if existing['created_by'] != user.id and user.role not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this tip")
    
    # Delete tip
    await db.tips_and_tricks.delete_one({"id": tip_id})
    
    logger.info(f"Tip {tip_id} deleted by {user.name}")
    
    return {"message": "Tip deleted"}

@api_router.post("/tips/{tip_id}/like")
async def toggle_tip_like(
    tip_id: str,
    user: User = Depends(require_role(["pro", "family", "editor", "admin"], db))
):
    """Toggle like on a tip (PRO and Family users only)"""
    # Find tip
    tip = await db.tips_and_tricks.find_one({"id": tip_id})
    if not tip:
        raise HTTPException(status_code=404, detail="Tip not found")
    
    liked_by = tip.get('liked_by', [])
    
    if user.id in liked_by:
        # Unlike
        liked_by.remove(user.id)
        action = "unliked"
    else:
        # Like
        liked_by.append(user.id)
        action = "liked"
    
    # Update in database
    await db.tips_and_tricks.update_one(
        {"id": tip_id},
        {"$set": {
            "liked_by": liked_by,
            "likes": len(liked_by)
        }}
    )
    
    return {"message": f"Tip {action}", "likes": len(liked_by)}

@api_router.get("/admin/tips/pending")
async def get_pending_tips(
    user: User = Depends(require_role(["admin", "editor"], db))
):
    """Admin: Get all pending tips"""
    tips = await db.tips_and_tricks.find(
        {"approval_status": "pending"},
        {"_id": 0}
    ).to_list(10000)
    
    # Parse dates
    for tip in tips:
        if isinstance(tip.get('created_at'), str):
            tip['created_at'] = datetime.fromisoformat(tip['created_at'])
        if isinstance(tip.get('updated_at'), str):
            tip['updated_at'] = datetime.fromisoformat(tip['updated_at'])
    
    # Sort by newest first
    tips.sort(key=lambda x: -x['created_at'].timestamp())
    
    return tips

@api_router.get("/admin/tips/all")
async def get_all_tips_admin(
    user: User = Depends(require_role(["admin", "editor"], db)),
    status: Optional[str] = None
):
    """Admin: Get all tips with optional status filter"""
    query = {}
    if status:
        query["approval_status"] = status
    
    tips = await db.tips_and_tricks.find(query, {"_id": 0}).to_list(10000)
    
    # Parse dates
    for tip in tips:
        if isinstance(tip.get('created_at'), str):
            tip['created_at'] = datetime.fromisoformat(tip['created_at'])
        if isinstance(tip.get('updated_at'), str):
            tip['updated_at'] = datetime.fromisoformat(tip['updated_at'])
    
    # Sort by newest first
    tips.sort(key=lambda x: -x['created_at'].timestamp())
    
    return tips

@api_router.put("/admin/tips/{tip_id}/approve")
async def approve_tip(
    tip_id: str,
    user: User = Depends(require_role(["admin", "editor"], db))
):
    """Admin: Approve a tip"""
    tip = await db.tips_and_tricks.find_one({"id": tip_id})
    if not tip:
        raise HTTPException(status_code=404, detail="Tip not found")
    
    await db.tips_and_tricks.update_one(
        {"id": tip_id},
        {"$set": {
            "approval_status": "approved",
            "is_public": True,
            "rejection_reason": None
        }}
    )
    
    logger.info(f"Tip {tip_id} approved by {user.name}")
    
    return {"message": "Tip approved"}

@api_router.put("/admin/tips/{tip_id}/reject")
async def reject_tip(
    tip_id: str,
    reason: Optional[str] = None,
    user: User = Depends(require_role(["admin", "editor"], db))
):
    """Admin: Reject a tip"""
    tip = await db.tips_and_tricks.find_one({"id": tip_id})
    if not tip:
        raise HTTPException(status_code=404, detail="Tip not found")
    
    await db.tips_and_tricks.update_one(
        {"id": tip_id},
        {"$set": {
            "approval_status": "rejected",
            "is_public": False,
            "rejection_reason": reason
        }}
    )
    
    logger.info(f"Tip {tip_id} rejected by {user.name}")
    
    return {"message": "Tip rejected"}

# Tip Comments (Community Forum Features)
@api_router.get("/tips/{tip_id}/comments")
async def get_tip_comments(tip_id: str):
    """Get all comments for a tip"""
    comments = await db.tip_comments.find(
        {"tip_id": tip_id},
        {"_id": 0}
    ).to_list(1000)
    
    # Parse dates
    for comment in comments:
        if isinstance(comment.get('created_at'), str):
            comment['created_at'] = datetime.fromisoformat(comment['created_at'])
        if isinstance(comment.get('updated_at'), str):
            comment['updated_at'] = datetime.fromisoformat(comment['updated_at'])
    
    # Sort by oldest first (chronological order)
    comments.sort(key=lambda x: x['created_at'].timestamp())
    
    return comments

@api_router.post("/tips/{tip_id}/comments")
async def create_tip_comment(
    tip_id: str,
    content: str = Body(..., embed=True),
    user: User = Depends(require_role(["pro", "family", "editor", "admin"], db))
):
    """Create a comment/reply on a tip"""
    # Find tip to verify it exists
    tip = await db.tips_and_tricks.find_one({"id": tip_id})
    if not tip:
        raise HTTPException(status_code=404, detail="Tip not found")
    
    # Create comment
    comment = {
        "id": str(uuid.uuid4()),
        "tip_id": tip_id,
        "user_id": user.id,
        "user_name": user.name,
        "content": content.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": None
    }
    
    await db.tip_comments.insert_one(comment)
    
    logger.info(f"Comment created on tip {tip_id} by {user.name}")
    
    # Return comment with parsed date
    comment['created_at'] = datetime.fromisoformat(comment['created_at'])
    comment.pop('_id', None)
    
    return comment

@api_router.delete("/tips/{tip_id}/comments/{comment_id}")
async def delete_tip_comment(
    tip_id: str,
    comment_id: str,
    user: User = Depends(require_role(["pro", "family", "editor", "admin"], db))
):
    """Delete a comment (own comment or admin can delete any)"""
    # Find comment
    comment = await db.tip_comments.find_one({"id": comment_id, "tip_id": tip_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check permissions (owner or admin)
    if comment['user_id'] != user.id and user.role not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    # Delete comment
    await db.tip_comments.delete_one({"id": comment_id})
    
    logger.info(f"Comment {comment_id} deleted by {user.name}")
    
    return {"message": "Comment deleted"}

# Shopping List
@api_router.get("/shopping-list/{session_id}")
async def get_shopping_list(
    session_id: str,
    user: Optional[User] = Depends(get_current_user_with_db)
):
    # Only pro users can have shopping lists - return empty for guests
    if not user or user.role == "guest":
        return []
    
    items = await db.shopping_list.find({"session_id": session_id}, {"_id": 0}).to_list(1000)
    
    for item in items:
        if isinstance(item.get('added_at'), str):
            item['added_at'] = datetime.fromisoformat(item['added_at'])
    
    return items

@api_router.post("/shopping-list", response_model=ShoppingListItem)
async def add_shopping_list_item(
    item_data: ShoppingListItemCreate,
    user: User = Depends(require_role(["pro", "editor", "admin"], db))
):
    # Filter out water-related items (they're assumed to always be available)
    water_items = ['vand', 'isvand', 'knust is', 'istern', 'isterninger', 'vand/knust is']
    ingredient_lower = item_data.ingredient_name.lower().strip()
    
    # Also check if ingredient contains any water-related terms
    should_skip = ingredient_lower in water_items or any(water_term in ingredient_lower for water_term in ['vand', 'knust is'])
    
    if should_skip:
        # Silently skip water items - return a dummy response
        # Frontend won't know it was skipped
        return ShoppingListItem(
            id=str(uuid.uuid4()),
            session_id=item_data.session_id,
            ingredient_name=item_data.ingredient_name,
            category_key=item_data.category_key,
            quantity=item_data.quantity,
            unit=item_data.unit,
            linked_recipe_id=item_data.linked_recipe_id,
            linked_recipe_name=item_data.linked_recipe_name,
            checked=False,
            added_at=datetime.now(timezone.utc)
        )
    
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
        existing['quantity'] = new_qty
        return ShoppingListItem(**existing)
    
    # Create new item
    item = ShoppingListItem(
        id=str(uuid.uuid4()),
        session_id=item_data.session_id,
        ingredient_name=item_data.ingredient_name,
        category_key=item_data.category_key,
        quantity=item_data.quantity,
        unit=item_data.unit,
        linked_recipe_id=item_data.linked_recipe_id,
        linked_recipe_name=item_data.linked_recipe_name,
        checked=False,
        added_at=datetime.now(timezone.utc)
    )
    
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
async def upload_image(file: UploadFile = File(...), folder: str = "recipes"):
    """Upload image to Cloudinary cloud storage
    
    Args:
        file: The image file to upload
        folder: Cloudinary subfolder (recipes, advertisements, etc.)
    """
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Only images allowed")
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Validate file size (5MB limit)
        MAX_FILE_SIZE = 5 * 1024 * 1024
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / 1024 / 1024}MB"
            )
        
        # Upload to Cloudinary with dynamic folder
        result = cloudinary.uploader.upload(
            file_content,
            folder=f"slushbook/{folder}",  # Organize in subfolders
            resource_type="auto",  # Auto-detect image type
            quality="auto",  # Optimize quality
        )
        
        return {
            "url": result.get("secure_url"),  # HTTPS URL
            "image_url": result.get("secure_url"),  # For backwards compatibility
            "public_id": result.get("public_id"),  # For future deletion
            "width": result.get("width"),
            "height": result.get("height"),
            "format": result.get("format"),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload image: {str(e)}"
        )

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

# CSV Import for Admin
import csv
import io

@api_router.post("/admin/import-csv")
async def import_recipe_from_csv(file: UploadFile = File(...)):
    """
    Import recipe from CSV file (Admin only)
    CSV format: Navn,Beskrivelse,Type,Farve,Brix,Volumen,Alkohol,Tags,Ingredienser,Fremgangsmåde
    Ingredienser format: Navn:Mængde:Enhed:Brix:Rolle (separated by ;)
    Fremgangsmåde format: Step 1|Step 2|Step 3
    """
    try:
        # Read CSV file
        contents = await file.read()
        csv_text = contents.decode('utf-8')
        
        # Parse CSV
        csv_reader = csv.DictReader(io.StringIO(csv_text))
        recipes_preview = []
        
        for row in csv_reader:
            # Parse ingredients
            ingredients = []
            if row.get('Ingredienser'):
                for ing_str in row['Ingredienser'].split(';'):
                    parts = ing_str.strip().split(':')
                    if len(parts) >= 4:
                        # Generate category_key from ingredient name
                        ingredient_name = parts[0]
                        category_key = ingredient_name.lower().replace('æ', 'ae').replace('ø', 'oe').replace('å', 'aa')
                        # Remove special characters except alphanumeric and spaces
                        category_key = ''.join(c if c.isalnum() else ' ' for c in category_key)
                        # Replace multiple spaces with single space, then convert spaces to hyphens
                        import re
                        category_key = re.sub(r'\s+', '-', category_key.strip())
                        
                        ingredient = {
                            'name': ingredient_name,
                            'quantity': float(parts[1]),
                            'unit': parts[2],
                            'brix': float(parts[3]) if parts[3] else None,
                            'role': parts[4].lower() if len(parts) > 4 else 'required',
                            'category_key': category_key
                        }
                        ingredients.append(ingredient)
            
            # Parse steps
            steps = []
            if row.get('Fremgangsmåde'):
                steps = [s.strip() for s in row['Fremgangsmåde'].split('|') if s.strip()]
            
            # Parse tags
            tags = []
            if row.get('Tags'):
                tags = [t.strip() for t in row['Tags'].split(';') if t.strip()]
            
            # Create recipe preview
            recipe_preview = {
                'name': row.get('Navn', ''),
                'description': row.get('Beskrivelse', ''),
                'type': row.get('Type', 'klassisk').lower(),
                'color': row.get('Farve', 'red').lower(),
                'target_brix': float(row.get('Brix', 14.0)),
                'base_volume_ml': int(row.get('Volumen', 1000)),
                'alcohol_flag': row.get('Alkohol', 'Nej').lower() in ['ja', 'yes', 'true', '1'],
                'tags': tags,
                'ingredients': ingredients,
                'steps': steps,
                'image_url': '/api/images/placeholder.jpg',
                'author': 'system',
                'author_name': 'SLUSHBOOK'
            }
            
            recipes_preview.append(recipe_preview)
        
        return {
            'success': True,
            'count': len(recipes_preview),
            'recipes': recipes_preview
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV parsing error: {str(e)}")

@api_router.post("/admin/confirm-import")
async def confirm_recipe_import(recipes: List[dict], request: Request):
    """
    Confirm and create recipes from CSV import (Admin only)
    Creates recipes under admin's account as approved but private
    """
    try:
        # Get admin user
        user = await get_current_user(request, None, db)
        if not user or user.role != "admin":
            raise HTTPException(status_code=403, detail="Admin only")
        
        created_count = 0
        updated_count = 0
        
        for recipe_data in recipes:
            recipe_name = recipe_data.get('name', '')
            
            # Check if recipe already exists (by name and author)
            existing = await db.user_recipes.find_one({
                "name": recipe_name,
                "author": user.id
            })
            
            if existing:
                # UPDATE existing recipe
                recipe_id = existing['id']
                
                # Preserve some fields from existing
                recipe_data['id'] = recipe_id
                recipe_data['created_at'] = existing.get('created_at', datetime.now(timezone.utc))
                recipe_data['rating_avg'] = existing.get('rating_avg', 0.0)
                recipe_data['rating_count'] = existing.get('rating_count', 0)
                recipe_data['view_count'] = existing.get('view_count', 0)
                recipe_data['image_url'] = existing.get('image_url')  # Keep existing image
                
                # Update other fields
                recipe_data['is_free'] = recipe_data.get('is_free', False)
                recipe_data['is_published'] = existing.get('is_published', False)  # Keep publish status
                recipe_data['author'] = user.id
                recipe_data['author_name'] = user.name
                recipe_data['status'] = 'approved'
                
                await db.user_recipes.replace_one(
                    {"id": recipe_id},
                    recipe_data
                )
                updated_count += 1
                logger.info(f"Updated existing recipe: {recipe_name}")
            else:
                # INSERT new recipe
                recipe_data['id'] = str(uuid.uuid4())
                recipe_data['created_at'] = datetime.now(timezone.utc)
                recipe_data['rating_avg'] = 0.0
                recipe_data['rating_count'] = 0
                recipe_data['view_count'] = 0
                recipe_data['is_free'] = False
                recipe_data['is_published'] = False
                recipe_data['author'] = user.id
                recipe_data['author_name'] = user.name
                recipe_data['status'] = 'approved'
                
                await db.user_recipes.insert_one(recipe_data)
                created_count += 1
                logger.info(f"Created new recipe: {recipe_name}")
        
        return {
            'success': True,
            'message': f'Import complete: {created_count} created, {updated_count} updated',
            'count': created_count + updated_count,
            'created': created_count,
            'updated': updated_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import error: {str(e)}")


@api_router.get("/admin/export-recipes-csv")
async def export_recipes_csv(request: Request):
    """Export all recipes to CSV format"""
    user = await get_current_user(request, None, db)
    
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        import io
        
        # Get all recipes
        recipes = await db.recipes.find({}, {"_id": 0}).to_list(length=None)
        user_recipes = await db.user_recipes.find({}, {"_id": 0}).to_list(length=None)
        
        all_recipes = recipes + user_recipes
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['Navn', 'Beskrivelse', 'Type', 'Farve', 'Brix', 'Volumen', 'Alkohol', 'Tags', 'Ingredienser', 'Fremgangsmåde', 'Is_Free', 'Is_Published', 'Author'])
        
        for recipe in all_recipes:
            # Format ingredients: Navn:Mængde:Enhed:Brix:Rolle (separated by ;)
            ingredients_list = []
            for ing in recipe.get('ingredients', []):
                ing_str = f"{ing.get('name', '')}:{ing.get('quantity', '')}:{ing.get('unit', '')}:{ing.get('brix', '')}:{ing.get('role', 'required')}"
                ingredients_list.append(ing_str)
            ingredients_str = ";".join(ingredients_list)
            
            # Format steps: Step 1|Step 2|Step 3
            steps = recipe.get('steps', [])
            steps_str = "|".join(steps) if steps else ""
            
            # Tags as comma-separated
            tags = recipe.get('tags', [])
            tags_str = ",".join(tags) if tags else ""
            
            writer.writerow([
                recipe.get('name', ''),
                recipe.get('description', ''),
                recipe.get('type', ''),
                recipe.get('color', ''),
                recipe.get('target_brix', ''),  # Correct field name
                recipe.get('base_volume_ml', ''),  # Correct field name
                'Ja' if recipe.get('alcohol_flag', False) else 'Nej',  # Convert boolean to Ja/Nej
                tags_str,
                ingredients_str,
                steps_str,
                recipe.get('is_free', False),
                recipe.get('is_published', False),
                recipe.get('author', 'system')
            ])
        
        csv_content = output.getvalue()
        output.close()
        
        # Add UTF-8 BOM for Excel/Numbers compatibility
        csv_content_with_bom = '\ufeff' + csv_content
        
        return Response(
            content=csv_content_with_bom.encode('utf-8'),
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": "attachment; filename=slushice-recipes.csv"
            }
        )
    except Exception as e:
        logger.error(f"Error exporting recipes CSV: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ===== RECIPE APPROVAL ADMIN ENDPOINTS =====

@api_router.get("/admin/pending-recipes")
async def get_pending_recipes(request: Request):
    """Get ALL user-submitted recipes for admin review (excluding hidden)"""
    user = await get_current_user(request, None, db)
    
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Get ALL user recipes that are not hidden from sandbox
    cursor = db.user_recipes.find(
        {"hidden_from_sandbox": {"$ne": True}},
        {"_id": 0}
    )
    recipes = await cursor.to_list(length=None)
    
    # Parse datetime fields
    for recipe in recipes:
        if isinstance(recipe.get('created_at'), str):
            recipe['created_at'] = datetime.fromisoformat(recipe['created_at'])
    
    return recipes

@api_router.patch("/admin/recipes/{recipe_id}/toggle-free")
async def toggle_recipe_free_status(recipe_id: str, request: Request):
    """Toggle free/pro status for a recipe (admin only)"""
    user = await get_current_user(request, None, db)
    
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Check both system recipes and user recipes
    recipe = await db.recipes.find_one({"id": recipe_id})
    collection_name = "recipes"
    
    if not recipe:
        recipe = await db.user_recipes.find_one({"id": recipe_id})
        collection_name = "user_recipes"
    
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    # Toggle is_free status
    new_free_status = not recipe.get('is_free', False)
    
    # Update in the correct collection
    collection = db.recipes if collection_name == "recipes" else db.user_recipes
    result = await collection.update_one(
        {"id": recipe_id},
        {"$set": {"is_free": new_free_status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    return {
        "success": True,
        "message": f"Opskrift er nu {'gratis for gæster' if new_free_status else 'kun for pro brugere'}",
        "is_free": new_free_status
    }

@api_router.post("/admin/approve-recipe/{recipe_id}")
async def approve_recipe(recipe_id: str, request: Request):
    """Approve a pending recipe"""
    user = await get_current_user(request, None, db)
    
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Update recipe status
    result = await db.user_recipes.update_one(
        {"id": recipe_id},
        {"$set": {
            "approval_status": "approved",
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "rejection_reason": None
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    return {"success": True, "message": "Opskrift godkendt"}

@api_router.post("/admin/bulk-approve-pending")
async def bulk_approve_pending(request: Request):
    """EMERGENCY: Approve all pending recipes at once (for fixing stuck statuses)"""
    user = await get_current_user(request, None, db)
    
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Check both user_recipes AND recipes collections
    user_recipes_pending = await db.user_recipes.count_documents({"approval_status": "pending"})
    system_recipes_pending = await db.recipes.count_documents({"approval_status": "pending"})
    total_pending = user_recipes_pending + system_recipes_pending
    
    if total_pending == 0:
        return {"success": True, "message": "No pending recipes to approve", "count": 0}
    
    # Update user_recipes
    result1 = await db.user_recipes.update_many(
        {"approval_status": "pending"},
        {
            "$set": {
                "approval_status": "approved",
                "approved_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Update system recipes
    result2 = await db.recipes.update_many(
        {"approval_status": "pending"},
        {
            "$set": {
                "approval_status": "approved",
                "approved_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    total_updated = result1.modified_count + result2.modified_count
    
    return {
        "success": True, 
        "message": f"Godkendt {total_updated} opskrifter (user: {result1.modified_count}, system: {result2.modified_count})", 
        "count": total_updated
    }

@api_router.post("/admin/reject-recipe/{recipe_id}")
async def reject_recipe(recipe_id: str, request: Request):
    """Reject a pending recipe with reason"""
    user = await get_current_user(request, None, db)
    
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Get reason from body
    body = await request.json()
    reason = body.get('reason', 'Ingen grund angivet')
    
    # Update recipe status
    result = await db.user_recipes.update_one(
        {"id": recipe_id},
        {"$set": {
            "approval_status": "rejected",
            "rejection_reason": reason,
            "is_published": False  # Ensure rejected recipes are private
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    return {"success": True, "message": "Opskrift afvist"}

@api_router.post("/admin/hide-from-sandbox/{recipe_id}")
async def hide_from_sandbox(recipe_id: str, request: Request):
    """Hide approved/rejected recipe from sandbox view"""
    user = await get_current_user(request, None, db)
    
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Add hidden_from_sandbox flag
    result = await db.user_recipes.update_one(
        {"id": recipe_id},
        {"$set": {"hidden_from_sandbox": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    return {"success": True, "message": "Opskrift fjernet fra sandkasse"}

@api_router.get("/admin/find-similar/{recipe_id}")
async def find_similar_recipes(recipe_id: str, request: Request):
    """Find similar recipes based on name and ingredients"""
    user = await get_current_user(request, None, db)
    
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Get the recipe
    recipe = await db.user_recipes.find_one({"id": recipe_id})
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    recipe_name = recipe['name'].lower()
    recipe_ingredients = [ing['name'].lower() for ing in recipe.get('ingredients', [])]
    
    # Find similar recipes in both collections
    similar = []
    
    # Search in user recipes
    user_recipes = await db.user_recipes.find({
        "id": {"$ne": recipe_id}
    }).to_list(length=None)
    
    for r in user_recipes:
        r_name = r['name'].lower()
        r_ingredients = [ing['name'].lower() for ing in r.get('ingredients', [])]
        
        # Check name similarity
        name_match = recipe_name in r_name or r_name in recipe_name
        
        # Check ingredient overlap
        common_ingredients = set(recipe_ingredients) & set(r_ingredients)
        ingredient_match = len(common_ingredients) >= 3
        
        if name_match or ingredient_match:
            similar.append({
                "id": r['id'],
                "name": r['name'],
                "author_name": r.get('author_name', 'Unknown'),
                "match_reason": "Navn lignende" if name_match else f"{len(common_ingredients)} fælles ingredienser"
            })
    
    # Search in system recipes
    system_recipes = await db.recipes.find({}).to_list(length=None)
    
    for r in system_recipes:
        r_name = r['name'].lower()
        r_ingredients = [ing['name'].lower() for ing in r.get('ingredients', [])]
        
        name_match = recipe_name in r_name or r_name in recipe_name
        common_ingredients = set(recipe_ingredients) & set(r_ingredients)
        ingredient_match = len(common_ingredients) >= 3
        
        if name_match or ingredient_match:
            similar.append({
                "id": r['id'],
                "name": r['name'],
                "author_name": "SLUSHBOOK (system)",
                "match_reason": "Navn lignende" if name_match else f"{len(common_ingredients)} fælles ingredienser"
            })
    
    return similar

# ===== ADMIN INGREDIENTS MANAGEMENT =====

@api_router.get("/admin/ingredients")
async def get_all_ingredients(request: Request):
    """Get all master ingredients for admin"""
    user = await get_current_user(request, None, db)
    
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Get all master ingredients
    ingredients = await db.master_ingredients.find({}, {"_id": 0}).to_list(length=None)
    return ingredients

@api_router.post("/admin/ingredients")
async def create_ingredient(ingredient: dict, request: Request):
    """Create a new master ingredient"""
    user = await get_current_user(request, None, db)
    
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Check if ingredient already exists
    existing = await db.master_ingredients.find_one({"name": ingredient['name']})
    if existing:
        raise HTTPException(status_code=400, detail="Ingrediens findes allerede")
    
    # Add ID and created timestamp
    ingredient['id'] = str(uuid.uuid4())
    ingredient['created_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.master_ingredients.insert_one(ingredient)
    return {"success": True, "ingredient": ingredient}

@api_router.put("/admin/ingredients/{ingredient_id}")
async def update_ingredient(ingredient_id: str, ingredient: dict, request: Request):
    """Update a master ingredient"""
    user = await get_current_user(request, None, db)
    
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    result = await db.master_ingredients.update_one(
        {"id": ingredient_id},
        {"$set": ingredient}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Ingrediens ikke fundet")
    
    return {"success": True, "message": "Ingrediens opdateret"}

@api_router.delete("/admin/ingredients/{ingredient_id}")
async def delete_ingredient(ingredient_id: str, request: Request):
    """Delete a master ingredient"""
    user = await get_current_user(request, None, db)
    
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    result = await db.master_ingredients.delete_one({"id": ingredient_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ingrediens ikke fundet")
    
    return {"success": True, "message": "Ingrediens slettet"}

@api_router.post("/admin/ingredients/seed")
async def seed_ingredients(request: Request):
    """Seed default ingredients"""
    user = await get_current_user(request, None, db)
    
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    default_ingredients = [
        {"name": "Jordbær sirup", "category": "Sirup", "default_brix": 65},
        {"name": "Citron sirup", "category": "Sirup", "default_brix": 65},
        {"name": "Blå curaçao", "category": "Sirup", "default_brix": 65},
        {"name": "Hindbær sirup", "category": "Sirup", "default_brix": 65},
        {"name": "Vanilje sirup", "category": "Sirup", "default_brix": 65},
        {"name": "Karamel sirup", "category": "Sirup", "default_brix": 65},
        {"name": "Power", "category": "Energidrik", "default_brix": 11},
        {"name": "Sodastream", "category": "Sodavand", "default_brix": 10},
        {"name": "Coca Cola", "category": "Sodavand", "default_brix": 11},
        {"name": "Sprite", "category": "Sodavand", "default_brix": 9},
        {"name": "Fanta", "category": "Sodavand", "default_brix": 12},
        {"name": "Appelsin juice", "category": "Juice", "default_brix": 11},
        {"name": "Æble juice", "category": "Juice", "default_brix": 11},
        {"name": "Ananas juice", "category": "Juice", "default_brix": 13},
        {"name": "Mango juice", "category": "Juice", "default_brix": 14},
        {"name": "Vodka", "category": "Alkohol", "default_brix": 0},
        {"name": "Rom", "category": "Alkohol", "default_brix": 0},
        {"name": "Tequila", "category": "Alkohol", "default_brix": 0},
        {"name": "Is", "category": "Basis", "default_brix": 0},
        {"name": "Vand", "category": "Basis", "default_brix": 0},
    ]
    
    created = 0
    for ing in default_ingredients:
        # Check if exists
        existing = await db.master_ingredients.find_one({"name": ing['name']})
        if not existing:
            ing['id'] = str(uuid.uuid4())
            ing['created_at'] = datetime.now(timezone.utc).isoformat()
            await db.master_ingredients.insert_one(ing)
            created += 1
    
    return {"success": True, "message": f"Oprettet {created} ingredienser", "count": created}

# NOTE: Redirect service proxy removed - now using direct FastAPI routes in redirect_routes.py
# All redirect functionality is now handled by /api/admin/* and /api/go/* endpoints


# ==========================================
# ADVERTISEMENT ENDPOINTS
# ==========================================

@api_router.get("/ads")
async def get_ads(country: Optional[str] = None, placement: Optional[str] = None):
    """Get active ads for guests, optionally filtered by country and placement"""
    query = {"active": True}
    
    if country:
        query["country"] = country
    if placement:
        query["placement"] = placement
    
    ads = await db.ads.find(query).to_list(length=None)
    
    # Convert ObjectId to string and increment impressions
    for ad in ads:
        ad["_id"] = str(ad["_id"])
        # Increment impression count
        await db.ads.update_one(
            {"id": ad["id"]},
            {"$inc": {"impressions": 1}}
        )
    
    return ads


@api_router.post("/ads/{ad_id}/click")
async def track_ad_click(ad_id: str):
    """Track ad click for analytics"""
    result = await db.ads.update_one(
        {"id": ad_id},
        {"$inc": {"clicks": 1}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Ad not found")
    
    return {"message": "Click tracked"}


@api_router.get("/admin/ads")
async def get_all_ads(request: Request):
    """Get all ads (admin only)"""
    user = await get_current_user(request, None, db)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Kun admin har adgang")
    
    ads = await db.ads.find({}).sort("created_at", -1).to_list(length=None)
    
    for ad in ads:
        ad["_id"] = str(ad["_id"])
    
    return ads


@api_router.post("/admin/ads")
async def create_ad(ad_data: AdCreate, request: Request):
    """Create new ad (admin only)"""
    user = await get_current_user(request, None, db)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Kun admin har adgang")
    
    ad = Advertisement(
        **ad_data.dict(),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    await db.ads.insert_one(ad.dict())
    
    return {"message": "Reklame oprettet", "id": ad.id}


@api_router.put("/admin/ads/{ad_id}")
async def update_ad(ad_id: str, ad_data: AdUpdate, request: Request):
    """Update ad (admin only)"""
    user = await get_current_user(request, None, db)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Kun admin har adgang")
    
    update_data = {k: v for k, v in ad_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.ads.update_one(
        {"id": ad_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Reklame ikke fundet")
    
    return {"message": "Reklame opdateret"}


@api_router.delete("/admin/ads/{ad_id}")
async def delete_ad(ad_id: str, request: Request):
    """Delete ad (admin only)"""
    user = await get_current_user(request, None, db)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Kun admin har adgang")
    
    result = await db.ads.delete_one({"id": ad_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reklame ikke fundet")
    
    return {"message": "Reklame slettet"}


# ==========================================
# GEOLOCATION & INTERNATIONALIZATION
# ==========================================

@api_router.get("/geolocation/detect")
async def detect_user_location(request: Request):
    """
    Detect user's country and language preference
    
    Uses:
    1. IP-based geolocation (primary)
    2. Browser Accept-Language header (fallback)
    
    Returns country code and suggested language
    """
    # Get user's IP address (handle proxy/load balancer scenarios)
    # Try X-Forwarded-For header first (for proxied requests)
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # X-Forwarded-For can contain multiple IPs, use the first one (original client)
        client_ip = forwarded_for.split(",")[0].strip()
    else:
        # Fallback to direct connection IP
        client_ip = request.client.host
    
    logger.info(f"[Geolocation] Detecting country for IP: {client_ip}")
    
    # Try IP-based detection first
    country_code = await geolocation_service.detect_country_from_ip(client_ip)
    
    # Fallback to browser language if IP detection failed
    if not country_code:
        accept_language = request.headers.get("accept-language", "")
        country_code = geolocation_service.parse_browser_language(accept_language)
    
    # Final fallback to Denmark
    if not country_code:
        country_code = "DK"
    
    # Get suggested language from country
    language_code = geolocation_service.get_language_from_country(country_code)
    
    return {
        "country_code": country_code,
        "language_code": language_code,
        "detection_method": "ip" if client_ip else "browser",
        "fallback_countries": geolocation_service.FALLBACK_COUNTRIES
    }

@api_router.post("/user/preferences")
async def update_user_preferences(
    request: Request,
    country_code: Optional[str] = None,
    language_code: Optional[str] = None
):
    """
    Update user's country and language preferences
    
    Saves to database if user is logged in
    """
    user = await get_current_user(request, None, db)
    
    body = await request.json()
    country_code = body.get("country_code")
    language_code = body.get("language_code")
    
    if user:
        # Update user preferences in database
        await db.users.update_one(
            {"id": user.id},
            {"$set": {
                "country_preference": country_code,
                "language_preference": language_code
            }}
        )
        
        return {"success": True, "message": "Preferences saved"}
    else:
        # For guests, return success (they'll use localStorage)
        return {"success": True, "message": "Preferences set (localStorage only)"}


# Set database for redirect routes
redirect_routes.set_db(db)

# Include routers
app.include_router(api_router)
app.include_router(redirect_routes.router)  # Admin routes: /api/admin/*
app.include_router(redirect_routes.go_router)  # Redirect routes: /api/go/*

# Mount uploads directory for static file serving under /api/uploads
uploads_dir = ROOT_DIR / 'uploads'
uploads_dir.mkdir(exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Logging configuration is done at the top of the file
# logger = logging.getLogger(__name__) - already defined at line 60

# Startup event
@app.on_event("startup")
async def startup_event():
    await seed_recipes()
    logger.info("SLUSHBOOK API started with integrated redirect service")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()