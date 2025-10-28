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

  useEffect(() => {
    // Don't show ads to logged-in users
    if (user) {
      setLoading(false);
      return;
    }

    fetchAd();
  }, [user, placement]);

  const fetchAd = async () => {
    try {
      // Detect country from browser (fallback to 'DK')
      const country = getCountryCode();
      
      const response = await axios.get(`${API}/ads`, {
        params: {
          country,
          placement
        }
      });

      // Pick random ad if multiple available
      if (response.data && response.data.length > 0) {
        const randomAd = response.data[Math.floor(Math.random() * response.data.length)];
        setAd(randomAd);
      }
    } catch (error) {
      console.error('Error fetching ad:', error);
    } finally {
      setLoading(false);
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

      // Open link in new tab
      window.open(ad.link, '_blank', 'noopener,noreferrer');
    }
  };

  // Don't render if user is logged in, no ad, or loading
  if (user || !ad || loading) {
    return null;
  }

  // Different styles based on placement
  const placementStyles = {
    bottom_banner: 'w-full max-w-4xl mx-auto my-8',
    recipe_list: 'w-full my-4',
    homepage_hero: 'w-full max-w-6xl mx-auto my-6',
    sidebar: 'w-full'
  };

  return (
    <div className={`${placementStyles[placement]} relative group`}>
      {/* Sponsored Label */}
      <div className="text-xs text-gray-400 mb-1 text-center">
        Sponsoreret
      </div>

      {/* Ad Content */}
      <div
        onClick={handleClick}
        className="cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white border border-gray-200"
      >
        {/* Image */}
        <img
          src={ad.image}
          alt={ad.title || 'Reklame'}
          className="w-full h-auto object-cover"
        />

        {/* Optional Title/Description */}
        {(ad.title || ad.description) && (
          <div className="p-4">
            {ad.title && (
              <h3 className="font-semibold text-gray-800 mb-1">{ad.title}</h3>
            )}
            {ad.description && (
              <p className="text-sm text-gray-600">{ad.description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdSlot;
