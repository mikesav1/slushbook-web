import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FaCheck, FaTimes, FaSearch, FaEye } from 'react-icons/fa';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

const AdminSandboxPage = ({ sessionId }) => {
  const [allRecipes, setAllRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [similarRecipes, setSimilarRecipes] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState({});
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllRecipes();
  }, []);

  const fetchAllRecipes = async () => {
    try {
      setLoading(true);
      // Fetch all user recipes with approval_status (pending, approved, rejected) for admin
      const response = await axios.get(`${API}/admin/pending-recipes`, {
        withCredentials: true
      });
      setAllRecipes(response.data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast.error('Kunne ikke hente opskrifter');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRecipes = () => {
    if (activeTab === 'all') return allRecipes;
    if (activeTab === 'pending') return allRecipes.filter(r => r.approval_status === 'pending');
    if (activeTab === 'approved') return allRecipes.filter(r => r.approval_status === 'approved');
    if (activeTab === 'rejected') return allRecipes.filter(r => r.approval_status === 'rejected');
    return allRecipes;
  };

  const filteredRecipes = getFilteredRecipes();

  const approveRecipe = async (recipeId) => {
    try {
      await axios.post(`${API}/admin/approve-recipe/${recipeId}`);
      toast.success('Opskrift godkendt!');
      fetchAllRecipes();
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
        { reason: rejectReason }
      );
      toast.success('Opskrift afvist');
      fetchAllRecipes();
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

  const hideFromSandbox = async (recipeId) => {
    try {
      await axios.post(`${API}/admin/hide-from-sandbox/${recipeId}`, {}, {
        withCredentials: true
      });
      toast.success('Opskrift fjernet fra sandkasse');
      fetchAllRecipes();
    } catch (error) {
      console.error('Error hiding recipe:', error);
      toast.error('Kunne ikke fjerne opskrift');
    }
  };

  const findSimilar = async (recipeId) => {
    try {
      setLoadingSimilar(prev => ({ ...prev, [recipeId]: true }));
      const response = await axios.get(`${API}/admin/find-similar/${recipeId}`);
      setSimilarRecipes(response.data);
      setSelectedRecipe(allRecipes.find(r => r.id === recipeId));
      
      if (response.data.length === 0) {
        toast.info('Ingen lignende opskrifter fundet');
      } else {
        toast.success(`Fandt ${response.data.length} lignende opskrifter`);
      }
    } catch (error) {
      console.error('Error finding similar recipes:', error);
      toast.error('Kunne ikke finde lignende opskrifter');
    } finally {
      setLoadingSimilar(prev => ({ ...prev, [recipeId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const pendingCount = allRecipes.filter(r => r.approval_status === 'pending').length;
  const approvedCount = allRecipes.filter(r => r.approval_status === 'approved').length;
  const rejectedCount = allRecipes.filter(r => r.approval_status === 'rejected').length;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2">Opskrifts-Sandkasse</h1>
        <p className="text-gray-600">
          Godkend eller afvis opskrifter fra Pro-brugere
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Alle ({allRecipes.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'pending'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Afventer ({pendingCount})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'approved'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Godkendte ({approvedCount})
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'rejected'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Afviste ({rejectedCount})
        </button>
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-bold mb-2">Ingen opskrifter i denne kategori</h3>
          <p className="text-gray-600">
            {activeTab === 'pending' && 'Alle opskrifter er behandlet'}
            {activeTab === 'approved' && 'Ingen godkendte opskrifter endnu'}
            {activeTab === 'rejected' && 'Ingen afviste opskrifter'}
            {activeTab === 'all' && 'Ingen opskrifter tilgængelige'}
          </p>
        </div>
      ) : (
        <>
          {/* Kompakt liste for Godkendte og Afviste tabs */}
          {(activeTab === 'approved' || activeTab === 'rejected') ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="divide-y divide-gray-100">
                {filteredRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={recipe.image_url}
                        alt={recipe.name}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0 cursor-pointer"
                        onClick={() => window.open(`/recipes/${recipe.id}`, '_blank')}
                      />
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => window.open(`/recipes/${recipe.id}`, '_blank')}>
                        <h3 className="font-semibold text-lg truncate">{recipe.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span>👤 {recipe.author_name}</span>
                          <span>📅 {new Date(recipe.created_at).toLocaleDateString('da-DK')}</span>
                          <span>🥤 {recipe.ingredients?.length || 0} ingredienser</span>
                        </div>
                        {recipe.approval_status === 'rejected' && recipe.rejection_reason && (
                          <p className="text-xs text-red-600 mt-1 truncate">
                            <strong>Afvist:</strong> {recipe.rejection_reason}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          recipe.approval_status === 'approved' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {recipe.approval_status === 'approved' ? '✓ Godkendt' : '✗ Afvist'}
                        </span>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            hideFromSandbox(recipe.id);
                          }}
                          variant="outline"
                          className="text-xs px-2 py-1 h-auto border-gray-300 hover:bg-gray-100"
                        >
                          Fjern fra liste
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'all' ? (
            /* Alle tab: Blandet visning - pending som kort, godkendte/afviste som kompakt */
            <>
              {/* Pending opskrifter - fuld kort visning */}
              {filteredRecipes.filter(r => r.approval_status === 'pending').length > 0 && (
                <div>
                  <h2 className="text-lg font-bold mb-4">Afventer Godkendelse</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {filteredRecipes.filter(r => r.approval_status === 'pending').map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <img
                src={recipe.image_url}
                alt={recipe.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-bold text-xl mb-2">{recipe.name}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{recipe.description}</p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span>👤 {recipe.author_name}</span>
                  <span>📅 {new Date(recipe.created_at).toLocaleDateString('da-DK')}</span>
                  <span>🥤 {recipe.ingredients?.length || 0} ingredienser</span>
                </div>

                {recipe.approval_status === 'rejected' && recipe.rejection_reason && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-800">
                      <strong>Afvist:</strong> {recipe.rejection_reason}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => {
                      setSelectedRecipe(recipe);
                      setShowPreviewDialog(true);
                    }}
                    className="w-full bg-blue-500 hover:bg-blue-600"
                  >
                    <FaEye className="mr-2" />
                    Preview
                  </Button>
                  
                  <Button
                    onClick={() => findSimilar(recipe.id)}
                    disabled={loadingSimilar[recipe.id]}
                    className="w-full bg-purple-500 hover:bg-purple-600"
                  >
                    <FaSearch className="mr-2" />
                    {loadingSimilar[recipe.id] ? 'Søger...' : 'Tjek for Dublet'}
                  </Button>

                  {recipe.approval_status === 'pending' && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        onClick={() => approveRecipe(recipe.id)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-sm"
                      >
                        <FaCheck className="mr-1" />
                        Godkend
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedRecipe(recipe);
                          setShowRejectDialog(true);
                        }}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-sm"
                      >
                        <FaTimes className="mr-1" />
                        Afvis
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
          )}
        </>
      )}

      {/* Preview Dialog */}
      {showPreviewDialog && selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{selectedRecipe.name}</h2>
              <button
                onClick={() => {
                  setShowPreviewDialog(false);
                  setSelectedRecipe(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
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

            <div className="mb-4">
              <h3 className="font-semibold mb-2">Fremgangsmåde:</h3>
              <ol className="space-y-2">
                {selectedRecipe.steps?.map((step, idx) => (
                  <li key={idx} className="text-sm text-gray-700">
                    {idx + 1}. {step}
                  </li>
                ))}
              </ol>
            </div>

            <Button
              onClick={() => navigate(`/recipes/${selectedRecipe.id}`)}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              Åbn fuld opskrift
            </Button>
          </div>
        </div>
      )}

      {/* Similar Recipes Dialog */}
      {similarRecipes.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-yellow-900">⚠️ Lignende opskrifter fundet</h2>
                <p className="text-sm text-gray-600">Tjek om opskriften allerede findes</p>
              </div>
              <button
                onClick={() => {
                  setSimilarRecipes([]);
                  setSelectedRecipe(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              {similarRecipes.map((sim, idx) => (
                <div key={idx} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-900">{sim.name}</h4>
                  <p className="text-sm text-yellow-800">
                    Forfatter: {sim.author_name}
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Match grund: {sim.match_reason}
                  </p>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setSimilarRecipes([])}
              className="w-full mt-4"
              variant="outline"
            >
              Luk
            </Button>
          </div>
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
            
            {/* Quick Reason Buttons */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Hurtig valg:</p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setRejectReason('Copyright krænkelse: Billedet eller indholdet overtræder ophavsretten')}
                  className="text-left px-3 py-2 text-sm bg-red-50 hover:bg-red-100 border border-red-200 rounded"
                >
                  🚫 Copyright krænkelse
                </button>
                <button
                  type="button"
                  onClick={() => setRejectReason('Lignende opskrift findes allerede i systemet')}
                  className="text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded"
                >
                  📋 Duplikat opskrift
                </button>
                <button
                  type="button"
                  onClick={() => setRejectReason('Mangelfuld beskrivelse eller manglende ingredienser')}
                  className="text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded"
                >
                  📝 Ufuldstændig information
                </button>
                <button
                  type="button"
                  onClick={() => setRejectReason('Upassende indhold eller spam')}
                  className="text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded"
                >
                  ⚠️ Upassende indhold
                </button>
              </div>
            </div>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Eller skriv din egen begrundelse..."
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
