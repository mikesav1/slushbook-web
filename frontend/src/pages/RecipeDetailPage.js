import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { FaHeart, FaRegHeart, FaStar, FaWineBottle, FaShoppingCart, FaArrowLeft, FaBalanceScale, FaTrash, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import { toSentenceCase } from '../utils/textUtils';
import { getUserCountry, getUserLanguage, detectUserLocation } from '../utils/geolocation';
import { useTranslation } from 'react-i18next';

const RecipeDetailPage = ({ sessionId }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { t } = useTranslation();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scaledData, setScaledData] = useState(null);
  const [targetVolume, setTargetVolume] = useState(12000);
  const [fullMachineVolume, setFullMachineVolume] = useState(12000);
  const [useHalfPortion, setUseHalfPortion] = useState(false);
  const [machines, setMachines] = useState([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [products, setProducts] = useState([]);
  const [userCountry, setUserCountry] = useState('DK');
  
  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [commentsCollapsed, setCommentsCollapsed] = useState(true); // Start collapsed
  
  // Category display name mapper
  const getCategoryDisplayName = (categoryKey) => {
    const categoryMap = {
      'vand': 'Vand',
      'mælk': 'Mælk',
      'maelk': 'Mælk',
      'frugtsaft': 'Frugtsaft',
      'laeskedrik': 'Læskedrik',
      'kaffe': 'Kaffe',
      'te': 'Te',
      'smoothie': 'Smoothie',
      'andetdrink': 'Andet drink'
    };
    return categoryMap[categoryKey] || categoryKey;
  };

  useEffect(() => {
    fetchRecipe();
    fetchMachines();
    fetchProducts();
    if (isAdmin) {
      fetchAllRecipesForNavigation();
    }
    // Detect user country for product links via backend API (IP-based)
    detectUserLocation().then(result => {
      setUserCountry(result.country_code);
      console.log('[RecipeDetail] User country detected:', result.country_code, 'Source:', result.source);
    }).catch(error => {
      console.error('[RecipeDetail] Country detection failed:', error);
      setUserCountry('DK'); // Fallback to Denmark
    });
  }, [id, sessionId, isAdmin]);

  const fetchAllRecipesForNavigation = async () => {
    try {
      const response = await axios.get(`${API}/recipes?session_id=${sessionId}&alcohol=both&lang=${getUserLanguage()}`);
      // Sort alphabetically for admin navigation
      const sorted = response.data.sort((a, b) => 
        a.name.localeCompare(b.name, 'da')
      );
      setAllRecipes(sorted);
      
      console.log(`[Admin Nav] Total recipes: ${sorted.length}, Current ID: ${id}`);
      
      // Find current recipe index
      const currentIndex = sorted.findIndex(r => r.id === id);
      console.log(`[Admin Nav] Current index: ${currentIndex}`);
      
      if (currentIndex !== -1) {
        // Set next recipe
        if (currentIndex < sorted.length - 1) {
          const nextId = sorted[currentIndex + 1].id;
          setNextRecipeId(nextId);
          console.log(`[Admin Nav] Next recipe ID: ${nextId}, Name: ${sorted[currentIndex + 1].name}`);
        } else {
          setNextRecipeId(null); // Last recipe
          console.log(`[Admin Nav] Last recipe, no next`);
        }
        
        // Set previous recipe
        if (currentIndex > 0) {
          const prevId = sorted[currentIndex - 1].id;
          setPrevRecipeId(prevId);
          console.log(`[Admin Nav] Prev recipe ID: ${prevId}, Name: ${sorted[currentIndex - 1].name}`);
        } else {
          setPrevRecipeId(null); // First recipe
          console.log(`[Admin Nav] First recipe, no prev`);
        }
      } else {
        console.log(`[Admin Nav] Current recipe not found in list!`);
      }
    } catch (error) {
      console.error('Error fetching all recipes:', error);
    }
  };

  const fetchRecipe = async () => {
    try {
      const response = await axios.get(`${API}/recipes/${id}?session_id=${sessionId}&lang=${getUserLanguage()}`);
      setRecipe(response.data);
      if (response.data.user_rating) {
        setRating(response.data.user_rating);
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      toast.error('Kunne ikke hente opskrift');
    } finally {
      setLoading(false);
    }
  };

  const fetchMachines = async () => {
    try {
      const response = await axios.get(`${API}/machines/${sessionId}`);
      setMachines(response.data);
      if (response.data.length > 0) {
        const defaultMachine = response.data.find(m => m.is_default) || response.data[0];
        const machineVolume = defaultMachine.tank_volumes_ml[0];
        setFullMachineVolume(machineVolume);
        setTargetVolume(machineVolume);
        // Return true to indicate a machine was found
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error fetching machines:', error);
      return false;
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Comment functions
  const fetchComments = async () => {
    try {
      // Fetch comments, optionally filtered by user's language
      const params = user?.country ? `?language=${getLanguageFromCountry(user.country)}` : '';
      const response = await axios.get(`${API}/comments/${id}${params}`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const getLanguageFromCountry = (country) => {
    const countryToLang = {
      'DK': 'da',
      'DE': 'de',
      'FR': 'fr',
      'GB': 'en',
      'US': 'en-US'
    };
    return countryToLang[country] || 'da';
  };

  const getLanguageFlag = (lang) => {
    const flags = {
      'da': '🇩🇰',
      'de': '🇩🇪',
      'fr': '🇫🇷',
      'en': '🇬🇧',
      'en-US': '🇺🇸'
    };
    return flags[lang] || '🌍';
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Kommentaren kan ikke være tom');
      return;
    }

    try {
      const response = await axios.post(`${API}/comments`, {
        recipe_id: id,
        comment: newComment
      });
      setComments([response.data, ...comments]);
      setNewComment('');
      toast.success('Kommentar tilføjet');
    } catch (error) {
      console.error('Error adding comment:', error);
      if (error.response?.status === 403) {
        toast.error('Kun PRO-brugere kan kommentere. Opgrader for at deltage i diskussioner!');
      } else {
        toast.error('Kunne ikke tilføje kommentar');
      }
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editCommentText.trim()) {
      toast.error('Kommentaren kan ikke være tom');
      return;
    }

    try {
      const response = await axios.put(`${API}/comments/${commentId}`, {
        comment: editCommentText
      });
      setComments(comments.map(c => c.id === commentId ? response.data : c));
      setEditingCommentId(null);
      setEditCommentText('');
      toast.success('Kommentar opdateret');
    } catch (error) {
      console.error('Error editing comment:', error);
      toast.error('Kunne ikke opdatere kommentar');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Er du sikker på, at du vil slette denne kommentar?')) {
      return;
    }

    try {
      await axios.delete(`${API}/comments/${commentId}`);
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Kommentar slettet');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Kunne ikke slette kommentar');
    }
  };

  const handleToggleLike = async (commentId) => {
    try {
      const response = await axios.post(`${API}/comments/${commentId}/like`);
      // Update likes count in UI
      setComments(comments.map(c => {
        if (c.id === commentId) {
          const isLiked = c.liked_by?.includes(user?.id);
          return {
            ...c,
            likes: response.data.likes,
            liked_by: isLiked 
              ? c.liked_by.filter(uid => uid !== user.id)
              : [...(c.liked_by || []), user.id]
          };
        }
        return c;
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
      if (error.response?.status === 403) {
        toast.error('Kun PRO-brugere kan like kommentarer');
      } else {
        toast.error('Kunne ikke like kommentar');
      }
    }
  };

  const [allMappings, setAllMappings] = useState([]);
  const [supplierCache, setSupplierCache] = useState({});
  const [allRecipes, setAllRecipes] = useState([]);
  const [nextRecipeId, setNextRecipeId] = useState(null);
  const [prevRecipeId, setPrevRecipeId] = useState(null);
  
  const REDIRECT_API = `${API}/go`;
  const ADMIN_REDIRECT_API = `${API}/admin`;
  const ADMIN_TOKEN = 'dev-token-change-in-production';

  useEffect(() => {
    fetchRecipe();
    fetchMachines();
    fetchMappings();
    fetchComments();
  }, [id, sessionId]);

  const fetchMappings = async () => {
    try {
      const response = await axios.get(`${ADMIN_REDIRECT_API}/mappings`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
      });
      setAllMappings(response.data);
    } catch (error) {
      console.error('Error fetching mappings:', error);
    }
  };

  const getMappingForIngredient = (ingredientName) => {
    const name = ingredientName.toLowerCase().trim();
    const ingredientWords = name.split(/\s+/); // Split ingredient name into words
    
    let bestMatch = null;
    let bestMatchScore = 0;
    
    // Check against all mappings' keywords
    for (const mapping of allMappings) {
      if (mapping.keywords) {
        const allKeywords = mapping.keywords.toLowerCase().split(/[,;]/).map(k => k.trim()).filter(k => k);
        
        // First check: Exact match (highest priority)
        if (allKeywords.includes(name)) {
          return mapping.id; // Exact match - return immediately
        }
        
        // Second check: Match only if ingredient has SAME number of words as keyword
        // AND each word matches exactly (not as substring)
        for (const keyword of allKeywords) {
          const keywordWords = keyword.split(/\s+/);
          
          // Only match if word count is the same
          if (keywordWords.length !== ingredientWords.length) {
            continue;
          }
          
          // All ingredient words must match exactly (as complete words, not substrings)
          // This prevents "vand" from matching "vandmelon"
          const allWordsMatch = ingredientWords.every(ingredientWord => 
            keywordWords.some(keywordWord => keywordWord === ingredientWord)
          );
          
          if (allWordsMatch) {
            // Calculate match score based on keyword length (more specific = better)
            const score = keyword.length;
            
            if (score > bestMatchScore) {
              bestMatch = mapping.id;
              bestMatchScore = score;
            }
          }
        }
      }
    }
    
    return bestMatch;
  };

  const getSupplierDisplayName = (supplier) => {
    const names = {
      'power': 'Power',
      'barshopen': 'Barshopen',
      'bilka': 'Bilka',
      'foetex': 'Føtex',
      'matas': 'Matas',
      'nemlig': 'Nemlig.com',
      'amazon': 'Amazon',
      'other': 'Leverandør'
    };
    return names[supplier] || supplier.charAt(0).toUpperCase() + supplier.slice(1);
  };

  const isAuthor = () => {
    if (!recipe) {
      console.log('[RecipeDetail] isAuthor: false - no recipe');
      return false;
    }
    
    // Admin can edit all recipes
    if (user && user.role === 'admin') {
      console.log('[RecipeDetail] isAuthor: true - user is admin');
      return true;
    }
    
    if (!user) {
      console.log('[RecipeDetail] isAuthor: false - no user');
      return false;
    }
    
    // Check if current user is the recipe author
    // Backend uses user.id as recipe author, so check both user.id and user.email
    const result = recipe.author === user.id || recipe.author === user.email || recipe.author === sessionId;
    console.log('[RecipeDetail] isAuthor check:', {
      result,
      recipeAuthor: recipe.author,
      userId: user.id,
      userEmail: user.email,
      sessionId
    });
    return result;
  };

  const getProductForIngredient = (categoryKey) => {
    return products.find(p => p.category_key === categoryKey);
  };

  const trackClick = async (productId) => {
    try {
      await axios.post(`${API}/products/${productId}/click`);
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  const scaleRecipe = async (showToast = true) => {
    try {
      const response = await axios.post(`${API}/scale`, {
        recipe_id: id,
        target_volume_ml: targetVolume,
        margin_pct: 5
      });
      setScaledData(response.data);
      if (showToast) {
        toast.success('Opskrift skaleret!');
      }
    } catch (error) {
      console.error('Error scaling recipe:', error);
      if (showToast) {
        toast.error('Kunne ikke skalere opskrift');
      }
    }
  };

  // Auto-scale recipe when machine is selected and recipe is loaded
  useEffect(() => {
    const autoScale = async () => {
      // Only auto-scale if:
      // 1. Recipe is loaded
      // 2. User has machines (targetVolume is set to machine volume, not default 12000)
      // 3. Recipe hasn't been scaled yet OR targetVolume changed (allow re-scaling)
      if (recipe && machines.length > 0) {
        try {
          const response = await axios.post(`${API}/scale`, {
            recipe_id: id,
            target_volume_ml: targetVolume,
            margin_pct: 5
          });
          setScaledData(response.data);
          console.log('[Auto-Scale] Recipe automatically scaled to:', targetVolume, 'ml');
        } catch (error) {
          console.error('[Auto-Scale] Error:', error);
        }
      }
    };
    
    autoScale();
  }, [recipe, machines, targetVolume]); // Auto-scale when recipe, machines, or targetVolume changes

  const toggleFavorite = async () => {
    // Check if user is guest
    if (!user || user.role === 'guest') {
      toast.error('Kun PRO-brugere kan gemme favoritter. Opgrader til PRO for ubegrænsede funktioner!', {
        duration: 4000
      });
      return;
    }
    
    try {
      if (recipe.is_favorite) {
        await axios.delete(`${API}/favorites/${sessionId}/${id}`);
        toast.success('Fjernet fra favoritter');
      } else {
        await axios.post(`${API}/favorites?session_id=${sessionId}&recipe_id=${id}`);
        toast.success('Tilføjet til favoritter');
      }
      setRecipe({ ...recipe, is_favorite: !recipe.is_favorite });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Kunne ikke opdatere favorit');
    }
  };

  const deleteRecipe = async () => {
    if (!window.confirm(`Er du sikker på, at du vil slette "${recipe.name}"? Dette kan ikke fortrydes.`)) {
      return;
    }

    try {
      await axios.delete(`${API}/recipes/${id}`, {
        withCredentials: true
      });
      toast.success('Opskrift slettet');
      navigate('/recipes');
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast.error(error.response?.data?.detail || 'Kunne ikke slette opskrift');
    }
  };

  const rateRecipe = async (stars) => {
    try {
      await axios.post(`${API}/ratings`, {
        session_id: sessionId,
        recipe_id: id,
        stars: stars,
        made_again: false
      });
      setRating(stars);
      toast.success(`Bedømt med ${stars} stjerner!`);
      fetchRecipe();
    } catch (error) {
      console.error('Error rating recipe:', error);
      toast.error('Kunne ikke bedømme');
    }
  };

  const addMissingToShoppingList = async (ingredients) => {
    try {
      let addedCount = 0;
      for (const ingredient of ingredients) {
        if (ingredient.role === 'required') {
          const categoryKey = ingredient.category_key && ingredient.category_key.trim() !== '' 
            ? ingredient.category_key 
            : ingredient.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-æøå]/g, '');
          
          console.log('[Add to List] Posting ingredient:', ingredient.name, 'with sessionId:', sessionId);
          const response = await axios.post(`${API}/shopping-list`, {
            session_id: sessionId,
            ingredient_name: ingredient.name,
            category_key: categoryKey,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            linked_recipe_id: id,
            linked_recipe_name: recipe.name
          });
          console.log('[Add to List] Response:', response.status, response.data);
          addedCount++;
        }
      }
      console.log('[Add to List] Successfully added', addedCount, 'items');
      toast.success(`Tilføjet ${addedCount} ingredienser til indkøbsliste!`);
    } catch (error) {
      console.error('[Add to List] Error:', error);
      console.error('[Add to List] Error response:', error.response?.data);
      console.error('[Add to List] Error status:', error.response?.status);
      toast.error('Kunne ikke tilføje til indkøbsliste: ' + (error.response?.data?.detail || error.message));
    }
  };

  const toggleHalfPortion = (checked) => {
    setUseHalfPortion(checked);
    if (checked) {
      // Halvér maskine volumen - auto-scale useEffect vil automatisk skalere
      const halfVolume = Math.round(fullMachineVolume / 2);
      setTargetVolume(halfVolume);
      toast.success('Skalerer til halv portion...');
    } else {
      // Gendan fuld maskine volumen - auto-scale useEffect vil automatisk skalere
      setTargetVolume(fullMachineVolume);
      toast.success('Skalerer til fuld portion...');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="empty-state">
        <h3 className="text-xl font-bold mb-2">Opskrift ikke fundet</h3>
        <Button onClick={() => navigate('/recipes')}>Tilbage til Opskrifter</Button>
      </div>
    );
  }

  const ingredientsToShow = scaledData ? scaledData.scaled_ingredients : (recipe.ingredients || []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in" data-testid="recipe-detail-page">
      {/* Back Button & Admin Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          data-testid="back-button"
          className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 font-semibold"
        >
          <FaArrowLeft /> Tilbage
        </button>

        {/* Admin Navigation Buttons */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                console.log(`[Admin Nav] Forrige clicked, prevRecipeId: ${prevRecipeId}`);
                if (prevRecipeId) navigate(`/recipes/${prevRecipeId}`);
              }}
              disabled={!prevRecipeId}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                prevRecipeId 
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              ← Forrige
            </button>
            <span className="text-sm text-gray-500">
              {allRecipes.length > 0 && recipe && 
                `${allRecipes.findIndex(r => r.id === id) + 1} / ${allRecipes.length}`
              }
            </span>
            <button
              onClick={() => {
                console.log(`[Admin Nav] Næste clicked, nextRecipeId: ${nextRecipeId}`);
                if (nextRecipeId) navigate(`/recipes/${nextRecipeId}`);
              }}
              disabled={!nextRecipeId}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                nextRecipeId 
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Næste →
            </button>
          </div>
        )}
      </div>

      {/* Header - Two Column Layout */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Left: Description & Info */}
          <div className="p-6 md:p-8 flex flex-col justify-center order-2 md:order-1">
            {/* Type Icon - Desktop (above description) */}
            {recipe.type && (
              <div className="hidden md:flex items-center gap-3 mb-6">
                <img 
                  src={`/icons/${recipe.type}.png`} 
                  alt={getCategoryDisplayName(recipe.type)}
                  className="w-16 h-16 rounded-full border-2 border-gray-200 shadow-md bg-white p-2"
                />
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Type</p>
                  <p className="text-lg font-bold text-gray-800">{getCategoryDisplayName(recipe.type)}</p>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{toSentenceCase(recipe.name)}</h1>
              
              {/* Author Info - User-created recipes */}
              {recipe.author && recipe.author !== 'system' && recipe.author_name && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">Forfatter:</span>
                  <button
                    onClick={() => navigate(`/recipes?author=${recipe.author}`)}
                    className="text-cyan-600 hover:text-cyan-700 font-semibold text-sm hover:underline flex items-center gap-2"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-full text-xs font-bold flex items-center justify-center border-2 border-cyan-200">
                      {recipe.author_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                    {recipe.author_name}
                  </button>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => window.location.href = '/brix-info'}
                  className="brix-indicator text-sm px-3 py-2 hover:scale-110 transition-transform cursor-pointer"
                  title="Klik for at lære om Brix"
                >
                  {recipe.target_brix}°Bx
                </button>
                {recipe.alcohol_flag && (
                  <span className="alcohol-badge text-xs">
                    <FaWineBottle /> 18+
                  </span>
                )}
              </div>
            </div>
            
            <p className="text-gray-700 text-base md:text-lg mb-4">{recipe.description}</p>
            
            {/* Rejection Notice - Show if recipe is rejected */}
            {recipe.approval_status === 'rejected' && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                <div className="flex items-start">
                  <FaTimes className="text-red-500 mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="text-red-800 font-semibold mb-1">Opskrift Afvist</h4>
                    <p className="text-red-700 text-sm">
                      {recipe.rejection_reason || 'Din opskrift blev afvist af administrator.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Pending Notice - Show ONLY to recipe author or admin */}
            {recipe.approval_status === 'pending' && 
             recipe.is_published === true && 
             (isAdmin || recipe.author === sessionId) && (
              <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <div className="flex items-start">
                  <span className="text-yellow-500 mt-1 mr-3 flex-shrink-0 text-xl">⏳</span>
                  <div>
                    <h4 className="text-yellow-800 font-semibold mb-1">Afventer Godkendelse</h4>
                    <p className="text-yellow-700 text-sm">
                      {isAdmin 
                        ? 'Denne opskrift afventer godkendelse.'
                        : 'Din opskrift venter på godkendelse fra administrator.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Info */}
            <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
              <span>📏 Basis: {recipe.base_volume_ml || 2700}ml</span>
              <button
                onClick={() => window.location.href = '/brix-info'}
                className="hover:text-cyan-600 hover:scale-105 transition-all cursor-pointer underline decoration-dotted font-medium inline-block bg-transparent border-0"
              >
                🍬 Sukkergrad: {recipe.target_brix}°Bx
              </button>
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {recipe.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    data-testid={`star-${star}`}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => rateRecipe(star)}
                    className="transition-transform hover:scale-125"
                  >
                    <FaStar
                      size={20}
                      className={(
                        hoverRating >= star || rating >= star
                          ? 'text-yellow-500'
                          : 'text-gray-300'
                      )}
                    />
                  </button>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {recipe.rating_count} bedømmelser
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-6">
              {/* Rediger - Only for recipe author */}
              {isAuthor() && (
                <Link
                  to={`/edit-recipe/${recipe.id}`}
                  data-testid="edit-recipe-button"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="text-sm font-medium">Rediger</span>
                </Link>
              )}
              {/* Tilføj favorit - Show for all users (guests get upgrade message) */}
              <button
                onClick={toggleFavorite}
                data-testid="toggle-favorite-button"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {recipe.is_favorite ? (
                  <FaHeart className="text-red-500" size={20} />
                ) : (
                  <FaRegHeart className="text-gray-600" size={20} />
                )}
                <span className="text-sm font-medium">
                  {recipe.is_favorite ? 'Fjern favorit' : 'Tilføj favorit'}
                </span>
              </button>
              {/* Slet - Only for admin and recipe author */}
              {(isAdmin() || isAuthor()) && (
                <button
                  onClick={deleteRecipe}
                  data-testid="delete-recipe-button"
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors ml-auto"
                >
                  <FaTrash size={16} />
                  <span className="text-sm font-medium">Slet Opskrift</span>
                </button>
              )}
              
              {/* Toggle Free/Pro - Only for admin */}
              {isAdmin() && (
                <button
                  onClick={async () => {
                    try {
                      const response = await axios.patch(
                        `${API}/admin/recipes/${id}/toggle-free`,
                        {},
                        { withCredentials: true }
                      );
                      toast.success(response.data.message);
                      // Refresh recipe to show new status
                      fetchRecipe();
                    } catch (error) {
                      console.error('Error toggling free status:', error);
                      toast.error('Kunne ikke ændre status');
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    recipe.is_free 
                      ? 'bg-green-100 hover:bg-green-200 text-green-700' 
                      : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                  }`}
                >
                  <span className="text-sm font-medium">
                    {recipe.is_free ? '✓ Gratis for gæster' : '🔒 Kun Pro'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Image (Portrait) */}
          <div className="relative h-96 md:h-auto order-1 md:order-2">
            {recipe.image_url && recipe.image_url !== '/api/images/placeholder.jpg' ? (
              <img 
                src={recipe.image_url} 
                alt={recipe.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br from-${recipe.color}-500 to-${recipe.color}-600`}></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            
            {/* Type Icon - Mobile (in corner of image) */}
            {recipe.type && (
              <div className="md:hidden absolute bottom-4 left-4">
                <img 
                  src={`/icons/${recipe.type}.png`} 
                  alt={getCategoryDisplayName(recipe.type)}
                  className="w-12 h-12 rounded-full border-2 border-white shadow-lg bg-white p-1"
                  title={getCategoryDisplayName(recipe.type)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scaling Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FaBalanceScale /> Skalér Opskrift
        </h2>
        <div className="space-y-4">
          <div>
            <Label>Mål Volumen (ml)</Label>
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                data-testid="target-volume-input"
                value={targetVolume}
                onChange={(e) => setTargetVolume(parseInt(e.target.value))}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
              />
              <Button onClick={scaleRecipe} data-testid="scale-button">
                Skalér
              </Button>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setTargetVolume(6000)}
                className="px-3 py-1 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
              >
                6L
              </button>
              <button
                onClick={() => setTargetVolume(12000)}
                className="px-3 py-1 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
              >
                12L
              </button>
              <button
                onClick={() => setTargetVolume(24000)}
                className="px-3 py-1 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
              >
                2x12L
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <input
                type="checkbox"
                id="half-portion"
                checked={useHalfPortion}
                onChange={(e) => toggleHalfPortion(e.target.checked)}
                className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="half-portion" className="text-sm font-medium text-gray-700">
                Halv portion (½ af maskine volumen: {Math.round(fullMachineVolume / 2)} ml)
              </label>
            </div>
          </div>

          {scaledData && (
            <div className="bg-cyan-50 rounded-lg p-4">
              <p className="font-semibold mb-2">
                Skaleret til {scaledData.target_volume_ml / 1000}L (faktor: {scaledData.scale_factor}x)
              </p>
              <p className="text-sm text-gray-700">
                Resultat: {scaledData.resulting_brix}°Bx (mål: {scaledData.target_brix}°Bx)
              </p>
              {scaledData.brix_adjustment && (
                <p className="text-sm text-orange-700 mt-2">
                  ⚠️ {scaledData.brix_adjustment}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ingredients */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{t('recipes.ingredients')}</h2>
          {user ? (
            <Button
              onClick={() => addMissingToShoppingList(recipe.ingredients)}
              data-testid="add-to-shopping-list"
              variant="outline"
            >
              <FaShoppingCart className="mr-2" /> Tilføj til Liste
            </Button>
          ) : (
            <Button
              onClick={() => toast.info('Log ind for at bruge indkøbsliste')}
              variant="outline"
              className="opacity-50 cursor-not-allowed"
              disabled
            >
              <FaShoppingCart className="mr-2" /> Tilføj til Liste (Kun Pro)
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {ingredientsToShow.map((ingredient, index) => {
            const mappingId = getMappingForIngredient(ingredient.name);
            
            return (
              <div
                key={index}
                data-testid={`ingredient-${index}`}
                className="p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <span className="font-medium">{ingredient.name}</span>
                    {ingredient.role === 'optional' && (
                      <span className="ml-2 text-xs text-gray-500">(valgfri)</span>
                    )}
                  </div>
                  <span className="font-semibold text-cyan-600">
                    {ingredient.quantity} {ingredient.unit}
                  </span>
                </div>
                {/* Show redirect links for ALL users */}
                {mappingId && (
                  <a
                    href={`${REDIRECT_API}/${mappingId}?country=${userCountry}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-colors"
                  >
                    <FaShoppingCart className="w-4 h-4" />
                    <span>Indkøb</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Steps */}
      {recipe.steps && recipe.steps.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold mb-4">{t('recipes.instructions')}</h2>
          <ol className="space-y-3">
            {recipe.steps.map((step, index) => (
              <li key={index} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </span>
                <p className="text-gray-700 pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Comments Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div 
          className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-6 px-6 py-3 rounded-xl transition-colors mb-4"
          onClick={() => setCommentsCollapsed(!commentsCollapsed)}
        >
          <h2 className="text-2xl font-bold">💬 Kommentarer ({comments.length})</h2>
          {commentsCollapsed ? (
            <FaChevronDown className="text-gray-400" size={20} />
          ) : (
            <FaChevronUp className="text-gray-400" size={20} />
          )}
        </div>
        
        {!commentsCollapsed && (
        <>
        {/* Add Comment - Pro users only */}
        {user && user.role !== 'guest' ? (
          <div className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Skriv en kommentar..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              rows="3"
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="mt-2 px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send kommentar
            </button>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-600 text-sm">
              ✨ <strong>Kun PRO-brugere kan kommentere.</strong> Opgrader for at deltage i diskussioner!
            </p>
          </div>
        )}

        {/* Comments List */}
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Ingen kommentarer endnu. Vær den første til at kommentere!</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                {/* Comment Header */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{comment.user_name}</span>
                      {comment.language && (
                        <span className="text-lg" title={comment.language}>
                          {getLanguageFlag(comment.language)}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-500 text-sm ml-2">
                      {new Date(comment.created_at).toLocaleDateString('da-DK', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {comment.updated_at && (
                      <span className="text-gray-400 text-xs ml-2">(redigeret)</span>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  {user && (user.id === comment.user_id || isAdmin) && (
                    <div className="flex gap-2">
                      {user.id === comment.user_id && (
                        <button
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditCommentText(comment.comment);
                          }}
                          className="text-blue-500 hover:text-blue-700 text-sm"
                        >
                          Rediger
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Slet
                      </button>
                    </div>
                  )}
                </div>

                {/* Comment Body */}
                {editingCommentId === comment.id ? (
                  <div className="mt-2">
                    <textarea
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                      rows="3"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleEditComment(comment.id)}
                        className="px-4 py-1.5 bg-cyan-500 text-white text-sm rounded-lg hover:bg-cyan-600"
                      >
                        Gem
                      </button>
                      <button
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditCommentText('');
                        }}
                        className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                      >
                        Annuller
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                )}

                {/* Like Button */}
                {user && user.role !== 'guest' && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleToggleLike(comment.id)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                        comment.liked_by?.includes(user?.id)
                          ? 'bg-cyan-100 text-cyan-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <FaHeart className={comment.liked_by?.includes(user?.id) ? 'text-cyan-500' : ''} />
                      <span>{comment.likes || 0}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};

export default RecipeDetailPage;