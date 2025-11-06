/**
 * Geolocation and Internationalization Utilities
 * 
 * Handles country detection and language preference
 */

const API = process.env.REACT_APP_BACKEND_URL || '';

// Supported countries and languages
export const COUNTRIES = {
  DK: { name: 'Danmark', flag: '🇩🇰', lang: 'dk' },
  DE: { name: 'Deutschland', flag: '🇩🇪', lang: 'de' },
  FR: { name: 'France', flag: '🇫🇷', lang: 'fr' },
  GB: { name: 'United Kingdom', flag: '🇬🇧', lang: 'en-uk' },
  US: { name: 'United States', flag: '🇺🇸', lang: 'en-us' },
};

export const LANGUAGES = {
  'dk': { name: 'Dansk', flag: '🇩🇰' },
  'de': { name: 'Deutsch', flag: '🇩🇪' },
  'fr': { name: 'Français', flag: '🇫🇷' },
  'en-uk': { name: 'English (UK)', flag: '🇬🇧' },
  'en-us': { name: 'English (US)', flag: '🇺🇸' },
};

/**
 * Detect user's country and language automatically
 * 
 * @returns {Promise<{country_code: string, language_code: string}>}
 */
export async function detectUserLocation() {
  try {
    // Check localStorage cache with timestamp (cache for 1 hour)
    const savedCountry = localStorage.getItem('user_country');
    const savedLanguage = localStorage.getItem('user_language');
    const savedTimestamp = localStorage.getItem('user_country_timestamp');
    
    // If cached and less than 5 minutes old, use cached value
    if (savedCountry && savedLanguage && savedTimestamp) {
      const cacheAge = Date.now() - parseInt(savedTimestamp);
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      if (cacheAge < fiveMinutes) {
        console.log(`[Geolocation] Using cached country: ${savedCountry} (cached ${Math.round(cacheAge / 1000)} seconds ago)`);
        return {
          country_code: savedCountry,
          language_code: savedLanguage,
          source: 'localStorage'
        };
      } else {
        console.log('[Geolocation] Cache expired (>5 min), detecting fresh...');
      }
    }
    
    // Call backend for automatic detection
    console.log('[Geolocation] Calling backend API for fresh detection...');
    const response = await fetch(`${API}/api/geolocation/detect`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Save to localStorage with timestamp
      localStorage.setItem('user_country', data.country_code);
      localStorage.setItem('user_language', data.language_code);
      localStorage.setItem('user_country_timestamp', Date.now().toString());
      
      console.log(`[Geolocation] Detected and cached: ${data.country_code}`);
      
      return {
        country_code: data.country_code,
        language_code: data.language_code,
        source: 'auto-detected'
      };
    } else {
      console.error('[Geolocation] API call failed, using Denmark fallback');
      // Fallback to Denmark
      return {
        country_code: 'DK',
        language_code: 'dk',
        source: 'fallback'
      };
    }
  } catch (error) {
    console.error('Error detecting location:', error);
    // Fallback to Denmark
    return {
      country_code: 'DK',
      language_code: 'dk',
      source: 'error-fallback'
    };
  }
}

/**
 * Save user's country and language preferences
 * 
 * @param {string} countryCode - 2-letter country code (e.g., 'DK', 'US')
 * @param {string} languageCode - Language code (e.g., 'dk', 'en-us')
 * @param {boolean} isManual - Whether this is a manual user selection (default: true)
 */
export async function updateUserPreferences(countryCode, languageCode, isManual = true) {
  try {
    // Save to localStorage
    localStorage.setItem('user_country', countryCode);
    localStorage.setItem('user_language', languageCode);
    localStorage.setItem('user_country_timestamp', Date.now().toString());
    
    // Mark as manually set if isManual=true
    if (isManual) {
      localStorage.setItem('user_country_manual', 'true');
      console.log(`[Geolocation] Manually set country to: ${countryCode}`);
    } else {
      localStorage.removeItem('user_country_manual');
      console.log(`[Geolocation] Auto-detected country: ${countryCode}`);
    }
    
    // Also save to backend (for logged-in users)
    const response = await fetch(`${API}/api/user/preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        country_code: countryCode,
        language_code: languageCode
      })
    });
    
    if (!response.ok) {
      console.error('Failed to save preferences to backend');
    }
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
}

/**
 * Force refresh country detection (ignores cache)
 * 
 * @returns {Promise<{country_code: string, language_code: string}>}
 */
export async function refreshUserLocation() {
  // Clear cache
  localStorage.removeItem('user_country');
  localStorage.removeItem('user_language');
  localStorage.removeItem('user_country_timestamp');
  
  // Detect fresh
  return detectUserLocation();
}

/**
 * Get user's current country preference
 * 
 * @returns {string} 2-letter country code
 */
export function getUserCountry() {
  return localStorage.getItem('user_country') || 'DK';
}

/**
 * Get user's current language preference
 * 
 * @returns {string} Language code
 */
export function getUserLanguage() {
  return localStorage.getItem('user_language') || 'dk';
}

/**
 * Get translated text from i18n object
 * 
 * @param {Object} i18nObject - Object with language keys (e.g., {dk: "Tekst", en-us: "Text"})
 * @param {string} [languageCode] - Language code to use (defaults to user's preference)
 * @param {string} [fallback] - Fallback text if translation not found
 * @returns {string} Translated text
 */
export function getTranslation(i18nObject, languageCode = null, fallback = '') {
  if (!i18nObject || typeof i18nObject !== 'object') {
    return fallback;
  }
  
  const userLang = languageCode || getUserLanguage();
  
  // Try user's preferred language
  if (i18nObject[userLang]) {
    return i18nObject[userLang];
  }
  
  // Fallback order: dk → en-us → en-uk → first available → fallback
  const fallbackOrder = ['dk', 'en-us', 'en-uk'];
  
  for (const lang of fallbackOrder) {
    if (i18nObject[lang]) {
      return i18nObject[lang];
    }
  }
  
  // Return first available translation
  const firstKey = Object.keys(i18nObject)[0];
  if (firstKey) {
    return i18nObject[firstKey];
  }
  
  return fallback;
}
