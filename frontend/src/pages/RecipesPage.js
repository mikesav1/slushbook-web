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
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchRecipes();
  }, [sessionId, alcoholFilter, typeFilter]);

  useEffect(() => {
    filterRecipes();
  }, [recipes, searchTerm]);

  const fetchRecipes = async () => {
    try {
      const params = new URLSearchParams({
        session_id: sessionId,
        alcohol: alcoholFilter
      });
      if (typeFilter) params.append('type', typeFilter);
      
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

  const types = [
    { value: 'klassisk', label: 'Klassisk', icon: 'klassisk.png' },
    { value: 'juice', label: 'Juice', icon: 'juice.png' },
    { value: 'smoothie', label: 'Smoothie', icon: 'smoothie.png' },
    { value: 'sodavand', label: 'Sodavand', icon: 'sodavand.png' },
    { value: 'cocktail', label: 'Cocktail', icon: 'cocktail.png' },
    { value: 'kaffe', label: 'Kaffe', icon: 'kaffe.png' },
    { value: 'sport', label: 'Sport', icon: 'sport.png' },
    { value: 'sukkerfri', label: 'Sukkerfri', icon: 'sukkerfri.png' },
    { value: 'maelk', label: 'Mælk', icon: 'maelk.png' }
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

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTypeFilter('')}
              data-testid="type-filter-all"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                typeFilter === ''
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alle
            </button>
            {types.map((type) => (
              <button
                key={type.value}
                data-testid={`type-filter-${type.value}`}
                onClick={() => setTypeFilter(type.value)}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  typeFilter === type.value
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <img 
                  src={`/icons/${type.icon}`} 
                  alt={type.label}
                  className="w-6 h-6 rounded-full"
                />
                {type.label}
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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