import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';
import { API } from '../App';
import RecipeCard from '../components/RecipeCard';

const RecipesPage = ({ sessionId }) => {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [alcoholFilter, setAlcoholFilter] = useState('both');
  const [colorFilter, setColorFilter] = useState('');

  useEffect(() => {
    fetchRecipes();
  }, [sessionId, alcoholFilter, colorFilter]);

  useEffect(() => {
    filterRecipes();
  }, [recipes, searchTerm]);

  const fetchRecipes = async () => {
    try {
      const params = new URLSearchParams({
        session_id: sessionId,
        alcohol: alcoholFilter
      });
      if (colorFilter) params.append('color', colorFilter);
      
      const response = await axios.get(`${API}/recipes?${params}`);
      setRecipes(response.data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecipes = () => {
    if (!searchTerm) {
      setFilteredRecipes(recipes);
      return;
    }
    const filtered = recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredRecipes(filtered);
  };

  const colors = [
    { value: 'red', label: 'Rød', class: 'color-red' },
    { value: 'blue', label: 'Blå', class: 'color-blue' },
    { value: 'green', label: 'Grøn', class: 'color-green' },
    { value: 'yellow', label: 'Gul', class: 'color-yellow' },
    { value: 'orange', label: 'Orange', class: 'color-orange' },
    { value: 'pink', label: 'Pink', class: 'color-pink' },
    { value: 'purple', label: 'Lilla', class: 'color-purple' },
    { value: 'brown', label: 'Brun', class: 'color-brown' }
  ];

  return (
    <div className="space-y-6 fade-in" data-testid="recipes-page">
      <div>
        <h1 className="text-4xl font-bold mb-2">Opskrifter</h1>
        <p className="text-gray-600">Gennemse {recipes.length} lækre slushice opskrifter</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        {/* Search */}
        <div className="relative mb-4">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            data-testid="search-input"
            placeholder="Søg opskrifter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              data-testid="clear-search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Alkohol Filter */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Alkohol</label>
          <div className="flex gap-2">
            {['both', 'none', 'only'].map((option) => (
              <button
                key={option}
                data-testid={`alcohol-filter-${option}`}
                onClick={() => setAlcoholFilter(option)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  alcoholFilter === option
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option === 'both' ? 'Alle' : option === 'none' ? 'Uden Alkohol' : 'Kun Alkohol'}
              </button>
            ))}
          </div>
        </div>

        {/* Color Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Farve</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setColorFilter('')}
              data-testid="color-filter-all"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                colorFilter === ''
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alle
            </button>
            {colors.map((color) => (
              <button
                key={color.value}
                data-testid={`color-filter-${color.value}`}
                onClick={() => setColorFilter(color.value)}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  colorFilter === color.value
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className={`color-badge ${color.class}`}></span>
                {color.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3 className="text-xl font-bold mb-2">Ingen opskrifter fundet</h3>
          <p className="text-gray-600">Prøv at ændre dine filtre eller søgeord</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Viser {filteredRecipes.length} opskrift{filteredRecipes.length !== 1 ? 'er' : ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} sessionId={sessionId} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipesPage;