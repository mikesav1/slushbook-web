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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [carouselStartIndex, setCarouselStartIndex] = useState(0);

  useEffect(() => {
    // Don't show ads to PRO users (but show to guests and non-logged users)
    if (user && user.role !== 'guest') {
      setLoading(false);
      return;
    }

    fetchAds();
  }, [user, placement]);

  // Carousel rotation for bottom banners
  useEffect(() => {
    if ((user && user.role !== 'guest') || availableAds.length <= 3 || placement !== 'bottom_banner') {
      return;
    }

    // Rotate carousel every 15 seconds
    const rotationInterval = setInterval(() => {
      setCarouselStartIndex((prev) => {
        const next = prev + 3;
        return next >= availableAds.length ? 0 : next;
      });
    }, 15000);

    return () => clearInterval(rotationInterval);
  }, [user, availableAds, placement]);

  // Separate effect for rotation - runs when availableAds change (for regular ads)
  useEffect(() => {
    if ((user && user.role !== 'guest') || availableAds.length <= 1 || placement === 'bottom_banner') {
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
    if ((!user || user.role === 'guest') && availableAds.length > 1) {
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

  const handleClick = async (adItem = ad) => {
    if (adItem) {
      // Track click
      try {
        await axios.post(`${API}/ads/${adItem.id}/click`);
      } catch (error) {
        console.error('Error tracking click:', error);
      }
    }
  };

  // Don't render if user is PRO (but show for guests), no ad, or loading
  if ((user && user.role !== 'guest') || !ad || loading) {
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

  // Carousel for bottom banners
  if (isBottomBanner && availableAds.length > 0) {
    return (
      <div 
        className={`${placementStyles[placement]}`}
        style={{
          backgroundImage: 'url(/ad-background.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-2">
          {/* Grid: 1 på mobil, 2 på tablet, 3 på desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableAds.slice(0, 3).map((adItem, index) => (
              <a
                key={index}
                href={adItem.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleClick(adItem)}
                className="block cursor-pointer overflow-hidden rounded-xl shadow-md bg-transparent hover:shadow-lg transition-all active:scale-[0.98]"
              >
                {!adItem._imageError ? (
                  <img
                    src={adItem.image}
                    alt={adItem.title || 'Reklame'}
                    className="w-full h-auto object-contain max-h-12 sm:max-h-14 md:max-h-16"
                    style={{ display: 'block' }}
                    onError={(e) => {
                      console.error('Ad image failed to load:', adItem.image);
                      e.target.style.display = 'none';
                    }}
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-12 sm:h-14 md:h-16 bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                    {adItem.title || 'Reklame'}
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Regular banner (not bottom)
  return (
    <div 
      className={`${placementStyles[placement]} relative group`}
    >
      {/* Ad Content Container */}
      <div className="relative">
        {/* Ad Content - using <a> tag for better mobile support */}
        <a
          href={ad.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="block cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow bg-white border border-gray-200 active:scale-[0.98]"
        >
          {/* Image - Full width with better error handling */}
          {!ad._imageError ? (
            <img
              src={ad.image}
              alt={ad.title || 'Reklame'}
              className="w-full h-auto object-cover"
              style={{ display: 'block' }}
              onError={(e) => {
                console.error('Ad image failed to load during display:', ad.image);
                e.target.style.display = 'none';
              }}
              loading="eager"
            />
          ) : (
            // Fallback for failed images
            <div className="w-full h-48 bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold">
              {ad.title || 'Reklame'}
            </div>
          )}

          {/* Optional Title/Description */}
          {(ad.title || ad.description) && (
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
