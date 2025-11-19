import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaHeart } from 'react-icons/fa';
import { API } from '../App';
import RecipeCard from '../components/RecipeCard';
import { useTranslation } from 'react-i18next';

const FavoritesPage = ({ sessionId }) => {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, [sessionId]);

  const fetchFavorites = async () => {
    try {
      const response = await axios.get(`${API}/favorites/${sessionId}`);
      setFavorites(response.data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 fade-in" data-testid="favorites-page">
      <div>
        <h1 className="text-4xl font-bold mb-2">Mine Favoritter</h1>
        <p className="text-gray-600">{favorites.length} favorit opskrift{favorites.length !== 1 ? 'er' : ''}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      ) : favorites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FaHeart /></div>
          <h3 className="text-xl font-bold mb-2">Ingen favoritter endnu</h3>
          <p className="text-gray-600">Tilføj dine yndlings opskrifter her</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {favorites.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} sessionId={sessionId} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;