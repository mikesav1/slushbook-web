"""
Translation Helper Utilities
Handles flattening and unflattening of nested JSON translation files
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Tuple


def flatten_dict(nested_dict: Dict[str, Any], parent_key: str = '', sep: str = '.') -> Dict[str, str]:
    """
    Flatten a nested dictionary into a flat dictionary with dot-notation keys.
    
    Example:
        {"common": {"save": "Gem", "cancel": "Annuller"}}
        -> {"common.save": "Gem", "common.cancel": "Annuller"}
    """
    items = []
    for key, value in nested_dict.items():
        new_key = f"{parent_key}{sep}{key}" if parent_key else key
        if isinstance(value, dict):
            items.extend(flatten_dict(value, new_key, sep=sep).items())
        else:
            items.append((new_key, value))
    return dict(items)


def unflatten_dict(flat_dict: Dict[str, str], sep: str = '.') -> Dict[str, Any]:
    """
    Unflatten a flat dictionary with dot-notation keys into a nested dictionary.
    
    Example:
        {"common.save": "Gem", "common.cancel": "Annuller"}
        -> {"common": {"save": "Gem", "cancel": "Annuller"}}
    """
    result = {}
    for key, value in flat_dict.items():
        parts = key.split(sep)
        current = result
        for part in parts[:-1]:
            if part not in current:
                current[part] = {}
            current = current[part]
        current[parts[-1]] = value
    return result


def load_translation_file(file_path: Path) -> Dict[str, str]:
    """
    Load a translation JSON file and return it as a flattened dictionary.
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        nested_data = json.load(f)
    return flatten_dict(nested_data)


def save_translation_file(file_path: Path, flat_dict: Dict[str, str]) -> None:
    """
    Save a flattened dictionary as a nested JSON file with proper formatting.
    """
    nested_data = unflatten_dict(flat_dict)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(nested_data, f, ensure_ascii=False, indent=2)


def get_translation_pairs(master_lang: str = 'da', target_lang: str = 'de') -> List[Tuple[str, str, str]]:
    """
    Get translation pairs (key, master_text, target_text) for comparison.
    Returns: List of (key, master_value, target_value)
    """
    locales_dir = Path('/app/frontend/src/i18n/locales')
    
    master_file = locales_dir / f"{master_lang}.json"
    target_file = locales_dir / f"{target_lang}.json"
    
    if not master_file.exists() or not target_file.exists():
        raise FileNotFoundError(f"Translation files not found: {master_file} or {target_file}")
    
    master_dict = load_translation_file(master_file)
    target_dict = load_translation_file(target_file)
    
    # Create pairs with all keys from master
    pairs = []
    for key in sorted(master_dict.keys()):
        master_value = master_dict.get(key, '')
        target_value = target_dict.get(key, '')
        pairs.append((key, master_value, target_value))
    
    return pairs
