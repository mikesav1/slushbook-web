"""
Redirect Service Routes - Migrated from Node.js to FastAPI
Handles product link mappings, suppliers, and redirect functionality
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Header, Response, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import logging
import csv
import io
from urllib.parse import urlencode, urlparse, parse_qs
import httpx
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Import db from server.py (will be set when router is included)
db: AsyncIOMotorDatabase = None

def set_db(database: AsyncIOMotorDatabase):
    """Set database instance for this router"""
    global db
    db = database

router = APIRouter(prefix="/api/admin", tags=["redirect-service"])
go_router = APIRouter(prefix="/api/go", tags=["redirect"])

# ==========================================
# PYDANTIC MODELS
# ==========================================

class Mapping(BaseModel):
    id: str
    name: str
    ean: Optional[str] = None
    keywords: Optional[str] = None

class Option(BaseModel):
    id: str
    mappingId: str = Field(..., alias="mappingId")
    supplier: str
    title: str
    url: str
    status: str = "active"  # 'active' or 'inactive'
    priceLastSeen: Optional[float] = Field(None, alias="priceLastSeen")
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "opt_123",
                "mappingId": "product-name",
                "supplier": "bilka",
                "title": "Product Title",
                "url": "https://example.com/product",
                "status": "active"
            }
        }

class Supplier(BaseModel):
    id: str
    name: str
    url: str = ""
    active: int = 1
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Click(BaseModel):
    id: str
    mappingId: str = Field(..., alias="mappingId")
    ts: str
    userAgent: Optional[str] = Field(None, alias="userAgent")
    referer: Optional[str] = None

    class Config:
        populate_by_name = True

# Request/Response Models
class CreateMappingRequest(BaseModel):
    mapping: Mapping
    options: Optional[List[Option]] = []

class CreateOptionRequest(BaseModel):
    option: Option

class CreateSupplierRequest(BaseModel):
    name: str
    url: Optional[str] = ""

class UpdateSupplierRequest(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    active: Optional[bool] = None

class UpdateOptionRequest(BaseModel):
    status: Optional[str] = None
    url: Optional[str] = None
    priceLastSeen: Optional[float] = None

# ==========================================
# AUTH MIDDLEWARE
# ==========================================

ADMIN_TOKEN = "dev-token-change-in-production"

async def verify_admin_token(authorization: Optional[str] = Header(None)):
    """Verify admin token from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid admin token")
    
    return True

# ==========================================
# MAPPING ENDPOINTS
# ==========================================

@router.post("/mapping")
async def create_mapping(request: CreateMappingRequest, auth: bool = Depends(verify_admin_token)):
    """Create or update a mapping with optional options"""
    try:
        verify_admin_token()
        
        mapping_dict = request.mapping.model_dump()
        
        # Upsert mapping
        await db.redirect_mappings.update_one(
            {"id": mapping_dict["id"]},
            {"$set": mapping_dict},
            upsert=True
        )
        
        # Upsert options if provided
        saved_options = []
        if request.options:
            for option in request.options:
                option_dict = option.model_dump(by_alias=True)
                option_dict["mappingId"] = mapping_dict["id"]
                option_dict["updatedAt"] = datetime.now(timezone.utc).isoformat()
                
                await db.redirect_options.update_one(
                    {"id": option_dict["id"]},
                    {"$set": option_dict},
                    upsert=True
                )
                saved_options.append(option_dict)
        
        # Fetch all options for this mapping
        all_options = await db.redirect_options.find(
            {"mappingId": mapping_dict["id"]},
            {"_id": 0}
        ).to_list(length=None)
        
        return {
            "mapping": mapping_dict,
            "options": all_options
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating mapping: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mappings")
async def get_mappings(_: bool = Header(default=None, alias="Authorization", include_in_schema=False)):
    """Get all mappings"""
    try:
        verify_admin_token(_)
        mappings = await db.redirect_mappings.find({}, {"_id": 0}).to_list(length=None)
        return mappings
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching mappings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mapping/{mapping_id}")
async def get_mapping(mapping_id: str, _: bool = Header(default=None, alias="Authorization", include_in_schema=False)):
    """Get a specific mapping with its options"""
    try:
        verify_admin_token(_)
        
        mapping = await db.redirect_mappings.find_one({"id": mapping_id}, {"_id": 0})
        if not mapping:
            raise HTTPException(status_code=404, detail="Mapping not found")
        
        options = await db.redirect_options.find(
            {"mappingId": mapping_id},
            {"_id": 0}
        ).to_list(length=None)
        
        return {
            "mapping": mapping,
            "options": options
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching mapping: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/mapping/{mapping_id}")
async def delete_mapping(mapping_id: str, _: bool = Header(default=None, alias="Authorization", include_in_schema=False)):
    """Delete a mapping and all its options"""
    try:
        verify_admin_token(_)
        
        # Delete all options first
        await db.redirect_options.delete_many({"mappingId": mapping_id})
        
        # Delete the mapping
        result = await db.redirect_mappings.delete_one({"id": mapping_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Mapping not found")
        
        return {"message": "Mapping and all options deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting mapping: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# OPTION ENDPOINTS
# ==========================================

@router.post("/option")
async def create_option(request: CreateOptionRequest, _: bool = Header(default=None, alias="Authorization", include_in_schema=False)):
    """Create a new option"""
    try:
        verify_admin_token(_)
        
        option_dict = request.option.model_dump(by_alias=True)
        option_dict["updatedAt"] = datetime.now(timezone.utc).isoformat()
        
        # Check for required fields
        required_fields = ["id", "mappingId", "supplier", "title", "url"]
        missing = [f for f in required_fields if not option_dict.get(f)]
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required fields: {', '.join(missing)}"
            )
        
        await db.redirect_options.insert_one(option_dict)
        
        # Remove MongoDB _id from response
        option_dict.pop("_id", None)
        return option_dict
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating option: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/option/{option_id}")
async def update_option(
    option_id: str,
    request: UpdateOptionRequest,
    _: bool = Header(default=None, alias="Authorization", include_in_schema=False)
):
    """Update an option"""
    try:
        verify_admin_token(_)
        
        updates = {k: v for k, v in request.model_dump().items() if v is not None}
        if not updates:
            raise HTTPException(status_code=400, detail="No updates provided")
        
        updates["updatedAt"] = datetime.now(timezone.utc).isoformat()
        
        result = await db.redirect_options.find_one_and_update(
            {"id": option_id},
            {"$set": updates},
            return_document=True,
            projection={"_id": 0}
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Option not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating option: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/option/{option_id}")
async def delete_option(option_id: str, _: bool = Header(default=None, alias="Authorization", include_in_schema=False)):
    """Delete an option"""
    try:
        verify_admin_token(_)
        
        result = await db.redirect_options.delete_one({"id": option_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Option not found")
        
        return {"message": "Option deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting option: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# SUPPLIER ENDPOINTS
# ==========================================

@router.get("/suppliers")
async def get_suppliers():
    """Get all suppliers (public endpoint)"""
    try:
        suppliers = await db.redirect_suppliers.find(
            {},
            {"_id": 0}
        ).sort("name", 1).to_list(length=None)
        return suppliers
    except Exception as e:
        logger.error(f"Error fetching suppliers: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/suppliers")
async def create_supplier(request: CreateSupplierRequest, _: bool = Header(default=None, alias="Authorization", include_in_schema=False)):
    """Create a new supplier"""
    try:
        verify_admin_token(_)
        
        if not request.name:
            raise HTTPException(status_code=400, detail="Name is required")
        
        # Generate slug from name
        supplier_id = request.name.lower()
        # Remove special characters
        import re
        supplier_id = re.sub(r'[^a-z0-9]', '', supplier_id)
        
        supplier = Supplier(
            id=supplier_id,
            name=request.name,
            url=request.url or "",
            active=1,
            createdAt=datetime.now(timezone.utc).isoformat()
        )
        
        supplier_dict = supplier.model_dump()
        await db.redirect_suppliers.insert_one(supplier_dict)
        
        # Remove MongoDB _id
        supplier_dict.pop("_id", None)
        return supplier_dict
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating supplier: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/suppliers/{supplier_id}")
async def update_supplier(
    supplier_id: str,
    request: UpdateSupplierRequest,
    _: bool = Header(default=None, alias="Authorization", include_in_schema=False)
):
    """Update a supplier"""
    try:
        verify_admin_token(_)
        
        updates = {}
        if request.name is not None:
            updates["name"] = request.name
        if request.url is not None:
            updates["url"] = request.url
        if request.active is not None:
            updates["active"] = 1 if request.active else 0
        
        if not updates:
            raise HTTPException(status_code=400, detail="No updates provided")
        
        result = await db.redirect_suppliers.find_one_and_update(
            {"id": supplier_id},
            {"$set": updates},
            return_document=True,
            projection={"_id": 0}
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Supplier not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating supplier: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: str, _: bool = Header(default=None, alias="Authorization", include_in_schema=False)):
    """Delete a supplier"""
    try:
        verify_admin_token(_)
        
        result = await db.redirect_suppliers.delete_one({"id": supplier_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Supplier not found")
        
        return {"message": "Supplier deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting supplier: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# LINK HEALTH CHECK
# ==========================================

@router.post("/link-health")
async def check_link_health(_: bool = Header(default=None, alias="Authorization", include_in_schema=False)):
    """Check health of all active links and mark broken ones as inactive"""
    try:
        verify_admin_token(_)
        
        active_options = await db.redirect_options.find(
            {"status": "active"},
            {"_id": 0}
        ).to_list(length=None)
        
        changed = []
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            for option in active_options:
                try:
                    response = await client.head(option["url"])
                    
                    if response.status_code >= 400:
                        await db.redirect_options.update_one(
                            {"id": option["id"]},
                            {"$set": {
                                "status": "inactive",
                                "updatedAt": datetime.now(timezone.utc).isoformat()
                            }}
                        )
                        changed.append({
                            "id": option["id"],
                            "url": option["url"],
                            "status": response.status_code,
                            "reason": "HTTP error"
                        })
                except Exception as e:
                    await db.redirect_options.update_one(
                        {"id": option["id"]},
                        {"$set": {
                            "status": "inactive",
                            "updatedAt": datetime.now(timezone.utc).isoformat()
                        }}
                    )
                    changed.append({
                        "id": option["id"],
                        "url": option["url"],
                        "reason": str(e) or "Timeout/Network error"
                    })
        
        return {"changed": changed}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking link health: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# CSV IMPORT/EXPORT
# ==========================================

@router.get("/export-csv")
async def export_csv(_: bool = Header(default=None, alias="Authorization", include_in_schema=False)):
    """Export all mappings and options to CSV"""
    try:
        verify_admin_token(_)
        
        mappings = await db.redirect_mappings.find({}, {"_id": 0}).to_list(length=None)
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['produkt_navn', 'keywords', 'ean', 'leverandør', 'url', 'title'])
        
        for mapping in mappings:
            options = await db.redirect_options.find(
                {"mappingId": mapping["id"]},
                {"_id": 0}
            ).to_list(length=None)
            
            # Convert keywords from comma to semicolon
            keywords = mapping.get("keywords", "") or ""
            keywords = keywords.replace(",", ";")
            
            for option in options:
                if option.get("status") == "active":
                    writer.writerow([
                        mapping.get("name", ""),
                        keywords,
                        mapping.get("ean", "") or "",
                        option.get("supplier", ""),
                        option.get("url", ""),
                        option.get("title", "")
                    ])
        
        csv_content = output.getvalue()
        output.close()
        
        return Response(
            content=csv_content,
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": "attachment; filename=slushice-links.csv"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting CSV: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import-csv")
async def import_csv(
    file: UploadFile = File(...),
    _: bool = Header(default=None, alias="Authorization", include_in_schema=False)
):
    """Import mappings and options from CSV"""
    try:
        verify_admin_token(_)
        
        if not file:
            raise HTTPException(status_code=400, detail="No file uploaded")
        
        # Read CSV content
        content = await file.read()
        csv_content = content.decode('utf-8')
        
        lines = csv_content.strip().split('\n')
        if len(lines) < 2:
            raise HTTPException(status_code=400, detail="CSV file is empty or invalid")
        
        reader = csv.reader(lines)
        next(reader)  # Skip header
        
        imported = {
            "mappings": 0,
            "options": 0,
            "errors": []
        }
        
        for i, row in enumerate(reader, start=2):
            try:
                if len(row) < 6:
                    imported["errors"].append(
                        f"Line {i}: Invalid format (expected 6 fields, got {len(row)})"
                    )
                    continue
                
                produkt_navn, keywords, ean, leverandor, url, title = row[:6]
                
                if not produkt_navn or not leverandor or not url or not title:
                    imported["errors"].append(f"Line {i}: Missing required fields")
                    continue
                
                # Generate mapping ID (slug)
                import re
                import unicodedata
                
                mapping_id = produkt_navn.lower()
                # Normalize unicode
                mapping_id = unicodedata.normalize('NFD', mapping_id)
                mapping_id = mapping_id.encode('ascii', 'ignore').decode('utf-8')
                # Replace Danish characters
                mapping_id = mapping_id.replace('æ', 'ae').replace('ø', 'o').replace('å', 'aa')
                # Remove special characters
                mapping_id = re.sub(r'[^a-z0-9]+', '-', mapping_id)
                mapping_id = mapping_id.strip('-')
                
                # Convert keywords from semicolon to comma
                keywords_formatted = keywords.replace(";", ",") if keywords else ""
                
                # Check if mapping exists
                existing_mapping = await db.redirect_mappings.find_one({"id": mapping_id})
                if not existing_mapping:
                    await db.redirect_mappings.update_one(
                        {"id": mapping_id},
                        {
                            "$set": {
                                "id": mapping_id,
                                "name": produkt_navn,
                                "ean": ean or None,
                                "keywords": keywords_formatted
                            }
                        },
                        upsert=True
                    )
                    imported["mappings"] += 1
                
                # Generate option ID
                option_id = f"opt_{mapping_id}_{leverandor}_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
                
                # Create option
                await db.redirect_options.insert_one({
                    "id": option_id,
                    "mappingId": mapping_id,
                    "supplier": leverandor,
                    "title": title,
                    "url": url,
                    "status": "active",
                    "priceLastSeen": None,
                    "updatedAt": datetime.now(timezone.utc).isoformat()
                })
                
                imported["options"] += 1
            except Exception as e:
                imported["errors"].append(f"Line {i}: {str(e)}")
        
        return imported
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error importing CSV: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# REDIRECT (GO) ROUTES
# ==========================================

FALLBACK_URL = "https://www.power.dk/c/7806/koekken-og-madlavning/vand-og-juice/smagsekstrakter/"
AFFIL_MODE = "off"  # Can be 'skimlinks' or 'off'
AFFIL_ID = ""

def wrap_affiliate(url: str) -> str:
    """Wrap URL with affiliate network if enabled"""
    if AFFIL_MODE == "skimlinks" and AFFIL_ID:
        return f"https://go.skimresources.com/?id={AFFIL_ID}&url={url}"
    return url

def add_utm(url: str) -> str:
    """Add UTM parameters to URL"""
    parsed = urlparse(url)
    params = parse_qs(parsed.query)
    params['utm_source'] = ['slushbook']
    params['utm_medium'] = ['app']
    params['utm_campaign'] = ['buy']
    
    new_query = urlencode(params, doseq=True)
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}?{new_query}"

@go_router.get("/{mapping_id}")
async def redirect_to_product(mapping_id: str, user_agent: Optional[str] = Header(None), referer: Optional[str] = Header(None)):
    """Redirect to product link based on mapping ID"""
    try:
        # Log click
        import uuid
        click_id = str(uuid.uuid4())
        await db.redirect_clicks.insert_one({
            "id": click_id,
            "mappingId": mapping_id,
            "ts": datetime.now(timezone.utc).isoformat(),
            "userAgent": user_agent,
            "referer": referer
        })
        
        # Find active option
        option = await db.redirect_options.find_one(
            {"mappingId": mapping_id, "status": "active"},
            {"_id": 0},
            sort=[("updatedAt", -1)]
        )
        
        if option:
            target_url = add_utm(wrap_affiliate(option["url"]))
        else:
            target_url = add_utm(wrap_affiliate(FALLBACK_URL))
        
        return Response(
            status_code=302,
            headers={"Location": target_url}
        )
    except Exception as e:
        logger.error(f"Error in redirect: {e}", exc_info=True)
        # Fallback to default URL on error
        return Response(
            status_code=302,
            headers={"Location": FALLBACK_URL}
        )
