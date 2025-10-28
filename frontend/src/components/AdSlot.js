import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';

/**
 * AdSlot Component
 * Displays advertisements only for guest users (not logged in)
 * Supports geo-targeting and different placements
 */
const AdSlot = ({ placement = 'bottom_banner' }) => {
  const { user } = useAuth();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableAds, setAvailableAds] = useState([]);

  useEffect(() => {
    // Don't show ads to logged-in users
    if (user) {
      setLoading(false);
      return;
    }

    fetchAds();
    
    // Rotate ads every 30 seconds
    const rotationInterval = setInterval(() => {
      rotateAd();
    }, 30000); // 30 seconds

    return () => clearInterval(rotationInterval);
  }, [user, placement]);

  const fetchAds = async () => {
    try {
      // Detect country from browser (fallback to 'DK')
      const country = getCountryCode();
      
      const response = await axios.get(`${API}/ads`, {
        params: {
          country,
          placement
        }
      });

      if (response.data && response.data.length > 0) {
        setAvailableAds(response.data);
        // Pick random ad initially
        const randomAd = response.data[Math.floor(Math.random() * response.data.length)];
        setAd(randomAd);
      }
    } catch (error) {
      console.error('Error fetching ad:', error);
    } finally {
      setLoading(false);
    }
  };

  const rotateAd = () => {
    if (availableAds.length > 1) {
      // Pick a different ad than current
      const otherAds = availableAds.filter(a => a.id !== ad?.id);
      if (otherAds.length > 0) {
        const newAd = otherAds[Math.floor(Math.random() * otherAds.length)];
        setAd(newAd);
      }
    }
  };

  const getCountryCode = () => {
    // Try to get country from browser language
    const language = navigator.language || navigator.userLanguage;
    
    // Map common language codes to countries
    const countryMap = {
      'da': 'DK',
      'da-DK': 'DK',
      'de': 'DE',
      'de-DE': 'DE',
      'en-GB': 'GB',
      'en-US': 'US',
      'fr': 'FR',
      'fr-FR': 'FR',
    };

    return countryMap[language] || 'DK'; // Default to Denmark
  };

  const handleClick = async () => {
    if (ad) {
      // Track click
      try {
        await axios.post(`${API}/ads/${ad.id}/click`);
      } catch (error) {
        console.error('Error tracking click:', error);
      }
    }
  };

  // Don't render if user is logged in, no ad, or loading
  if (user || !ad || loading) {
    return null;
  }

  // Different styles based on placement
  const placementStyles = {
    bottom_banner: 'fixed left-0 right-0 z-50 shadow-lg lg:bottom-0 bottom-16',
    recipe_list: 'w-full my-4',
    homepage_hero: 'w-full max-w-6xl mx-auto my-6',
    sidebar: 'w-full'
  };

  const isBottomBanner = placement === 'bottom_banner';

  return (
    <div className={`${placementStyles[placement]} ${isBottomBanner ? 'bg-white' : 'relative group'}`}>
      {/* Sponsored Label */}
      {!isBottomBanner && (
        <div className="text-xs text-gray-400 mb-1 text-center">
          Sponsoreret
        </div>
      )}

      {/* Ad Content Container */}
      <div className={`${isBottomBanner ? 'max-w-7xl mx-auto px-4 py-2' : ''}`}>
        {/* Sponsored label for bottom banner */}
        {isBottomBanner && (
          <div className="text-xs text-gray-400 mb-1 text-center">
            Sponsoreret
          </div>
        )}

        {/* Ad Content - using <a> tag for better mobile support */}
        <a
          href={ad.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className={`block cursor-pointer rounded-lg overflow-hidden ${
            isBottomBanner 
              ? 'shadow-md' 
              : 'shadow-md hover:shadow-lg transition-shadow'
          } bg-white border border-gray-200 active:scale-[0.98] transition-transform`}
        >
          {/* Image */}
          <img
            src={ad.image}
            alt={ad.title || 'Reklame'}
            className={`w-full h-auto object-cover ${isBottomBanner ? 'max-h-20' : ''}`}
          />

          {/* Optional Title/Description (only for non-bottom banners) */}
          {!isBottomBanner && (ad.title || ad.description) && (
            <div className="p-4">
              {ad.title && (
                <h3 className="font-semibold text-gray-800 mb-1">{ad.title}</h3>
              )}
              {ad.description && (
                <p className="text-sm text-gray-600">{ad.description}</p>
              )}
            </div>
          )}
        </a>
      </div>
    </div>
  );
};

export default AdSlot;
