"""
Brix Calculator - Precise calculations for slush recipes
"""

from typing import List, Dict, Optional
from pydantic import BaseModel, Field


class Ingredient(BaseModel):
    """Single ingredient for Brix calculation"""
    name: str
    volume_ml: float = Field(gt=0, description="Volume in milliliters")
    brix: float = Field(ge=0, le=100, description="Brix value (0-100)")
    alcohol_vol: Optional[float] = Field(default=None, ge=0, le=100, description="Alcohol percentage (0-100)")


class BrixResult(BaseModel):
    """Result of Brix calculation"""
    total_brix: float = Field(description="Calculated total Brix")
    total_volume_ml: float = Field(description="Total volume in ml")
    alcohol_percentage: Optional[float] = Field(default=None, description="Total alcohol percentage if applicable")
    is_stable_for_slush: bool = Field(description="Whether Brix is in stable range (12-14)")
    recommendation: str = Field(description="Recommendation for adjustment if needed")


def calculate_brix(ingredients: List[Ingredient]) -> BrixResult:
    """
    Calculate total Brix from a list of ingredients.
    
    Formula: Samlet Brix = (∑(brix_i × ml_i)) / (∑ ml_i)
    
    Args:
        ingredients: List of Ingredient objects with volume_ml and brix
        
    Returns:
        BrixResult with calculated values and recommendations
        
    Example:
        >>> ingredients = [
        ...     Ingredient(name="Hindbær sirup", volume_ml=200, brix=59),
        ...     Ingredient(name="Vand", volume_ml=800, brix=0)
        ... ]
        >>> result = calculate_brix(ingredients)
        >>> result.total_brix
        11.8
    """
    if not ingredients:
        raise ValueError("No ingredients provided")
    
    # Calculate total volume
    total_ml = sum(ing.volume_ml for ing in ingredients)
    
    if total_ml == 0:
        raise ValueError("Total volume cannot be zero")
    
    # Calculate numerator: ∑(brix_i × ml_i)
    numerator = sum(ing.brix * ing.volume_ml for ing in ingredients)
    
    # Calculate total Brix
    total_brix = numerator / total_ml
    
    # Round to 2 decimals
    total_brix = round(total_brix, 2)
    
    # Calculate alcohol percentage if any ingredient has alcohol
    alcohol_percentage = None
    has_alcohol = any(ing.alcohol_vol is not None and ing.alcohol_vol > 0 for ing in ingredients)
    
    if has_alcohol:
        alcohol_percentage = calculate_alcohol_percentage(ingredients, total_ml)
    
    # Check if Brix is stable for slush (12-14°Bx is ideal)
    is_stable = 12.0 <= total_brix <= 14.0
    
    # Generate recommendation
    recommendation = generate_recommendation(total_brix, has_alcohol, alcohol_percentage)
    
    return BrixResult(
        total_brix=total_brix,
        total_volume_ml=total_ml,
        alcohol_percentage=alcohol_percentage,
        is_stable_for_slush=is_stable,
        recommendation=recommendation
    )


def calculate_alcohol_percentage(ingredients: List[Ingredient], total_ml: float) -> float:
    """
    Calculate total alcohol percentage in the mixture.
    
    Formula: Alkohol% = ((ml_alkohol × vol%_alkohol / 100) / total_ml) × 100
    
    Args:
        ingredients: List of Ingredient objects
        total_ml: Total volume of all ingredients
        
    Returns:
        Total alcohol percentage rounded to 2 decimals
        
    Example:
        >>> # 50ml vodka (40% vol) in 1000ml total
        >>> result = ((50 * 40 / 100) / 1000) * 100
        >>> result
        2.0
    """
    total_alcohol_ml = 0.0
    
    for ing in ingredients:
        if ing.alcohol_vol is not None and ing.alcohol_vol > 0:
            # Calculate pure alcohol ml from this ingredient
            pure_alcohol = (ing.volume_ml * ing.alcohol_vol / 100)
            total_alcohol_ml += pure_alcohol
    
    # Calculate percentage of pure alcohol in total volume
    alcohol_percentage = (total_alcohol_ml / total_ml) * 100
    
    return round(alcohol_percentage, 2)


def generate_recommendation(brix: float, has_alcohol: bool, alcohol_percentage: Optional[float]) -> str:
    """
    Generate recommendation based on Brix and alcohol content.
    
    Args:
        brix: Calculated Brix value
        has_alcohol: Whether recipe contains alcohol
        alcohol_percentage: Alcohol percentage if applicable
        
    Returns:
        Recommendation string in Danish
    """
    recommendations = []
    
    # Brix recommendations
    if brix < 12.0:
        diff = 12.0 - brix
        recommendations.append(f"Brix er for lav ({brix}°Bx). Tilføj {round(diff, 1)}°Bx mere sukker/sirup for at nå 12°Bx.")
    elif brix > 14.0:
        diff = brix - 14.0
        recommendations.append(f"Brix er for høj ({brix}°Bx). Tilføj mere vand for at reducere med ca. {round(diff, 1)}°Bx.")
    else:
        recommendations.append(f"Perfekt! Brix er i det ideelle område ({brix}°Bx) for stabil frysning.")
    
    # Alcohol recommendations
    if has_alcohol:
        recommendations.append("⚠️ Husk: Alkohol tilsættes ALTID til sidst.")
        if alcohol_percentage and alcohol_percentage > 10:
            recommendations.append(f"ADVARSEL: Alkoholindhold ({alcohol_percentage}%) er meget højt - kan påvirke frysning negativt.")
    
    return " ".join(recommendations)


def calculate_adjustment_to_target_brix(
    current_ingredients: List[Ingredient],
    target_brix: float = 13.0,
    adjustment_ingredient: str = "water"
) -> Dict[str, float]:
    """
    Calculate how much water or syrup to add to reach target Brix.
    
    Args:
        current_ingredients: Current recipe ingredients
        target_brix: Desired Brix (default: 13.0)
        adjustment_ingredient: "water" to dilute or "syrup" to increase
        
    Returns:
        Dict with current_brix, target_brix, and ml_to_add
    """
    result = calculate_brix(current_ingredients)
    current_brix = result.total_brix
    current_volume = result.total_volume_ml
    
    if abs(current_brix - target_brix) < 0.1:
        return {
            "current_brix": current_brix,
            "target_brix": target_brix,
            "ml_to_add": 0,
            "message": "Already at target Brix"
        }
    
    # Calculate total sugar in current mixture
    total_sugar = current_brix * current_volume
    
    if adjustment_ingredient == "water":
        # Adding water (0 Brix)
        # target_brix = total_sugar / (current_volume + x)
        # x = (total_sugar / target_brix) - current_volume
        new_volume = total_sugar / target_brix
        ml_to_add = new_volume - current_volume
    else:
        # Adding syrup (assume 65 Brix)
        syrup_brix = 65.0
        # target_brix = (total_sugar + syrup_brix * x) / (current_volume + x)
        # Solve for x
        ml_to_add = (target_brix * current_volume - total_sugar) / (syrup_brix - target_brix)
    
    return {
        "current_brix": round(current_brix, 2),
        "target_brix": target_brix,
        "ml_to_add": round(ml_to_add, 1),
        "ingredient": adjustment_ingredient
    }


# Example usage and tests
if __name__ == "__main__":
    # Test 1: Basic calculation
    print("=== Test 1: Hindbær Slush ===")
    ingredients1 = [
        Ingredient(name="Hindbær sirup", volume_ml=200, brix=59),
        Ingredient(name="Vand", volume_ml=800, brix=0)
    ]
    result1 = calculate_brix(ingredients1)
    print(f"Total Brix: {result1.total_brix}°Bx")
    print(f"Stable: {result1.is_stable_for_slush}")
    print(f"Recommendation: {result1.recommendation}\n")
    
    # Test 2: With alcohol
    print("=== Test 2: Vodka Slush ===")
    ingredients2 = [
        Ingredient(name="Jordbær sirup", volume_ml=300, brix=65),
        Ingredient(name="Vand", volume_ml=650, brix=0),
        Ingredient(name="Vodka", volume_ml=50, brix=0, alcohol_vol=40)
    ]
    result2 = calculate_brix(ingredients2)
    print(f"Total Brix: {result2.total_brix}°Bx")
    print(f"Alcohol: {result2.alcohol_percentage}% vol")
    print(f"Stable: {result2.is_stable_for_slush}")
    print(f"Recommendation: {result2.recommendation}\n")
    
    # Test 3: Adjustment calculation
    print("=== Test 3: Adjustment Calculation ===")
    adjustment = calculate_adjustment_to_target_brix(ingredients1, target_brix=13.0)
    print(f"Current: {adjustment['current_brix']}°Bx")
    print(f"Target: {adjustment['target_brix']}°Bx")
    print(f"Add {adjustment['ml_to_add']}ml {adjustment['ingredient']}")
