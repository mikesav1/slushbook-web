import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

/**
 * AdSlot Component
 * Displays advertisements only for guest users (not logged in)
 * Supports geo-targeting and different placements
 * Rotates ads automatically every 30 seconds and on navigation
 */
const AdSlot = ({ placement = 'bottom_banner' }) => {
  const { user } = useAuth();
  const location = useLocation(); // Detect navigation changes
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableAds, setAvailableAds] = useState([]);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    // Don't show ads to PRO users (but show to guests and non-logged users)
    if (user && user.role !== 'guest') {
      setLoading(false);
      return;
    }

    fetchAds();
  }, [user, placement]);

  // Separate effect for rotation - runs when availableAds change
  useEffect(() => {
    if ((user && user.role !== 'guest') || availableAds.length <= 1) {
      return;
    }

    // Rotate ads every 15 seconds
    const rotationInterval = setInterval(() => {
      setAnimating(true); // Start zoom animation
      
      setTimeout(() => {
        setAd(currentAd => {
          if (availableAds.length > 1) {
            // Pick a different ad than current
            const otherAds = availableAds.filter(a => a.id !== currentAd?.id);
            if (otherAds.length > 0) {
              const newAd = otherAds[Math.floor(Math.random() * otherAds.length)];
              console.log('Rotating ad:', newAd.title || newAd.id);
              return newAd;
            }
          }
          return currentAd;
        });
        
        // Reset animation after ad changes
        setTimeout(() => setAnimating(false), 50);
      }, 300); // Brief delay before changing ad
      
    }, 15000); // 15 seconds

    return () => clearInterval(rotationInterval);
  }, [user, availableAds]);

  // Rotate ad on navigation/location change
  useEffect(() => {
    if (!user && availableAds.length > 1) {
      rotateAd();
    }
  }, [location.pathname]);

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
        console.log(`Fetched ${response.data.length} ads for placement: ${placement}`);
        
        // Preload images to catch errors early
        const adsWithValidImages = await Promise.all(
          response.data.map(async (ad) => {
            return new Promise((resolve) => {
              const img = new Image();
              img.onload = () => {
                console.log('✓ Ad image loaded:', ad.title, ad.image);
                resolve(ad);
              };
              img.onerror = () => {
                console.error('✗ Ad image failed:', ad.title, ad.image);
                // Still include ad, but mark for fallback
                ad._imageError = true;
                resolve(ad);
              };
              img.src = ad.image;
              
              // Timeout after 5 seconds
              setTimeout(() => {
                if (!img.complete) {
                  console.warn('⏱ Ad image timeout:', ad.title, ad.image);
                  ad._imageError = true;
                  resolve(ad);
                }
              }, 5000);
            });
          })
        );
        
        setAvailableAds(adsWithValidImages);
        
        // Set initial ad (prefer one without image errors)
        const goodAd = adsWithValidImages.find(a => !a._imageError) || adsWithValidImages[0];
        setAd(goodAd);
      } else {
        console.log('No ads available for placement:', placement);
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
    bottom_banner: 'fixed left-0 right-0 z-50 shadow-lg bottom-16 md:bottom-0',
    recipe_list: 'w-full my-4',
    homepage_hero: 'w-full max-w-6xl mx-auto my-6',
    sidebar: 'w-full'
  };

  const isBottomBanner = placement === 'bottom_banner';

  return (
    <div 
      className={`${placementStyles[placement]} ${isBottomBanner ? '' : 'relative group'}`}
      style={isBottomBanner ? {
        backgroundImage: 'url(/ad-background.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : {}}
    >
      {/* Ad Content Container */}
      <div className={`${isBottomBanner ? 'max-w-7xl mx-auto px-4 py-2' : ''} relative`}>
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
          } bg-white border border-gray-200 active:scale-[0.98] ${
            animating ? 'animate-zoom-in' : ''
          }`}
          style={{
            transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: animating ? 'scale(0)' : 'scale(1)'
          }}
        >
          {/* Image - Full width with better error handling */}
          {!ad._imageError ? (
            <img
              src={ad.image}
              alt={ad.title || 'Reklame'}
              className={`w-full h-auto object-cover ${isBottomBanner ? 'max-h-32 md:max-h-40 lg:max-h-48' : ''}`}
              style={{ display: 'block' }}
              onError={(e) => {
                console.error('Ad image failed to load during display:', ad.image);
                e.target.style.display = 'none';
              }}
              loading="eager"
            />
          ) : (
            // Fallback for failed images
            <div className={`w-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold ${isBottomBanner ? 'h-32 md:h-40 lg:h-48' : 'h-48'}`}>
              {ad.title || 'Reklame'}
            </div>
          )}

          {/* Optional Title/Description (only for non-bottom banners) */}
          {!isBottomBanner && (ad.title || ad.description) && (
            <div className="p-4 bg-white/90">
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
