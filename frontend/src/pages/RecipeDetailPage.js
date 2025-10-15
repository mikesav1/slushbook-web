import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { FaHeart, FaRegHeart, FaStar, FaWineBottle, FaShoppingCart, FaArrowLeft, FaBalanceScale } from 'react-icons/fa';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';

const RecipeDetailPage = ({ sessionId }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scaledData, setScaledData] = useState(null);
  const [targetVolume, setTargetVolume] = useState(12000);
  const [machines, setMachines] = useState([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchRecipe();
    fetchMachines();
    fetchProducts();
  }, [id, sessionId]);

  const fetchRecipe = async () => {
    try {
      const response = await axios.get(`${API}/recipes/${id}?session_id=${sessionId}`);
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
        setTargetVolume(defaultMachine.tank_volumes_ml[0]);
      }
    } catch (error) {
      console.error('Error fetching machines:', error);
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

  const scaleRecipe = async () => {
    try {
      const response = await axios.post(`${API}/scale`, {
        recipe_id: id,
        target_volume_ml: targetVolume,
        margin_pct: 5
      });
      setScaledData(response.data);
      toast.success('Opskrift skaleret!');
    } catch (error) {
      console.error('Error scaling recipe:', error);
      toast.error('Kunne ikke skalere opskrift');
    }
  };

  const toggleFavorite = async () => {
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
      for (const ingredient of ingredients) {
        if (ingredient.role === 'required') {
          await axios.post(`${API}/shopping-list`, {
            session_id: sessionId,
            ingredient_name: ingredient.name,
            category_key: ingredient.category_key,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            linked_recipe_id: id,
            linked_recipe_name: recipe.name
          });
        }
      }
      toast.success('Tilføjet til indkøbsliste!');
    } catch (error) {
      console.error('Error adding to shopping list:', error);
      toast.error('Nogle ingredienser kunne ikke tilføjes');
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

  const ingredientsToShow = scaledData ? scaledData.scaled_ingredients : recipe.ingredients;

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in" data-testid="recipe-detail-page">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        data-testid="back-button"
        className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 font-semibold"
      >
        <FaArrowLeft /> Tilbage
      </button>

      {/* Header - Two Column Layout */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Left: Description & Info */}
          <div className="p-6 md:p-8 flex flex-col justify-center order-2 md:order-1">
            <div className="mb-4">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{recipe.name}</h1>
              <div className="flex flex-wrap gap-2 mb-4">
                {recipe.type && (
                  <span className="px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full text-sm font-semibold capitalize">
                    {recipe.type}
                  </span>
                )}
                <span className="brix-indicator text-xs" title="Sukkergrad - Perfekt slush: 13-15°Bx">
                  {recipe.target_brix}°Bx
                </span>
                {recipe.alcohol_flag && (
                  <span className="alcohol-badge text-xs">
                    <FaWineBottle /> 18+
                  </span>
                )}
              </div>
            </div>
            
            <p className="text-gray-700 text-base md:text-lg mb-4">{recipe.description}</p>
            
            {/* Info */}
            <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
              <span>📏 Basis: {recipe.base_volume_ml || 2700}ml</span>
              <span>🍬 Sukkergrad: {recipe.target_brix}°Bx</span>
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
              {recipe.author === sessionId && (
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
          <h2 className="text-2xl font-bold">Ingredienser</h2>
          <Button
            onClick={() => addMissingToShoppingList(recipe.ingredients)}
            data-testid="add-to-shopping-list"
            variant="outline"
          >
            <FaShoppingCart className="mr-2" /> Tilføj til Liste
          </Button>
        </div>
        <div className="space-y-3">
          {ingredientsToShow.map((ingredient, index) => {
            const product = getProductForIngredient(ingredient.category_key);
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
                {product && (
                  <a
                    href={product.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick(product.id)}
                    className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    🛒 Køb hos {product.brand?.name || 'leverandør'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-4">Fremgangsmåde</h2>
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
    </div>
  );
};

export default RecipeDetailPage;