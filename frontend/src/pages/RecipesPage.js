import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSearch, FaFilter, FaTimes, FaSortAlphaDown, FaPlus } from 'react-icons/fa';
import { API } from '../App';
import RecipeCard from '../components/RecipeCard';
import UpgradeModal from '../components/UpgradeModal';
import { useAuth } from '../context/AuthContext';
import OnboardingTooltip from '../components/OnboardingTooltip';
import { recipesPageSteps, isTourCompleted, markTourCompleted, TOUR_KEYS } from '../utils/onboarding';

const RecipesPage = ({ sessionId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default'); // default, alphabetical, rating
  // Load filters from localStorage or use defaults
  const [alcoholFilter, setAlcoholFilter] = useState(() => {
    return localStorage.getItem('recipeAlcoholFilter') || 'both';
  });
  const [typeFilter, setTypeFilter] = useState(() => {
    return localStorage.getItem('recipeTypeFilter') || '';
  });
  const [showMyRecipes, setShowMyRecipes] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(-1);
  
  // Ingredient filters
  const [includeIngredients, setIncludeIngredients] = useState([]);
  const [excludeIngredients, setExcludeIngredients] = useState([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [excludeIngredientInput, setExcludeIngredientInput] = useState('');
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [showIncludeSuggestions, setShowIncludeSuggestions] = useState(false);
  const [showExcludeSuggestions, setShowExcludeSuggestions] = useState(false);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('recipeAlcoholFilter', alcoholFilter);
  }, [alcoholFilter]);

  useEffect(() => {
    localStorage.setItem('recipeTypeFilter', typeFilter);
  }, [typeFilter]);

  useEffect(() => {
    fetchRecipes();
  }, [sessionId, alcoholFilter, typeFilter, sortBy, includeIngredients, excludeIngredients]);

  useEffect(() => {
    filterRecipes();
  }, [recipes, searchTerm, showMyRecipes]);

  // Extract unique ingredients from all recipes for autocomplete
  useEffect(() => {
    if (recipes.length > 0) {
      const allIngredients = new Set();
      recipes.forEach(recipe => {
        if (recipe.ingredients) {
          recipe.ingredients.forEach(ing => {
            if (ing.name) {
              allIngredients.add(ing.name.toLowerCase());
            }
          });
        }
      });
      setAvailableIngredients(Array.from(allIngredients).sort());
    }
  }, [recipes]);

  // Start tour if coming from HomePage and tour not completed
  useEffect(() => {
    if (user && user.role !== 'guest' && !isTourCompleted(TOUR_KEYS.RECIPES) && isTourCompleted(TOUR_KEYS.HOME)) {
      console.log('[Tour] Starting recipes tour...');
      setTimeout(() => {
        setCurrentTourStep(0);
      }, 1000);
    }
  }, [user]);

  const handleTourNext = () => {
    const nextStep = currentTourStep + 1;
    setCurrentTourStep(nextStep);
  };

  const handleTourSkip = () => {
    markTourCompleted(TOUR_KEYS.RECIPES);
    setCurrentTourStep(-1);
  };

  const handleTourFinish = () => {
    markTourCompleted(TOUR_KEYS.RECIPES);
    setCurrentTourStep(-1);
    
    // Navigate to Add Recipe page to continue tour
    setTimeout(() => {
      navigate('/add-recipe');
    }, 500);
  };

  
  // Check URL params for sort preference
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sortBy = urlParams.get('sort');
    if (sortBy === 'rating') {
      // Sort by rating when coming from "Højest vurderet" button
      const sorted = [...recipes].sort((a, b) => {
        // Recipes WITH ratings first
        const aHasRating = (a.rating_avg || 0) > 0;
        const bHasRating = (b.rating_avg || 0) > 0;
        if (aHasRating && !bHasRating) return -1;
        if (!aHasRating && bHasRating) return 1;
        
        // Then by rating value
        const aRating = a.rating_avg || 0;
        const bRating = b.rating_avg || 0;
        return bRating - aRating;
      });
      setRecipes(sorted);
    }
  }, []);

  const fetchRecipes = async () => {
    try {
      const params = new URLSearchParams({
        session_id: sessionId,
        alcohol: alcoholFilter
      });
      if (typeFilter) params.append('type', typeFilter);
      if (includeIngredients.length > 0) {
        params.append('include_ingredients', includeIngredients.join(','));
      }
      if (excludeIngredients.length > 0) {
        params.append('exclude_ingredients', excludeIngredients.join(','));
      }
      
      const response = await axios.get(`${API}/recipes?${params}`);
      
      // Check if we should sort by rating from URL
      const urlParams = new URLSearchParams(window.location.search);
      const sortByParam = urlParams.get('sort');
      
      let sortedRecipes;
      
      // Sort based on sortBy state or URL param
      const activeSortBy = sortByParam || sortBy;
      
      if (activeSortBy === 'alphabetical') {
        // Sort alphabetically by name (A-Z)
        sortedRecipes = response.data.sort((a, b) => 
          a.name.localeCompare(b.name, 'da')
        );
      } else if (activeSortBy === 'rating') {
        // Sort by rating (highest first), prioritizing recipes WITH ratings
        sortedRecipes = response.data.sort((a, b) => {
          // Recipes WITH ratings first
          const aHasRating = (a.rating_avg || 0) > 0;
          const bHasRating = (b.rating_avg || 0) > 0;
          if (aHasRating && !bHasRating) return -1;
          if (!aHasRating && bHasRating) return 1;
          
          // Then sort by rating value (highest first)
          const aRating = a.rating_avg || 0;
          const bRating = b.rating_avg || 0;
          return bRating - aRating;
        });
      } else {
        // Default sort: free recipes first, then own recipes, then by created date
        sortedRecipes = response.data.sort((a, b) => {
          // Free recipes first (is_free=true or missing is_free field means free)
          const aIsFree = a.is_free !== false;
          const bIsFree = b.is_free !== false;
          if (aIsFree && !bIsFree) return -1;
          if (!aIsFree && bIsFree) return 1;
          
          // Then own recipes
          const aIsOwn = a.author === sessionId;
          const bIsOwn = b.author === sessionId;
          if (aIsOwn && !bIsOwn) return -1;
          if (!aIsOwn && bIsOwn) return 1;
          
          // Then sort by created date (newest first)
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });
      }
      
      setRecipes(sortedRecipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecipes = () => {
    let filtered = recipes;
    
    // Filter by "mine opskrifter" if enabled
    if (showMyRecipes) {
      filtered = filtered.filter(recipe => recipe.author === sessionId);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(recipe =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredRecipes(filtered);
  };

  // Ingredient filter functions
  const addIncludeIngredient = (ingredient) => {
    const trimmedIngredient = ingredient.trim().toLowerCase();
    if (trimmedIngredient && !includeIngredients.includes(trimmedIngredient)) {
      setIncludeIngredients([...includeIngredients, trimmedIngredient]);
    }
    setIngredientInput('');
    setShowIncludeSuggestions(false);
  };

  const handleIncludeKeyPress = (e) => {
    if (e.key === 'Enter' && ingredientInput.trim()) {
      e.preventDefault();
      addIncludeIngredient(ingredientInput);
    }
  };

  const removeIncludeIngredient = (ingredient) => {
    setIncludeIngredients(includeIngredients.filter(ing => ing !== ingredient));
  };

  const addExcludeIngredient = (ingredient) => {
    const trimmedIngredient = ingredient.trim().toLowerCase();
    if (trimmedIngredient && !excludeIngredients.includes(trimmedIngredient)) {
      setExcludeIngredients([...excludeIngredients, trimmedIngredient]);
    }
    setExcludeIngredientInput('');
    setShowExcludeSuggestions(false);
  };

  const handleExcludeKeyPress = (e) => {
    if (e.key === 'Enter' && excludeIngredientInput.trim()) {
      e.preventDefault();
      addExcludeIngredient(excludeIngredientInput);
    }
  };

  const removeExcludeIngredient = (ingredient) => {
    setExcludeIngredients(excludeIngredients.filter(ing => ing !== ingredient));
  };

  const clearAllFilters = () => {
    setIncludeIngredients([]);
    setExcludeIngredients([]);
  };

  // Get filtered suggestions based on input
  const getIncludeSuggestions = () => {
    if (!ingredientInput) return availableIngredients.slice(0, 10);
    return availableIngredients
      .filter(ing => 
        ing.includes(ingredientInput.toLowerCase()) && 
        !includeIngredients.includes(ing)
      )
      .slice(0, 10);
  };

  const getExcludeSuggestions = () => {
    if (!excludeIngredientInput) return availableIngredients.slice(0, 10);
    return availableIngredients
      .filter(ing => 
        ing.includes(excludeIngredientInput.toLowerCase()) && 
        !excludeIngredients.includes(ing)
      )
      .slice(0, 10);
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
      {/* Onboarding Tour */}
      <OnboardingTooltip
        steps={recipesPageSteps}
        currentStep={currentTourStep}
        onNext={handleTourNext}
        onSkip={handleTourSkip}
        onFinish={handleTourFinish}
      />
      
      <div>
        <h1 className="text-4xl font-bold mb-2">Opskrifter</h1>
        <p className="text-gray-600">Gennemse {recipes.length} lækre slushice opskrifter</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        {/* Search */}
        <div className="relative mb-4" data-tour="search-bar">
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

        {/* Alkohol Filter - Toggle Switch */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Alkohol filter</label>
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg w-fit">
            <button
              onClick={() => setAlcoholFilter('none')}
              data-testid="alcohol-filter-none"
              className={`text-sm font-medium transition-colors ${alcoholFilter === 'none' ? 'text-gray-900 font-bold' : 'text-gray-400'}`}
            >
              Uden alkohol
            </button>
            <button
              onClick={() => setAlcoholFilter(alcoholFilter === 'none' ? 'only' : 'none')}
              data-testid="alcohol-toggle"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${
                alcoholFilter === 'only' ? 'bg-red-500' : 'bg-green-500'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${
                  alcoholFilter === 'only' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <button
              onClick={() => setAlcoholFilter('only')}
              data-testid="alcohol-filter-only"
              className={`text-sm font-medium transition-colors ${alcoholFilter === 'only' ? 'text-gray-900 font-bold' : 'text-gray-400'}`}
            >
              Med alkohol
            </button>
          </div>
        </div>

        {/* Sortering - Only for Admin */}
        {user?.role === 'admin' && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FaSortAlphaDown className="inline mr-2" />
              Sortering
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
            >
              <option value="default">Standard (Nyeste først)</option>
              <option value="alphabetical">Alfabetisk (A-Z)</option>
              <option value="rating">Højeste vurdering</option>
            </select>
          </div>
        )}

        {/* Mine Opskrifter Filter */}
        <div className="mb-4">
          <button
            onClick={() => setShowMyRecipes(!showMyRecipes)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
              showMyRecipes 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
            }`}
          >
            <FaFilter />
            <span className="font-medium">
              {showMyRecipes ? 'Viser egne opskrifter' : 'Vis egne opskrifter'}
            </span>
          </button>
        </div>

        {/* Ingredient Filters */}
        <div className="mb-6 space-y-4 bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Ingrediens-søgning</h3>
            {(includeIngredients.length > 0 || excludeIngredients.length > 0) && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
              >
                Ryd alle
              </button>
            )}
          </div>

          {/* Include Ingredients */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              ✅ Skal indeholde (skriv eller vælg fra listen)
            </label>
            <input
              type="text"
              value={ingredientInput}
              onChange={(e) => {
                setIngredientInput(e.target.value);
                setShowIncludeSuggestions(true);
              }}
              onKeyPress={handleIncludeKeyPress}
              onFocus={() => setShowIncludeSuggestions(true)}
              onBlur={() => setTimeout(() => setShowIncludeSuggestions(false), 200)}
              placeholder="f.eks. jordbær, citron..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            
            {/* Dropdown suggestions */}
            {showIncludeSuggestions && getIncludeSuggestions().length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {getIncludeSuggestions().map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => addIncludeIngredient(suggestion)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-cyan-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            
            {includeIngredients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {includeIngredients.map((ing, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                  >
                    {ing}
                    <button
                      onClick={() => removeIncludeIngredient(ing)}
                      className="hover:text-green-900"
                    >
                      <FaTimes size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Exclude Ingredients */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              ❌ Må ikke indeholde (skriv eller vælg fra listen)
            </label>
            <input
              type="text"
              value={excludeIngredientInput}
              onChange={(e) => {
                setExcludeIngredientInput(e.target.value);
                setShowExcludeSuggestions(true);
              }}
              onKeyPress={handleExcludeKeyPress}
              onFocus={() => setShowExcludeSuggestions(true)}
              onBlur={() => setTimeout(() => setShowExcludeSuggestions(false), 200)}
              placeholder="f.eks. mælk, nødder..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            
            {/* Dropdown suggestions */}
            {showExcludeSuggestions && getExcludeSuggestions().length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {getExcludeSuggestions().map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => addExcludeIngredient(suggestion)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            
            {excludeIngredients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {excludeIngredients.map((ing, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium"
                  >
                    {ing}
                    <button
                      onClick={() => removeExcludeIngredient(ing)}
                      className="hover:text-red-900"
                    >
                      <FaTimes size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Results count */}
          {(includeIngredients.length > 0 || excludeIngredients.length > 0) && (
            <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
              📊 Viser {filteredRecipes.length} opskrifter med de valgte filtre
            </div>
          )}
        </div>

        {/* Type Filter */}
        <div data-tour="type-filter">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
          
          {/* Mobile: Dropdown */}
          <div className="md:hidden">
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-3 pr-10 bg-white border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
              >
                <option value="">Alle typer</option>
                {types.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {typeFilter && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <img 
                  src={`/icons/${types.find(t => t.value === typeFilter)?.icon}`} 
                  alt={types.find(t => t.value === typeFilter)?.label}
                  className="w-5 h-5 rounded-full"
                />
                <span>Filtreret: {types.find(t => t.value === typeFilter)?.label}</span>
              </div>
            )}
          </div>

          {/* Desktop: Buttons */}
          <div className="hidden md:flex flex-wrap gap-2">
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
            {/* Add Recipe Card - First in grid */}
            {user && user.role !== 'guest' && (
              <div
                data-tour="add-recipe-card"
                onClick={() => navigate('/add-recipe')}
                className="flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all overflow-hidden border-2 border-dashed border-purple-300 hover:border-purple-500 cursor-pointer hover:scale-105"
              >
                {/* Header matching RecipeCard image height */}
                <div className="h-64 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <div className="bg-white rounded-full p-6 shadow-md">
                    <FaPlus className="text-5xl text-purple-600" />
                  </div>
                </div>
                
                {/* Content matching RecipeCard */}
                <div className="p-5 flex flex-col flex-grow justify-center">
                  <h3 className="font-bold text-lg text-center text-purple-700">
                    Tilføj din egen opskrift
                  </h3>
                  <p className="text-sm text-gray-600 text-center mt-2">
                    Opret og del dine egne slush opskrifter
                  </p>
                </div>
              </div>
            )}
            
            {filteredRecipes.map((recipe) => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                sessionId={sessionId}
                onLockedClick={() => setShowUpgradeModal(true)}
              />
            ))}
          </div>
        </div>
      )}
      
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="recipe_locked"
      />
    </div>
  );
};

export default RecipesPage;