import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FaCheck, FaTimes, FaSearch, FaEye } from 'react-icons/fa';
import { API } from '../App';
import { Button } from '../components/ui/button';

const AdminSandboxPage = ({ sessionId }) => {
  const [pendingRecipes, setPendingRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [similarRecipes, setSimilarRecipes] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    fetchPendingRecipes();
  }, []);

  const fetchPendingRecipes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/admin/pending-recipes`);
      setPendingRecipes(response.data);
    } catch (error) {
      console.error('Error fetching pending recipes:', error);
      if (error.response?.status !== 403) {
        toast.error('Kunne ikke hente ventende opskrifter');
      }
    } finally {
      setLoading(false);
    }
  };

  const approveRecipe = async (recipeId) => {
    try {
      await axios.post(`${API}/admin/approve-recipe/${recipeId}`, {}, {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      toast.success('Opskrift godkendt!');
      fetchPendingRecipes();
      setSelectedRecipe(null);
    } catch (error) {
      console.error('Error approving recipe:', error);
      toast.error('Kunne ikke godkende opskrift');
    }
  };

  const rejectRecipe = async (recipeId) => {
    if (!rejectReason.trim()) {
      toast.error('Angiv en grund til afvisning');
      return;
    }

    try {
      setRejecting(true);
      await axios.post(`${API}/admin/reject-recipe/${recipeId}`, 
        { reason: rejectReason },
        { headers: { Authorization: `Bearer ${sessionId}` }}
      );
      toast.success('Opskrift afvist');
      fetchPendingRecipes();
      setSelectedRecipe(null);
      setShowRejectDialog(false);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting recipe:', error);
      toast.error('Kunne ikke afvise opskrift');
    } finally {
      setRejecting(false);
    }
  };

  const findSimilar = async (recipeId) => {
    try {
      setLoadingSimilar(true);
      const response = await axios.get(`${API}/admin/find-similar/${recipeId}`, {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      setSimilarRecipes(response.data);
    } catch (error) {
      console.error('Error finding similar recipes:', error);
      toast.error('Kunne ikke finde lignende opskrifter');
    } finally {
      setLoadingSimilar(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2">Sandkasse - Opskriftsgodkendelse</h1>
        <p className="text-gray-600">
          {pendingRecipes.length} opskrifter venter på godkendelse
        </p>
      </div>

      {pendingRecipes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-bold mb-2">Ingen ventende opskrifter</h3>
          <p className="text-gray-600">Alle opskrifter er behandlet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recipe List */}
          <div className="space-y-4">
            {pendingRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className={`bg-white rounded-2xl p-6 shadow-sm border-2 cursor-pointer transition-all ${
                  selectedRecipe?.id === recipe.id
                    ? 'border-blue-500 shadow-lg'
                    : 'border-gray-100 hover:border-blue-200'
                }`}
                onClick={() => setSelectedRecipe(recipe)}
              >
                <div className="flex items-start gap-4">
                  <img
                    src={recipe.image_url}
                    alt={recipe.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{recipe.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{recipe.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>👤 {recipe.author_name}</span>
                      <span>📅 {new Date(recipe.created_at).toLocaleDateString('da-DK')}</span>
                      <span>🥤 {recipe.ingredients?.length || 0} ingredienser</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recipe Details */}
          {selectedRecipe && (
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-6">
              <h2 className="text-2xl font-bold mb-4">{selectedRecipe.name}</h2>
              
              <img
                src={selectedRecipe.image_url}
                alt={selectedRecipe.name}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Beskrivelse:</h3>
                <p className="text-gray-700">{selectedRecipe.description}</p>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Ingredienser:</h3>
                <ul className="space-y-1">
                  {selectedRecipe.ingredients?.map((ing, idx) => (
                    <li key={idx} className="text-sm text-gray-700">
                      • {ing.quantity} {ing.unit} {ing.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <Button
                  onClick={() => findSimilar(selectedRecipe.id)}
                  disabled={loadingSimilar}
                  variant="outline"
                  className="w-full mb-2"
                >
                  <FaSearch className="mr-2" />
                  {loadingSimilar ? 'Søger...' : 'Find lignende opskrifter'}
                </Button>

                {similarRecipes.length > 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold mb-2 text-yellow-900">
                      ⚠️ {similarRecipes.length} lignende opskrifter fundet:
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {similarRecipes.map((sim, idx) => (
                        <li key={idx} className="text-yellow-800">
                          • <strong>{sim.name}</strong> - {sim.author_name} ({sim.match_reason})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => approveRecipe(selectedRecipe.id)}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  <FaCheck className="mr-2" />
                  Godkend
                </Button>
                <Button
                  onClick={() => setShowRejectDialog(true)}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  <FaTimes className="mr-2" />
                  Afvis
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Afvis Opskrift</h2>
            <p className="text-gray-700 mb-4">
              Angiv venligst en grund til afvisning af <strong>{selectedRecipe?.name}</strong>. 
              Brugeren vil modtage denne besked.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="F.eks. 'Lignende opskrift findes allerede' eller 'Mangelfuld beskrivelse'"
              className="w-full px-4 py-3 border rounded-lg mb-4 min-h-[100px]"
            />
            <div className="flex gap-3">
              <Button
                onClick={() => rejectRecipe(selectedRecipe.id)}
                disabled={rejecting || !rejectReason.trim()}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                {rejecting ? 'Afviser...' : 'Bekræft Afvisning'}
              </Button>
              <Button
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason('');
                }}
                variant="outline"
                className="flex-1"
                disabled={rejecting}
              >
                Annuller
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSandboxPage;
