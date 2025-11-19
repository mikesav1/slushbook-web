/**
 * API Helper utilities
 * Provides language-aware API calls
 */

import { getUserLanguage } from './geolocation';

/**
 * Add language parameter to URL
 * @param {string} url - Base URL
 * @returns {string} URL with lang parameter
 */
export function addLanguageParam(url) {
  const lang = getUserLanguage();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}lang=${lang}`;
}

/**
 * Build recipe API URL with language
 * @param {string} endpoint - Recipe endpoint (e.g., '/recipes', '/recipes/123')
 * @param {Object} params - Additional query parameters
 * @returns {string} Complete URL with all parameters
 */
export function buildRecipeUrl(endpoint, params = {}) {
  const lang = getUserLanguage();
  const allParams = { ...params, lang };
  
  const queryString = Object.entries(allParams)
    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}
