import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaMagic, FaBook, FaFire } from 'react-icons/fa';
import { API } from '../App';
import RecipeCard from '../components/RecipeCard';

const HomePage = ({ sessionId }) => {
  const [featuredRecipes, setFeaturedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedRecipes();
  }, [sessionId]);

  const fetchFeaturedRecipes = async () => {
    try {
      const response = await axios.get(`${API}/recipes?session_id=${sessionId}`);
      // Sort by created_at (newest first) and get 8 most recent
      const sortedByDate = response.data.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA; // Newest first
      });
      setFeaturedRecipes(sortedByDate.slice(0, 8));
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 fade-in">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-cyan-50 to-coral-50 rounded-3xl p-8 md:p-12 overflow-hidden" data-testid="hero-section">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Logo først på mobil (øverst) */}
          <div className="relative z-10 flex justify-center items-center md:order-2">
            <img 
              src="/logo.png" 
              alt="SLUSHBOOK" 
              className="w-full max-w-xs md:max-w-md drop-shadow-2xl"
            />
          </div>
          {/* Tekst under logo på mobil */}
          <div className="relative z-10 md:order-1">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Find Den Perfekte
              <br />
              <span className="bg-gradient-to-r from-cyan-500 to-coral-500 bg-clip-text text-transparent">
                Slushice Opskrift
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              Opdag lækre slushice opskrifter, match med dine ingredienser, og skalér automatisk til din maskine
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/match"
                data-testid="hero-match-button"
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-full font-semibold hover:shadow-xl transition-all hover:scale-105"
              >
                <FaMagic className="inline mr-2" />
                Find match nu
              </Link>
              <Link
                to="/recipes"
                data-testid="hero-browse-button"
                className="px-8 py-4 bg-white text-gray-800 rounded-full font-semibold hover:shadow-xl transition-all hover:scale-105"
              >
                <FaBook className="inline mr-2" />
                Gennemse alle
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-400 to-coral-400 rounded-full opacity-20 blur-3xl"></div>
      </div>

      {/* Featured Recipes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Seneste Opskrifter</h2>
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