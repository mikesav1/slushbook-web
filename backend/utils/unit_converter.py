"""
Unit Converter for Recipe Ingredients
Converts between various volume units and ml (base unit)
"""

# Conversion factors to ml (for liquids/volume)
UNIT_TO_ML = {
    # Metric
    "ml": 1.0,
    "dl": 100.0,
    "l": 1000.0,
    
    # US/Imperial
    "cup": 240.0,         # US cup
    "fl oz": 29.5735,     # US fluid ounce
    "tbsp": 14.7868,      # US tablespoon
    "tsp": 4.9289,        # US teaspoon
    "pint": 473.176,      # US pint
    "quart": 946.353,     # US quart
    "gallon": 3785.41,    # US gallon
    
    # UK Imperial (slight differences)
    "cup uk": 284.131,
    "fl oz uk": 28.4131,
    "pint uk": 568.261,
}

# Mass units - oz can be used for weight
UNIT_TO_G = {
    "g": 1.0,
    "kg": 1000.0,
    "oz": 28.3495,        # Weight ounce (different from fluid oz!)
}

# Determine if a unit is volume or mass
VOLUME_UNITS = set(UNIT_TO_ML.keys())
MASS_UNITS = set(UNIT_TO_G.keys())

# Supported units by country
COUNTRY_UNITS = {
    "da": ["ml", "dl", "l", "g"],                              # Denmark
    "de": ["ml", "l", "g"],                                     # Germany  
    "fr": ["ml", "l", "g"],                                     # France
    "en": ["ml", "l", "oz", "g"],                              # UK
    "en_us": ["cup", "tbsp", "tsp", "fl oz", "oz", "g"],      # USA
}

# Default display unit per country
COUNTRY_DEFAULT_UNIT = {
    "da": "ml",
    "de": "ml",
    "fr": "ml",
    "en": "ml",
    "en_us": "cup",
}


def is_volume_unit(unit: str) -> bool:
    """Check if unit is a volume unit"""
    return unit.lower().strip() in VOLUME_UNITS

def is_mass_unit(unit: str) -> bool:
    """Check if unit is a mass unit"""
    return unit.lower().strip() in MASS_UNITS

def convert_to_ml(amount: float, unit: str) -> float:
    """
    Convert any supported volume unit to ml
    
    Args:
        amount: The quantity in the original unit
        unit: The unit to convert from
        
    Returns:
        Amount in ml
        
    Raises:
        ValueError: If unit is not a volume unit
    """
    unit_lower = unit.lower().strip()
    
    if unit_lower not in UNIT_TO_ML:
        raise ValueError(f"Not a volume unit: {unit}. Volume units: {list(UNIT_TO_ML.keys())}")
    
    return amount * UNIT_TO_ML[unit_lower]

def convert_to_g(amount: float, unit: str) -> float:
    """
    Convert any supported mass unit to g
    
    Args:
        amount: The quantity in the original unit
        unit: The unit to convert from
        
    Returns:
        Amount in g
        
    Raises:
        ValueError: If unit is not a mass unit
    """
    unit_lower = unit.lower().strip()
    
    if unit_lower not in UNIT_TO_G:
        raise ValueError(f"Not a mass unit: {unit}. Mass units: {list(UNIT_TO_G.keys())}")
    
    return amount * UNIT_TO_G[unit_lower]


def convert_from_ml(amount_ml: float, target_unit: str) -> float:
    """
    Convert ml to any supported unit
    
    Args:
        amount_ml: The quantity in ml
        target_unit: The unit to convert to
        
    Returns:
        Amount in target unit
        
    Raises:
        ValueError: If unit is not supported
    """
    target_unit_lower = target_unit.lower().strip()
    
    if target_unit_lower not in UNIT_TO_ML:
        raise ValueError(f"Unsupported unit: {target_unit}. Supported units: {list(UNIT_TO_ML.keys())}")
    
    return amount_ml / UNIT_TO_ML[target_unit_lower]


def convert_unit_to_unit(amount: float, from_unit: str, to_unit: str) -> float:
    """
    Convert from one unit to another
    
    Args:
        amount: The quantity in the original unit
        from_unit: The unit to convert from
        to_unit: The unit to convert to
        
    Returns:
        Amount in target unit
    """
    ml_amount = convert_to_ml(amount, from_unit)
    return convert_from_ml(ml_amount, to_unit)


def get_supported_units(country_code: str = "da") -> list:
    """
    Get list of supported units for a country
    
    Args:
        country_code: ISO language code (da, de, fr, en, en_us)
        
    Returns:
        List of supported unit strings
    """
    return COUNTRY_UNITS.get(country_code, COUNTRY_UNITS["da"])


def get_default_unit(country_code: str = "da") -> str:
    """
    Get the default display unit for a country
    
    Args:
        country_code: ISO language code
        
    Returns:
        Default unit string
    """
    return COUNTRY_DEFAULT_UNIT.get(country_code, "ml")


def normalize_ingredient(ingredient: dict) -> dict:
    """
    Normalize an ingredient to store in base units (ml for volume, g for mass)
    
    Args:
        ingredient: Dict with 'quantity', 'unit', and other fields
        
    Returns:
        Dict with added 'quantity_ml' or 'quantity_g', 'display_unit', 'display_quantity'
    """
    original_quantity = ingredient.get("quantity", 0)
    original_unit = ingredient.get("unit", "ml")
    
    result = {
        **ingredient,
        "display_quantity": original_quantity,  # What user entered
        "display_unit": original_unit,          # What user selected
    }
    
    # Determine if volume or mass and convert accordingly
    if is_volume_unit(original_unit):
        result["quantity_ml"] = convert_to_ml(original_quantity, original_unit)
        result["unit_type"] = "volume"
    elif is_mass_unit(original_unit):
        result["quantity_g"] = convert_to_g(original_quantity, original_unit)
        result["unit_type"] = "mass"
    else:
        # Unknown unit, store as-is
        result["quantity_ml"] = original_quantity
        result["unit_type"] = "unknown"
    
    return result


def denormalize_ingredient(ingredient: dict, target_unit: str = None) -> dict:
    """
    Convert ingredient from base storage (ml or g) back to display unit
    
    Args:
        ingredient: Dict with 'quantity_ml' or 'quantity_g' and optionally 'display_unit'
        target_unit: Override unit to display (optional)
        
    Returns:
        Dict with 'quantity' and 'unit' for display
    """
    # Determine display unit
    display_unit = target_unit or ingredient.get("display_unit", "ml")
    
    # Convert based on unit type
    if is_volume_unit(display_unit):
        quantity_ml = ingredient.get("quantity_ml", 0)
        display_quantity = convert_from_ml(quantity_ml, display_unit)
    elif is_mass_unit(display_unit):
        quantity_g = ingredient.get("quantity_g", 0)
        display_quantity = quantity_g / UNIT_TO_G[display_unit.lower().strip()]
    else:
        # Fallback - use stored quantity
        display_quantity = ingredient.get("quantity", 0)
    
    return {
        **ingredient,
        "quantity": display_quantity,
        "unit": display_unit,
    }
