import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaStar, FaWineBottle } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../App';

const RecipeCard = ({ recipe, sessionId, showMatchInfo }) => {
  const [isFavorite, setIsFavorite] = useState(recipe.is_favorite || false);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    try {
      if (isFavorite) {
        await axios.delete(`${API}/favorites/${sessionId}/${recipe.id}`);
        toast.success('Fjernet fra favoritter');
      } else {
        await axios.post(`${API}/favorites?session_id=${sessionId}&recipe_id=${recipe.id}`);
        toast.success('Tilføjet til favoritter');
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Kunne ikke opdatere favorit');
    }
  };

  const getColorClass = (color) => {
    const colors = {
      red: 'from-red-500 to-red-600',
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      yellow: 'from-yellow-400 to-yellow-500',
      orange: 'from-orange-500 to-orange-600',
      pink: 'from-pink-500 to-pink-600',
      purple: 'from-purple-500 to-purple-600',
      brown: 'from-amber-700 to-amber-800'
    };
    return colors[color] || colors.blue;
  };

  return (
    <Link
      to={`/recipe/${recipe.id}`}
      data-testid={`recipe-card-${recipe.id}`}
      className="flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all hover:scale-105 overflow-hidden border border-gray-100"
    >
      {/* Image/Color Header - Portrait */}
      <div className="h-64 relative overflow-hidden flex-shrink-0">
        {recipe.image_url && recipe.image_url !== '/api/images/placeholder.jpg' ? (
          <img 
            src={recipe.image_url} 
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getColorClass(recipe.color)}`}></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        <div className="absolute top-4 right-4 flex gap-2">
          {recipe.alcohol_flag && (
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <FaWineBottle size={12} /> 18+
            </span>
          )}
          <button
            onClick={toggleFavorite}
            data-testid={`favorite-button-${recipe.id}`}
            className="bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
          >
            {isFavorite ? (
              <FaHeart className="text-red-500" />
            ) : (
              <FaRegHeart className="text-gray-600" />
            )}
          </button>
        </div>
        <div className="absolute bottom-4 left-4">
          {recipe.type && (
            <img 
              src={`/icons/${recipe.type}.png`} 
              alt={recipe.type}
              className="w-10 h-10 rounded-full border-2 border-white shadow-lg bg-white"
              onError={(e) => {
                // Fallback to color circle if icon not found
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'inline-block';
              }}
            />
          )}
          <span 
            className={`inline-block w-6 h-6 rounded-full border-2 border-white shadow-lg color-${recipe.color}`}
            style={{ display: recipe.type ? 'none' : 'inline-block' }}
          ></span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-lg mb-2 line-clamp-1">{recipe.name}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{recipe.description}</p>

        {/* Match Info */}
        {showMatchInfo && showMatchInfo.match && (
          <div className="mb-3">
            <div
              className={`match-indicator ${
                showMatchInfo.match.can_make_now
                  ? 'can-make'
                  : showMatchInfo.match.almost
                  ? 'almost'
                  : 'need-more'
              }`}
            >
              {showMatchInfo.match.can_make_now
                ? '✓ Kan laves nu!'
                : showMatchInfo.match.almost
                ? `Mangler ${showMatchInfo.match.missing.length}`
                : `Behøver ${showMatchInfo.match.missing.length} mere`}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {recipe.tags?.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Spacer to push footer to bottom */}
        <div className="flex-grow"></div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
          <span className="brix-indicator">
            {recipe.target_brix}°Bx
          </span>
          {recipe.rating_avg > 0 && (
            <div className="flex items-center gap-1 text-yellow-500">
              <FaStar size={14} />
              <span className="text-sm font-semibold text-gray-700">
                {recipe.rating_avg.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">({recipe.rating_count})</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default RecipeCard;