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

  useEffect(() => {
    fetchRecipe();
    fetchMachines();
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

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`h-64 bg-gradient-to-br from-${recipe.color}-500 to-${recipe.color}-600 relative`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-24 text-white">
            <h1 className="text-4xl font-bold mb-2">{recipe.name}</h1>
            <div className="flex flex-wrap gap-3 items-center">
              <span className={`color-badge color-${recipe.color}`}></span>
              <span className="brix-indicator">{recipe.target_brix}°Bx</span>
              {recipe.alcohol_flag && (
                <span className="alcohol-badge">
                  <FaWineBottle /> 18+
                </span>
              )}
            </div>
          </div>
          <div className="absolute top-6 right-6">
            <button
              onClick={toggleFavorite}
              data-testid="toggle-favorite-button"
              className="bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-white transition-colors"
            >
              {recipe.is_favorite ? (
                <FaHeart className="text-red-500" size={24} />
              ) : (
                <FaRegHeart className="text-gray-600" size={24} />
              )}
            </button>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-700 text-lg mb-4">{recipe.description}</p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {recipe.tags?.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium"
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
                    size={24}
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
          {ingredientsToShow.map((ingredient, index) => (
            <div
              key={index}
              data-testid={`ingredient-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
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
          ))}
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