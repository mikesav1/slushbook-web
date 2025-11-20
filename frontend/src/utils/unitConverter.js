/**
 * Unit Converter for Recipe Ingredients
 * Converts between various volume units and ml (base unit)
 * 
 * IMPORTANT: This must match backend/utils/unit_converter.py exactly!
 */

// Conversion factors to ml (for liquids/volume)
export const UNIT_TO_ML = {
  // Metric
  ml: 1.0,
  dl: 100.0,
  l: 1000.0,
  
  // US/Imperial
  cup: 240.0,         // US cup
  'fl oz': 29.5735,   // US fluid ounce
  tbsp: 14.7868,      // US tablespoon
  tsp: 4.9289,        // US teaspoon
  pint: 473.176,      // US pint
  quart: 946.353,     // US quart
  gallon: 3785.41,    // US gallon
  
  // UK Imperial (slight differences)
  'cup uk': 284.131,
  'fl oz uk': 28.4131,
  'pint uk': 568.261,
};

// Mass units - oz can be used for weight
export const UNIT_TO_G = {
  g: 1.0,
  kg: 1000.0,
  oz: 28.3495,        // Weight ounce (different from fluid oz!)
};

// Determine if a unit is volume or mass
export const VOLUME_UNITS = new Set(Object.keys(UNIT_TO_ML));
export const MASS_UNITS = new Set(Object.keys(UNIT_TO_G));

// Supported units by country
export const COUNTRY_UNITS = {
  da: ['ml', 'dl', 'l', 'g'],                              // Denmark
  de: ['ml', 'l', 'g'],                                     // Germany  
  fr: ['ml', 'l', 'g'],                                     // France
  en: ['ml', 'l', 'oz', 'g'],                              // UK
  en_us: ['cup', 'tbsp', 'tsp', 'fl oz', 'oz', 'g'],      // USA
};

// Default display unit per country
export const COUNTRY_DEFAULT_UNIT = {
  da: 'ml',
  de: 'ml',
  fr: 'ml',
  en: 'ml',
  en_us: 'cup',
};

/**
 * Check if unit is a volume unit
 */
export function isVolumeUnit(unit) {
  return VOLUME_UNITS.has(unit.toLowerCase().trim());
}

/**
 * Check if unit is a mass unit
 */
export function isMassUnit(unit) {
  return MASS_UNITS.has(unit.toLowerCase().trim());
}

/**
 * Convert any supported volume unit to ml
 */
export function convertToMl(amount, unit) {
  const unitLower = unit.toLowerCase().trim();
  
  if (!(unitLower in UNIT_TO_ML)) {
    console.error(`Not a volume unit: ${unit}`);
    return amount; // Fallback: return as-is
  }
  
  return amount * UNIT_TO_ML[unitLower];
}

/**
 * Convert any supported mass unit to g
 */
export function convertToG(amount, unit) {
  const unitLower = unit.toLowerCase().trim();
  
  if (!(unitLower in UNIT_TO_G)) {
    console.error(`Not a mass unit: ${unit}`);
    return amount; // Fallback: return as-is
  }
  
  return amount * UNIT_TO_G[unitLower];
}

/**
 * Convert ml to any supported unit
 */
export function convertFromMl(amountMl, targetUnit) {
  const targetUnitLower = targetUnit.toLowerCase().trim();
  
  if (!(targetUnitLower in UNIT_TO_ML)) {
    console.error(`Unsupported unit: ${targetUnit}`);
    return amountMl; // Fallback: return as-is
  }
  
  return amountMl / UNIT_TO_ML[targetUnitLower];
}

/**
 * Convert from one unit to another
 */
export function convertUnitToUnit(amount, fromUnit, toUnit) {
  const mlAmount = convertToMl(amount, fromUnit);
  return convertFromMl(mlAmount, toUnit);
}

/**
 * Get list of supported units for a country
 */
export function getSupportedUnits(countryCode = 'da') {
  return COUNTRY_UNITS[countryCode] || COUNTRY_UNITS.da;
}

/**
 * Get the default display unit for a country
 */
export function getDefaultUnit(countryCode = 'da') {
  return COUNTRY_DEFAULT_UNIT[countryCode] || 'ml';
}

/**
 * Normalize an ingredient to store in base units (ml for volume, g for mass)
 */
export function normalizeIngredient(ingredient) {
  const originalQuantity = ingredient.quantity || 0;
  const originalUnit = ingredient.unit || 'ml';
  
  const result = {
    ...ingredient,
    display_quantity: originalQuantity,  // What user entered
    display_unit: originalUnit,          // What user selected
    quantity: originalQuantity,          // Keep for backward compatibility
    unit: originalUnit,                  // Keep for backward compatibility
  };
  
  // Determine if volume or mass and convert accordingly
  if (isVolumeUnit(originalUnit)) {
    result.quantity_ml = convertToMl(originalQuantity, originalUnit);
    result.unit_type = 'volume';
  } else if (isMassUnit(originalUnit)) {
    result.quantity_g = convertToG(originalQuantity, originalUnit);
    result.unit_type = 'mass';
  } else {
    // Unknown unit, store as-is
    result.quantity_ml = originalQuantity;
    result.unit_type = 'unknown';
  }
  
  return result;
}

/**
 * Convert ingredient from ml storage back to display unit
 */
export function denormalizeIngredient(ingredient, targetUnit = null) {
  const quantityMl = ingredient.quantity_ml || 0;
  
  // Use target unit if provided, otherwise use stored display unit, or fall back to ml
  const displayUnit = targetUnit || ingredient.display_unit || ingredient.unit || 'ml';
  
  // Convert from ml to display unit
  const displayQuantity = convertFromMl(quantityMl, displayUnit);
  
  return {
    ...ingredient,
    quantity: displayQuantity,
    unit: displayUnit,
  };
}

/**
 * Round to reasonable precision based on unit
 */
export function roundToUnit(amount, unit) {
  const unitLower = unit.toLowerCase();
  
  // For very small units (tsp, tbsp), round to 2 decimals
  if (['tsp', 'tbsp'].includes(unitLower)) {
    return Math.round(amount * 100) / 100;
  }
  
  // For oz, fl oz, round to 1 decimal
  if (unitLower.includes('oz')) {
    return Math.round(amount * 10) / 10;
  }
  
  // For ml, dl, round to nearest integer
  if (['ml', 'dl'].includes(unitLower)) {
    return Math.round(amount);
  }
  
  // For cups, l, round to 2 decimals
  return Math.round(amount * 100) / 100;
}
