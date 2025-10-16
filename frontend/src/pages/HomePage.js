import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaMagic, FaBook, FaFire } from 'react-icons/fa';
import { API } from '../App';
import RecipeCard from '../components/RecipeCard';

const HomePage = ({ sessionId }) => {
  const [featuredRecipes, setFeaturedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('latest'); // 'latest' or 'popular'

  useEffect(() => {
    fetchFeaturedRecipes();
  }, [sessionId, sortBy]);

  const fetchFeaturedRecipes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/recipes?session_id=${sessionId}`);
      
      let sortedRecipes;
      if (sortBy === 'latest') {
        // Sort by created_at (newest first)
        sortedRecipes = response.data.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB - dateA; // Newest first
        });
      } else {
        // Sort by popularity (rating, then favorites count)
        sortedRecipes = response.data.sort((a, b) => {
          const ratingA = a.average_rating || 0;
          const ratingB = b.average_rating || 0;
          if (ratingB !== ratingA) {
            return ratingB - ratingA; // Higher rating first
          }
          // If ratings are equal, sort by favorites count
          const favA = a.favorites_count || 0;
          const favB = b.favorites_count || 0;
          return favB - favA;
        });
      }
      
      setFeaturedRecipes(sortedRecipes.slice(0, 8));
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-0 fade-in">
      {/* Hero Section with Video Background - Full Width */}
      <div className="relative w-screen -mx-4 md:-mx-0" style={{minHeight: '600px'}}>
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{filter: 'brightness(0.7)'}}
        >
          <source src="/slush-bg-video.mp4" type="video/mp4" />
        </video>
        
        {/* Blue Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/60 via-cyan-500/50 to-blue-600/60"></div>
        
        {/* Shimmer/Glitter Effect */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'shimmer 3s infinite'
        }}></div>
        
        {/* Content */}
        <div className="relative z-10 p-8 md:p-12 text-center">
          {/* SLUSHBOOK Logo with Smiley - Need to add logo image here */}
          <div className="mb-6 flex justify-center">
            <img 
              src="/logo-samlet.png" 
              alt="SLUSHBOOK" 
              className="h-32 md:h-40 drop-shadow-2xl"
            />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-2 text-white drop-shadow-lg">
            Find Den perfekte
          </h2>
          <h2 className="text-4xl md:text-6xl font-bold mb-6" style={{
            background: 'linear-gradient(90deg, #FDD835 0%, #FFB300 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
          }}>
            Slushice Opskrifter
          </h2>
          
          <p className="text-lg md:text-xl text-white mb-8 max-w-3xl mx-auto drop-shadow-md">
            Opdag lækre slushice opskrifter, match med dine ingredienser, og skalér automatisk til din maskine
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/match"
              className="px-8 py-4 bg-gradient-to-r from-teal-400 to-cyan-500 text-white rounded-full hover:from-teal-500 hover:to-cyan-600 font-semibold text-lg shadow-lg transition-all transform hover:scale-105"
            >
              Find et match
            </Link>
            <Link
              to="/recipes"
              className="px-8 py-4 bg-white text-gray-800 rounded-full hover:bg-gray-100 font-semibold text-lg shadow-lg transition-all transform hover:scale-105"
            >
              Gennemse alle
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Recipes */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">
              {sortBy === 'latest' ? 'Seneste Opskrifter' : 'Mest Populære'}
            </h2>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSortBy('latest')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  sortBy === 'latest'
                    ? 'bg-white text-cyan-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Seneste
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  sortBy === 'popular'
                    ? 'bg-white text-cyan-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Populære
              </button>
            </div>
          </div>
          <Link to="/recipes" className="text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-2">
            Se Alle <FaFire />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {featuredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} sessionId={sessionId} />
            ))}
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-2">🎯 Smart Matching</h3>
          <p className="text-gray-600">
            Indtast hvad du har i skabene, og vi finder de perfekte opskrifter du kan lave med det samme.
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-2">⚖️ Auto-Skalering</h3>
          <p className="text-gray-600">
            Indstil din maskines beholderstørrelse, og alle opskrifter skaleres automatisk med korrekt Brix.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;