"""
Geolocation Service for Slushbook
Detects user's country for localized product links and language
"""
import httpx
import logging
from typing import Optional, Dict

logger = logging.getLogger(__name__)

# Free tier: 20,000 requests/month
IPAPI_URL = "https://ipapi.co/{ip}/json/"

# Country code mapping to language preference
COUNTRY_TO_LANGUAGE = {
    "DK": "dk",  # Denmark
    "DE": "de",  # Germany
    "FR": "fr",  # France
    "GB": "en-uk",  # United Kingdom
    "US": "en-us",  # United States
    # Add more as needed
}

# Fallback order for product links
FALLBACK_COUNTRIES = ["DK", "US", "GB"]

async def detect_country_from_ip(ip_address: str) -> Optional[str]:
    """
    Detect country code from IP address using ipapi.co
    
    Args:
        ip_address: IP address to lookup
        
    Returns:
        2-letter country code (e.g., "DK", "US") or None if failed
    """
    try:
        # Don't query for localhost/private IPs
        if ip_address in ["127.0.0.1", "localhost", "::1"] or ip_address.startswith("192.168."):
            logger.info(f"Localhost IP detected: {ip_address}, using fallback country DK")
            return "DK"
        
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(IPAPI_URL.format(ip=ip_address))
            
            if response.status_code == 200:
                data = response.json()
                country_code = data.get("country_code")
                
                if country_code:
                    logger.info(f"Detected country {country_code} for IP {ip_address}")
                    return country_code
                else:
                    logger.warning(f"No country_code in response for IP {ip_address}")
                    return None
            else:
                logger.error(f"IP API returned status {response.status_code}")
                return None
                
    except httpx.TimeoutException:
        logger.error(f"Timeout detecting country for IP {ip_address}")
        return None
    except Exception as e:
        logger.error(f"Error detecting country: {e}")
        return None

def get_language_from_country(country_code: str) -> str:
    """
    Get preferred language code from country code
    
    Args:
        country_code: 2-letter country code (e.g., "DK")
        
    Returns:
        Language code (e.g., "dk", "en-us")
        Defaults to "dk" if not found
    """
    return COUNTRY_TO_LANGUAGE.get(country_code.upper(), "dk")

def get_fallback_country(user_country: Optional[str] = None) -> str:
    """
    Get fallback country if user's country not supported
    
    Fallback order: User's country → DK → US → GB
    
    Args:
        user_country: User's detected country code
        
    Returns:
        Country code to use
    """
    if user_country and user_country.upper() in COUNTRY_TO_LANGUAGE:
        return user_country.upper()
    
    # Return first in fallback list
    return FALLBACK_COUNTRIES[0]

def parse_browser_language(accept_language: str) -> Optional[str]:
    """
    Parse browser Accept-Language header to extract preferred language
    
    Args:
        accept_language: Accept-Language header value
        
    Returns:
        2-letter country code or None
    """
    try:
        # Format: "da-DK,da;q=0.9,en-US;q=0.8,en;q=0.7"
        # We want the country code from the first language
        if not accept_language:
            return None
        
        # Get first language
        first_lang = accept_language.split(",")[0].strip()
        
        # Extract country code if present (e.g., "da-DK" → "DK")
        if "-" in first_lang:
            parts = first_lang.split("-")
            if len(parts) == 2:
                country = parts[1].upper()
                if len(country) == 2:
                    return country
        
        # Try to map language code to country (e.g., "da" → "DK")
        lang_code = first_lang.split("-")[0].lower()
        lang_to_country = {
            "da": "DK",
            "de": "DE",
            "fr": "FR",
            "en": "GB",  # Default English to UK
        }
        
        return lang_to_country.get(lang_code)
        
    except Exception as e:
        logger.error(f"Error parsing browser language: {e}")
        return None
