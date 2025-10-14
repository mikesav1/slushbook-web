import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaMagic, FaBook, FaBoxOpen, FaFire, FaHeart } from 'react-icons/fa';
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
      // Get 6 random recipes
      const shuffled = response.data.sort(() => 0.5 - Math.random());
      setFeaturedRecipes(shuffled.slice(0, 6));
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: FaMagic, label: 'Find Match', path: '/match', color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50' },
    { icon: FaBook, label: 'Gennemse', path: '/recipes', color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50' },
    { icon: FaBoxOpen, label: 'Mit Pantry', path: '/pantry', color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50' },
    { icon: FaHeart, label: 'Favoritter', path: '/favorites', color: 'from-rose-500 to-red-500', bg: 'bg-rose-50' }
  ];

  return (
    <div className="space-y-8 fade-in">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-cyan-50 to-coral-50 rounded-3xl p-8 md:p-12 overflow-hidden" data-testid="hero-section">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Find Den Perfekte
            <br />
            <span className="bg-gradient-to-r from-cyan-500 to-coral-500 bg-clip-text text-transparent">
              Slushice Opskrift
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl">
            Opdag lækre slushice opskrifter, match med dine ingredienser, og skalér automatisk til din maskine
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/match"
              data-testid="hero-match-button"
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-full font-semibold hover:shadow-xl transition-all hover:scale-105"
            >
              <FaMagic className="inline mr-2" />
              Find Match Nu
            </Link>
            <Link
              to="/recipes"
              data-testid="hero-browse-button"
              className="px-8 py-4 bg-white text-gray-800 rounded-full font-semibold hover:shadow-xl transition-all hover:scale-105"
            >
              <FaBook className="inline mr-2" />
              Gennemse Alle
            </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-400 to-coral-400 rounded-full opacity-20 blur-3xl"></div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Hurtig Adgang</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.path}
                data-testid={`quick-action-${action.label.toLowerCase()}`}
                className={`${action.bg} p-6 rounded-2xl hover:shadow-lg transition-all hover:scale-105`}
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className="text-white" size={24} />
                </div>
                <h3 className="font-semibold text-gray-800">{action.label}</h3>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Featured Recipes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Populære Opskrifter</h2>
          <Link to="/recipes" className="text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-2">
            Se Alle <FaFire />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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