import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { FaShare, FaTrash, FaEye, FaCopy, FaExternalLinkAlt } from 'react-icons/fa';
import { Button } from '../components/ui/button';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';

const ManageSharesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchAllShares();
  }, [user, navigate]);

  const fetchAllShares = async () => {
    try {
      const token = localStorage.getItem('session_token');
      
      // Get user's recipes
      const recipesResponse = await axios.get(`${API}/user/${user.id}/recipes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userRecipes = recipesResponse.data.recipes || [];
      
      // Build recipes map
      const recipesMap = {};
      userRecipes.forEach(recipe => {
        recipesMap[recipe.id] = recipe;
      });
      
      setRecipes(recipesMap);
      
      // Get shares for each recipe
      const allShares = [];
      for (const recipe of userRecipes) {
        try {
          const sharesResponse = await axios.get(`${API}/recipes/${recipe.id}/shares`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (sharesResponse.data.shares) {
            allShares.push(...sharesResponse.data.shares.map(share => ({
              ...share,
              recipe_name: recipe.name,
              recipe_id: recipe.id
            })));
          }
        } catch (error) {
          // Skip if no shares for this recipe
          console.error(`Error fetching shares for recipe ${recipe.id}:`, error);
        }
      }
      
      // Sort by created_at descending
      allShares.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setShares(allShares);
    } catch (error) {
      console.error('Error fetching shares:', error);
      toast.error('Kunne ikke hente delinger');
    } finally {
      setLoading(false);
    }
  };

  const revokeShare = async (recipeId, token) => {
    if (!window.confirm('Er du sikker på at du vil tilbagekalde denne deling? Linket vil blive inaktivt.')) {
      return;
    }

    try {
      const sessionToken = localStorage.getItem('session_token');
      await axios.delete(`${API}/recipes/${recipeId}/share/${token}`, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });

      toast.success('Deling tilbagekaldt!');
      
      // Remove from list
      setShares(shares.filter(s => s.token !== token));
    } catch (error) {
      console.error('Error revoking share:', error);
      toast.error('Kunne ikke tilbagekalde deling');
    }
  };

  const copyShareLink = (token) => {
    const link = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link kopieret!');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('da-DK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Henter delinger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Administrer Delinger</h1>
        <p className="text-gray-600">
          Se og administrer alle dine delte opskrifter
        </p>
      </div>

      {/* Stats Summary */}
      {shares.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <FaShare className="text-blue-600 text-2xl" />
              <h3 className="font-semibold text-gray-700">Aktive Delinger</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {shares.filter(s => s.active).length}
            </p>
          </div>

          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <FaEye className="text-purple-600 text-2xl" />
              <h3 className="font-semibold text-gray-700">Total Visninger</h3>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {shares.reduce((sum, s) => sum + (s.views || 0), 0)}
            </p>
          </div>

          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <FaCopy className="text-green-600 text-2xl" />
              <h3 className="font-semibold text-gray-700">Total Kopier</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {shares.reduce((sum, s) => sum + (s.copies || 0), 0)}
            </p>
          </div>
        </div>
      )}

      {/* Shares List */}
      {shares.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl">
          <FaShare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Ingen delinger endnu</h2>
          <p className="text-gray-600 mb-6">
            Gå til en af dine opskrifter og klik "Del Opskrift" for at oprette et delingslink
          </p>
          <Button onClick={() => navigate('/recipes')}>
            Gå til Mine Opskrifter
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {shares.map((share) => (
            <div
              key={share.token}
              className={`bg-white rounded-xl p-6 shadow-sm border ${
                share.active ? 'border-gray-200' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Recipe Info */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{share.recipe_name}</h3>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <FaEye />
                      <span>{share.views || 0} visninger</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaCopy />
                      <span>{share.copies || 0} kopier</span>
                    </div>
                    <div>
                      Oprettet: {formatDate(share.created_at)}
                    </div>
                  </div>

                  {/* Share Link */}
                  {share.active && (
                    <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                      <input
                        type="text"
                        value={`${window.location.origin}/shared/${share.token}`}
                        readOnly
                        className="flex-1 bg-transparent text-sm outline-none"
                      />
                      <Button
                        size="sm"
                        onClick={() => copyShareLink(share.token)}
                        variant="outline"
                      >
                        <FaCopy className="mr-1" />
                        Kopier
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => window.open(`/shared/${share.token}`, '_blank')}
                        variant="outline"
                      >
                        <FaExternalLinkAlt />
                      </Button>
                    </div>
                  )}

                  {!share.active && (
                    <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700 font-medium">
                        ⚠️ Denne deling er tilbagekaldt
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {share.active && (
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => revokeShare(share.recipe_id, share.token)}
                      variant="destructive"
                      size="sm"
                    >
                      <FaTrash className="mr-2" />
                      Tilbagekald
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageSharesPage;
