import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { FaSave, FaSpinner, FaBook, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const LANGUAGES = {
  de: { name: 'Tysk', flag: '🇩🇪' },
  fr: { name: 'Fransk', flag: '🇫🇷' },
  en: { name: 'Engelsk (UK)', flag: '🇬🇧' },
  en_us: { name: 'Engelsk (US)', flag: '🇺🇸' }
};

const AdminRecipeTranslationsPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('de');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'missing', 'incomplete'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Translation state - stores all changes across languages
  const [allTranslations, setAllTranslations] = useState({}); // { recipeId: { de: {...}, fr: {...} } }

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin()) {
      toast.error('Kun administratorer kan tilgå denne side');
      navigate('/settings');
    }
  }, [isAdmin, navigate]);

  // Load all recipes
  useEffect(() => {
    loadRecipes();
  }, []);

  // Keyboard navigation for language switching
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle arrow keys when not typing in input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const languages = Object.keys(LANGUAGES);
      const currentLangIndex = languages.indexOf(selectedLanguage);

      // Left/Right: Switch language
      if (e.key === 'ArrowLeft' && currentLangIndex > 0) {
        e.preventDefault();
        setSelectedLanguage(languages[currentLangIndex - 1]);
        toast.success(`Skiftet til ${LANGUAGES[languages[currentLangIndex - 1]].name}`);
      } else if (e.key === 'ArrowRight' && currentLangIndex < languages.length - 1) {
        e.preventDefault();
        setSelectedLanguage(languages[currentLangIndex + 1]);
        toast.success(`Skiftet til ${LANGUAGES[languages[currentLangIndex + 1]].name}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLanguage]);

  // Keyboard navigation for recipe switching (separate useEffect to avoid circular dependency)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle arrow keys when not typing in input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Up/Down: Switch recipe - calculate filtered recipes here
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        
        // Calculate filtered recipes inline
        const currentFiltered = recipes.filter(recipe => {
          if (searchQuery.trim() && !recipe.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
          }
          if (filterMode === 'missing') {
            const trans = recipe.translations?.[selectedLanguage];
            if (!trans) return true;
            if (!trans.description || trans.description.trim() === '') return true;
            if (!trans.steps || trans.steps.length === 0) return true;
            return false;
          } else if (filterMode === 'incomplete') {
            return Object.keys(LANGUAGES).some(langCode => {
              const trans = recipe.translations?.[langCode];
              if (!trans) return true;
              if (!trans.description || trans.description.trim() === '') return true;
              if (!trans.steps || trans.steps.length === 0) return true;
              return false;
            });
          }
          return true;
        });
        
        if (currentFiltered.length === 0) return;
        
        const currentRecipeIndex = currentFiltered.findIndex(r => r.id === selectedRecipe?.id);
        
        if (e.key === 'ArrowUp' && currentRecipeIndex > 0) {
          setSelectedRecipe(currentFiltered[currentRecipeIndex - 1]);
          toast.success(`📋 ${currentFiltered[currentRecipeIndex - 1].name}`);
        } else if (e.key === 'ArrowDown' && currentRecipeIndex < currentFiltered.length - 1) {
          setSelectedRecipe(currentFiltered[currentRecipeIndex + 1]);
          toast.success(`📋 ${currentFiltered[currentRecipeIndex + 1].name}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recipes, searchQuery, filterMode, selectedLanguage, selectedRecipe]);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/recipes?session_id=admin&alcohol=both&lang=da`);
      setRecipes(response.data);
      if (response.data.length > 0 && !selectedRecipe) {
        setSelectedRecipe(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
      toast.error('Kunne ikke indlæse opskrifter');
    } finally {
      setLoading(false);
    }
  };

  const handleDescriptionChange = (value) => {
    if (!selectedRecipe) return;
    
    setAllTranslations(prev => {
      // Get existing translations for this recipe and language
      const existingRecipeTranslations = prev[selectedRecipe.id] || {};
      const existingLangTranslations = existingRecipeTranslations[selectedLanguage] || {};
      
      // Preserve existing values, only update description
      const newState = {
        ...prev,
        [selectedRecipe.id]: {
          ...existingRecipeTranslations,
          [selectedLanguage]: {
            description: value,
            steps: existingLangTranslations.steps || getCurrentTranslation('steps')
          }
        }
      };
      
      console.log('handleDescriptionChange:', {
        recipeId: selectedRecipe.id,
        recipeName: selectedRecipe.name,
        language: selectedLanguage,
        previousState: prev,
        newState: newState,
        totalRecipes: Object.keys(newState).length,
        totalChanges: Object.keys(newState).reduce((sum, rid) => sum + Object.keys(newState[rid]).length, 0)
      });
      
      return newState;
    });
  };

  const handleStepChange = (index, value) => {
    if (!selectedRecipe) return;
    
    setAllTranslations(prev => {
      // Get existing translations for this recipe and language
      const existingRecipeTranslations = prev[selectedRecipe.id] || {};
      const existingLangTranslations = existingRecipeTranslations[selectedLanguage] || {};
      
      // Get current steps (from existing state or database)
      const currentSteps = existingLangTranslations.steps || getCurrentTranslation('steps') || [];
      const newSteps = [...currentSteps];
      newSteps[index] = value;
      
      // Preserve existing values, only update steps
      return {
        ...prev,
        [selectedRecipe.id]: {
          ...existingRecipeTranslations,
          [selectedLanguage]: {
            description: existingLangTranslations.description || getCurrentTranslation('description'),
            steps: newSteps
          }
        }
      };
    });
  };

  const getCurrentTranslation = (field) => {
    if (!selectedRecipe) return field === 'steps' ? [] : '';
    
    // Check if we have local edits
    const localTranslation = allTranslations[selectedRecipe.id]?.[selectedLanguage];
    if (localTranslation && localTranslation[field] !== undefined) {
      return localTranslation[field];
    }
    
    // Otherwise use what's in the recipe's translations
    const recipeTranslation = selectedRecipe.translations?.[selectedLanguage];
    if (recipeTranslation && recipeTranslation[field] !== undefined) {
      return recipeTranslation[field];
    }
    
    // Default to Danish
    return selectedRecipe.translations?.da?.[field] || (field === 'steps' ? [] : '');
  };

  const getMasterContent = (field) => {
    if (!selectedRecipe) return field === 'steps' ? [] : '';
    return selectedRecipe.translations?.da?.[field] || selectedRecipe[field] || (field === 'steps' ? [] : '');
  };

  const hasChanges = () => {
    return Object.keys(allTranslations).length > 0;
  };

  const getChangedRecipesCount = () => {
    // Count total number of (recipe × language) changes, not just recipes
    let totalChanges = 0;
    const details = [];
    for (const recipeId in allTranslations) {
      const recipe = recipes.find(r => r.id === recipeId);
      const langs = Object.keys(allTranslations[recipeId]);
      totalChanges += langs.length;
      if (recipe) {
        details.push(`${recipe.name}: ${langs.join(', ')}`);
      }
    }
    console.log('Changed translations:', { totalChanges, details, allTranslations });
    return totalChanges;
  };

  const saveAllTranslations = async () => {
    setSaving(true);
    
    try {
      const token = localStorage.getItem('session_token');
      let savedCount = 0;
      let totalChanges = 0;
      
      // Count total changes
      for (const recipeId in allTranslations) {
        totalChanges += Object.keys(allTranslations[recipeId]).length;
      }
      
      console.log('Saving translations:', { allTranslations, totalChanges });
      
      // For each recipe that has changes
      for (const [recipeId, languageTranslations] of Object.entries(allTranslations)) {
        // Get the full recipe
        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) {
          console.warn(`Recipe not found: ${recipeId}`);
          continue;
        }
        
        // Build the complete translations object
        const updatedTranslations = {
          ...recipe.translations,
          ...languageTranslations
        };
        
        console.log(`Updating recipe ${recipe.name}:`, { recipeId, languageTranslations, updatedTranslations });
        
        // Update the recipe translations via dedicated endpoint
        try {
          await axios.patch(
            `${API}/recipes/${recipeId}/translations`,
            updatedTranslations,
            {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true
            }
          );
          savedCount++;
        } catch (err) {
          console.error(`Failed to save recipe ${recipeId}:`, err.response?.data || err.message);
          toast.error(`Fejl ved ${recipe.name}: ${err.response?.data?.detail || err.message}`);
        }
      }
      
      if (savedCount > 0) {
        toast.success(`✅ Gemt ${totalChanges} oversættelser i ${savedCount} opskrifter!`);
        setAllTranslations({});
        
        // Reload recipes
        await loadRecipes();
      } else {
        toast.error('Kunne ikke gemme nogen oversættelser');
      }
    } catch (error) {
      console.error('Error saving translations:', error);
      toast.error(`Kunne ikke gemme oversættelser: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Check if a recipe is missing translations for a language
  const isMissingTranslation = (recipe, langCode) => {
    const trans = recipe.translations?.[langCode];
    if (!trans) return true;
    if (!trans.description || trans.description.trim() === '') return true;
    if (!trans.steps || trans.steps.length === 0) return true;
    return false;
  };

  // Check if a recipe is incomplete (missing any language)
  const isIncomplete = (recipe) => {
    return Object.keys(LANGUAGES).some(langCode => isMissingTranslation(recipe, langCode));
  };

  // Filter recipes by search and filter mode - use useMemo for keyboard navigation
  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      // Search filter
      if (searchQuery.trim() && !recipe.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Mode filter
      if (filterMode === 'missing') {
        // Show only recipes missing translation for currently selected language
        const trans = recipe.translations?.[selectedLanguage];
        if (!trans) return true;
        if (!trans.description || trans.description.trim() === '') return true;
        if (!trans.steps || trans.steps.length === 0) return true;
        return false;
      } else if (filterMode === 'incomplete') {
        // Show only recipes that are missing any language
        return Object.keys(LANGUAGES).some(langCode => {
          const trans = recipe.translations?.[langCode];
          if (!trans) return true;
          if (!trans.description || trans.description.trim() === '') return true;
          if (!trans.steps || trans.steps.length === 0) return true;
          return false;
        });
      }

      return true;
    });
  }, [recipes, searchQuery, filterMode, selectedLanguage]);

  if (!isAdmin()) {
    return null;
  }

  return (
    <div className="relative pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl p-6 shadow-lg mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FaBook className="text-3xl" />
          <h1 className="text-4xl font-bold">Oversæt Opskrifter</h1>
        </div>
        <p className="text-white/90">
          Oversæt beskrivelser og trin-for-trin instruktioner for alle opskrifter
        </p>
      </div>

      {/* Sticky Language Selector */}
      <div 
        className="sticky top-0 z-50 bg-white border-b-2 border-gray-300 shadow-lg py-4 mb-6"
        style={{ 
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          marginLeft: '-1.5rem',
          marginRight: '-1.5rem',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem'
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-700">Sprog (← → til sprog, ↑ ↓ til opskrift):</span>
            <div className="flex gap-2">
              {Object.entries(LANGUAGES).map(([code, lang]) => (
                <button
                  key={code}
                  onClick={() => setSelectedLanguage(code)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all text-sm ${
                    selectedLanguage === code
                      ? 'bg-purple-500 text-white shadow-md ring-2 ring-purple-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="hidden sm:inline">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Vis:</span>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
            >
              <option value="all">Alle opskrifter ({recipes.length})</option>
              <option value="missing">
                Mangler {LANGUAGES[selectedLanguage].name} ({recipes.filter(r => isMissingTranslation(r, selectedLanguage)).length})
              </option>
              <option value="incomplete">Ufuldstændige ({recipes.filter(r => isIncomplete(r)).length})</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recipe List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 sticky top-24">
            <h3 className="font-bold text-lg mb-3">Vælg Opskrift</h3>
            
            {/* Search */}
            <div className="relative mb-3">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Søg opskrift..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>

            {/* Stats */}
            <div className="mb-3 p-2 bg-gray-50 rounded-lg text-xs">
              <div className="font-semibold text-gray-700">Viser {filteredRecipes.length} af {recipes.length} opskrifter</div>
            </div>

            {/* Recipe List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredRecipes.map(recipe => {
                const missing = isMissingTranslation(recipe, selectedLanguage);
                return (
                  <button
                    key={recipe.id}
                    onClick={() => setSelectedRecipe(recipe)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedRecipe?.id === recipe.id
                        ? 'bg-purple-100 border-2 border-purple-500'
                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm flex-1">{recipe.name}</div>
                      <div className="flex items-center gap-1">
                        {missing && (
                          <span className="text-xs text-orange-600 font-semibold">⚠️</span>
                        )}
                        {allTranslations[recipe.id] && (
                          <span className="text-xs text-green-600 font-semibold">✓</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Translation Editor */}
        <div className="lg:col-span-2">
          {selectedRecipe && (
            <div className="space-y-6">

              {/* Description */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-4">Beskrivelse</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* Master (Danish) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Master (Dansk):
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-800 text-sm">{getMasterContent('description')}</p>
                    </div>
                  </div>

                  {/* Translation */}
                  <div>
                    <label className="block text-sm font-semibold text-purple-700 mb-2">
                      {LANGUAGES[selectedLanguage].name} (redigerbar):
                    </label>
                    <Textarea
                      value={getCurrentTranslation('description')}
                      onChange={(e) => handleDescriptionChange(e.target.value)}
                      className="min-h-[100px] resize-y"
                      placeholder={`Oversættelse til ${LANGUAGES[selectedLanguage].name}...`}
                    />
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-4">Trin-for-trin Instruktioner</h3>
                
                {getMasterContent('steps').map((masterStep, index) => (
                  <div key={index} className="mb-6 last:mb-0">
                    <div className="font-semibold text-sm text-gray-700 mb-2">
                      Trin {index + 1}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {/* Master */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Dansk:</label>
                        <div className="p-2 bg-gray-50 rounded border border-gray-200">
                          <p className="text-sm text-gray-800">{masterStep}</p>
                        </div>
                      </div>

                      {/* Translation */}
                      <div>
                        <label className="block text-xs text-purple-700 mb-1">
                          {LANGUAGES[selectedLanguage].name}:
                        </label>
                        <Textarea
                          value={getCurrentTranslation('steps')[index] || ''}
                          onChange={(e) => handleStepChange(index, e.target.value)}
                          className="min-h-[60px] text-sm"
                          placeholder={`Oversættelse af trin ${index + 1}...`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Save Button */}
      {!loading && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              {hasChanges() ? (
                <p className="text-sm text-orange-600 font-semibold">
                  ⚠️ Du har {getChangedRecipesCount()} ugemte ændringer
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  Alle ændringer er gemt
                </p>
              )}
            </div>
            <Button
              onClick={saveAllTranslations}
              disabled={saving || !hasChanges()}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 text-lg font-bold shadow-md"
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Gemmer...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  💾 Gem alle ændringer ({getChangedRecipesCount()})
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecipeTranslationsPage;
