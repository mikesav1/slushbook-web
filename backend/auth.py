"""
Authentication module for SLUSHBOOK
Handles user authentication, role-based access control, and session management
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr, Field
import secrets
import os

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30  # Extended from 7 to 30 days

# Role hierarchy
ROLES = {
    "guest": 0,
    "pro": 1,
    "editor": 2,
    "admin": 3
}

# Models
class User(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str = "guest"  # guest, pro, editor, admin
    picture: Optional[str] = None
    created_at: datetime


class UserInDB(User):
    hashed_password: str


class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime


class PasswordReset(BaseModel):
    email: EmailStr
    reset_token: str
    expires_at: datetime
    created_at: datetime


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    country: str = "GB"  # Default to UK/English if not specified


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    device_id: Optional[str] = None
    device_name: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str


# Helper functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_session_token() -> str:
    return secrets.token_urlsafe(32)


def create_reset_token() -> str:
    return secrets.token_urlsafe(32)


# Auth dependency
security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db = None
) -> Optional[User]:
    """
    Get current authenticated user from session token
    Checks both cookie and Authorization header
    """
    session_token = None
    
    # Check cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token and credentials:
        session_token = credentials.credentials
    
    if not session_token:
        return None
    
    # Find session in database
    session = await db.user_sessions.find_one({
        "session_token": session_token,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })
    
    if not session:
        return None
    
    # Get user
    user_doc = await db.users.find_one({"id": session["user_id"]})
    if not user_doc:
        return None
    
    return User(**user_doc)


async def require_auth(user: Optional[User] = Depends(get_current_user)) -> User:
    """Require authentication"""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return user


def require_role(required_role: str):
    """Require specific role or higher"""
    async def role_checker(user: User = Depends(require_auth)) -> User:
        if ROLES.get(user.role, 0) < ROLES.get(required_role, 0):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {required_role} role"
            )
        return user
    return role_checker


def can_edit_recipe(user: Optional[User], recipe: dict) -> bool:
    """Check if user can edit a recipe"""
    if not user:
        return False
    
    # Admin can edit everything
    if user.role == "admin":
        return True
    
    # Editor can edit everything except system recipes
    if user.role == "editor" and recipe.get("author") != "system":
        return True
    
    # Pro users can edit their own recipes
    if user.role == "pro" and recipe.get("author") == user.id:
        return True
    
    return False


def can_view_recipe(user: Optional[User], recipe_count: int) -> bool:
    """Check if user can view more recipes (guest limit: 20)"""
    if not user:
        # Guest can see 20 recipes
        return recipe_count < 20
    
    # Authenticated users can see all
    return True


def can_create_recipe(user: Optional[User], user_recipe_count: int) -> bool:
    """Check if user can create recipe"""
    if not user:
        # Guest can create max 2 recipes
        return user_recipe_count < 2
    
    if user.role == "pro":
        # Pro can create unlimited
        return True
    
    if user.role in ["editor", "admin"]:
        # Editor and admin can create unlimited
        return True
    
    return False
