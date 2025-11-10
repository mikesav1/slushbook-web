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
    country_codes: List[str] = Field(default_factory=lambda: ["DK", "US", "GB"])  # Countries where this link is available
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
                "status": "active",
                "country_codes": ["DK", "US", "GB"]
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
    country_codes: Optional[List[str]] = None

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
async def get_mappings(auth: bool = Depends(verify_admin_token)):
    """Get all mappings"""
    try:
        mappings = await db.redirect_mappings.find({}, {"_id": 0}).to_list(length=None)
        return mappings
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching mappings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mapping/{mapping_id}")
async def get_mapping(mapping_id: str, auth: bool = Depends(verify_admin_token)):
    """Get a specific mapping with its options"""
    try:
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
async def delete_mapping(mapping_id: str, auth: bool = Depends(verify_admin_token)):
    """Delete a mapping and all its options"""
    try:
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
async def create_option(request: CreateOptionRequest, auth: bool = Depends(verify_admin_token)):
    """Create a new option"""
    try:
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
    auth: bool = Depends(verify_admin_token)
):
    """Update an option"""
    try:
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
async def delete_option(option_id: str, auth: bool = Depends(verify_admin_token)):
    """Delete an option"""
    try:
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
async def create_supplier(request: CreateSupplierRequest, auth: bool = Depends(verify_admin_token)):
    """Create a new supplier"""
    try:
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
    auth: bool = Depends(verify_admin_token)
):
    """Update a supplier"""
    try:
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
async def delete_supplier(supplier_id: str, auth: bool = Depends(verify_admin_token)):
    """Delete a supplier"""
    try:
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
async def check_link_health(auth: bool = Depends(verify_admin_token)):
    """Check health of all active links and mark broken ones as inactive"""
    try:
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

@router.get("/export-product-csv")
async def export_csv(auth: bool = Depends(verify_admin_token)):
    """Export all product mappings and options to CSV"""
    try:
        mappings = await db.redirect_mappings.find({}, {"_id": 0}).to_list(length=None)
        
        # Create CSV in memory with QUOTE_NONNUMERIC to ensure keywords with semicolons are quoted
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_NONNUMERIC)
        
        # Header (keywords are semicolon-separated in output)
        writer.writerow(['produkt_navn', 'keywords', 'ean', 'leverandør', 'url', 'title', 'lande'])
        
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
                    # Get country_codes - since we now store ONE country per option
                    # Just extract the first (and should be only) country code
                    country_codes = option.get("country_codes", ["DK"])
                    country_str = country_codes[0] if country_codes else "DK"
                    
                    writer.writerow([
                        mapping.get("name", ""),
                        keywords,
                        mapping.get("ean", "") or "",
                        option.get("supplier", ""),
                        option.get("url", ""),
                        option.get("title", ""),
                        country_str  # Single country code
                    ])
        
        csv_content = output.getvalue()
        output.close()
        
        # Add UTF-8 BOM for Excel/Numbers compatibility
        csv_content_with_bom = '\ufeff' + csv_content
        
        return Response(
            content=csv_content_with_bom.encode('utf-8'),
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

@router.post("/import-product-csv")
async def import_csv(
    file: UploadFile = File(...),
    auth: bool = Depends(verify_admin_token)
):
    """Import product mappings and options from CSV"""
    try:
        if not file:
            raise HTTPException(status_code=400, detail="No file uploaded")
        
        # Read CSV content
        content = await file.read()
        csv_content = content.decode('utf-8')
        
        # Use StringIO to properly parse CSV with quoted fields
        from io import StringIO
        csv_file = StringIO(csv_content)
        
        reader = csv.reader(csv_file)
        header = next(reader)  # Skip header
        
        logger.info(f"CSV Header: {header}")
        
        imported = {
            "mappings": 0,
            "options": 0,
            "errors": []
        }
        
        line_number = 1  # Start at 1 for header
        for row in reader:
            line_number += 1
            try:
                if len(row) < 6:
                    error_msg = f"Line {line_number}: Invalid format (expected at least 6 fields, got {len(row)}). Row: {row}"
                    imported["errors"].append(error_msg)
                    logger.warning(error_msg)
                    continue
                
                produkt_navn, keywords, ean, leverandor, url, title = row[:6]
                
                # Optional 7th field: countries (comma or semicolon separated)
                countries = row[6] if len(row) > 6 else ""
                
                if not produkt_navn or not leverandor or not url or not title:
                    error_msg = f"Line {line_number}: Missing required fields. Row: {row}"
                    imported["errors"].append(error_msg)
                    logger.warning(error_msg)
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
                
                # UPSERT mapping (update if exists, insert if new)
                result = await db.redirect_mappings.update_one(
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
                # Count mapping only if it was newly created (upserted)
                if result.upserted_id:
                    imported["mappings"] += 1
                
                # Parse countries - each CSV row should have ONE country
                # We create separate options for each country
                if countries and countries.strip():
                    country_code = countries.strip().upper()
                else:
                    # Auto-detect country from URL domain
                    import urllib.parse
                    parsed_url = urllib.parse.urlparse(url)
                    domain = parsed_url.netloc.lower()
                    
                    # Extract TLD and map to country code
                    tld_to_country = {
                        '.dk': 'DK',
                        '.de': 'DE',
                        '.at': 'AT',
                        '.fr': 'FR',
                        '.co.uk': 'GB',
                        '.uk': 'GB',
                        '.com': 'US',
                        '.eu': 'GB',
                    }
                    
                    country_code = None
                    for tld, country in tld_to_country.items():
                        if domain.endswith(tld):
                            country_code = country
                            break
                    
                    if not country_code:
                        country_code = "DK"  # Default fallback
                        logger.warning(f"Could not detect country from URL {url}, using DK fallback")
                
                # Each option is unique by: mapping + supplier + country
                # Check if this specific option already exists
                existing_option = await db.redirect_options.find_one({
                    "mappingId": mapping_id,
                    "supplier": leverandor,
                    "country_codes": [country_code]  # Check exact country match
                })
                
                if existing_option:
                    # UPDATE existing option
                    await db.redirect_options.update_one(
                        {"id": existing_option["id"]},
                        {
                            "$set": {
                                "title": title,
                                "url": url,
                                "country_codes": [country_code],  # Single country per option
                                "updatedAt": datetime.now(timezone.utc).isoformat()
                            }
                        }
                    )
                    logger.info(f"Updated option: {mapping_id} - {leverandor} - {country_code}")
                else:
                    # INSERT new option
                    option_id = f"opt_{mapping_id}_{leverandor}_{country_code}_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
                    
                    await db.redirect_options.insert_one({
                        "id": option_id,
                        "mappingId": mapping_id,
                        "supplier": leverandor,
                        "title": title,
                        "url": url,
                        "status": "active",
                        "priceLastSeen": None,
                        "country_codes": [country_code],  # Single country per option
                        "updatedAt": datetime.now(timezone.utc).isoformat()
                    })
                    logger.info(f"Created new option: {mapping_id} - {leverandor} - {country_code}")
                
                imported["options"] += 1
            except Exception as e:
                error_msg = f"Line {line_number}: {str(e)}"
                imported["errors"].append(error_msg)
                logger.error(error_msg, exc_info=True)
        
        logger.info(f"CSV Import completed: {imported['mappings']} mappings, {imported['options']} options, {len(imported['errors'])} errors")
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
async def redirect_to_product(
    mapping_id: str, 
    country: Optional[str] = None,
    user_agent: Optional[str] = Header(None), 
    referer: Optional[str] = Header(None)
):
    """
    Redirect to product link based on mapping ID and user's country
    
    Country fallback order:
    1. User's detected country
    2. Denmark (DK)
    3. United States (US)
    4. United Kingdom (GB)
    5. Any available option
    6. Fallback URL
    """
    try:
        # Log click
        import uuid
        click_id = str(uuid.uuid4())
        await db.redirect_clicks.insert_one({
            "id": click_id,
            "mappingId": mapping_id,
            "ts": datetime.now(timezone.utc).isoformat(),
            "userAgent": user_agent,
            "referer": referer,
            "country": country
        })
        
        # Get all active options for this mapping
        options_cursor = db.redirect_options.find(
            {"mappingId": mapping_id, "status": "active"},
            {"_id": 0}
        ).sort("updatedAt", -1)
        
        options = await options_cursor.to_list(length=None)
        
        if not options:
            # No options at all, use fallback
            target_url = add_utm(wrap_affiliate(FALLBACK_URL))
        else:
            # Country-based selection with fallback
            selected_option = None
            
            # Define fallback order
            fallback_order = []
            if country:
                fallback_order.append(country.upper())
            fallback_order.extend(["DK", "US", "GB"])
            
            # Try each country in fallback order
            for country_code in fallback_order:
                for option in options:
                    # Check if this option supports the country
                    option_countries = option.get("country_codes", ["DK", "US", "GB"])
                    if country_code in option_countries:
                        selected_option = option
                        logger.info(f"Selected option for country {country_code}: {option['supplier']}")
                        break
                
                if selected_option:
                    break
            
            # If still no match, use first available option
            if not selected_option:
                selected_option = options[0]
                logger.info(f"No country match, using first option: {selected_option['supplier']}")
            
            target_url = add_utm(wrap_affiliate(selected_option["url"]))
        
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
