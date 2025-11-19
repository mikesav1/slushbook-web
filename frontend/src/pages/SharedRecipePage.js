import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { FaCopy, FaUserPlus, FaExternalLinkAlt } from 'react-icons/fa';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';

const SharedRecipePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [sharedBy, setSharedBy] = useState('');
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchSharedRecipe();
  }, [token]);

  const fetchSharedRecipe = async () => {
    try {
      const response = await axios.get(`${API}/shared/${token}`);
      setRecipe(response.data.recipe);
      setSharedBy(response.data.shared_by);
    } catch (error) {
      console.error('Error fetching shared recipe:', error);
      if (error.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error('Kunne ikke hente delt opskrift');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyRecipe = async () => {
    if (!user) {
      toast.info('Du skal oprette en konto for at kopiere opskrifter');
      navigate('/signup');
      return;
    }

    setCopying(true);

    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await axios.post(
        `${API}/shared/${token}/copy`,
        {},
        {
          headers: { Authorization: `Bearer ${sessionToken}` }
        }
      );

      toast.success('Opskrift kopieret til dine opskrifter!');
      
      // Navigate to the copied recipe
      setTimeout(() => {
        navigate(`/recipes/${response.data.recipe_id}`);
      }, 1500);
    } catch (error) {
      console.error('Error copying recipe:', error);
      toast.error(error.response?.data?.detail || 'Kunne ikke kopiere opskrift');
    } finally {
      setCopying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Henter delt opskrift...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaExternalLinkAlt className="text-red-600 text-4xl" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Opskrift ikke fundet</h1>
          <p className="text-gray-600 mb-6">
            Denne deling eksisterer ikke eller er blevet tilbagekaldt af ejeren.
          </p>
          <Button onClick={() => navigate('/')}>Gå til forsiden</Button>
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Shared Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <FaExternalLinkAlt className="text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Delt Opskrift</h2>
            <p className="text-blue-100">Delt af {sharedBy}</p>
          </div>
        </div>
        
        {user ? (
          <Button
            onClick={copyRecipe}
            disabled={copying}
            className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50 font-semibold"
          >
            {copying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Kopierer...
              </>
            ) : (
              <>
                <FaCopy className="mr-2" />
                Kopier til Mine Opskrifter
              </>
            )}
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate('/signup')}
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold"
            >
              <FaUserPlus className="mr-2" />
              Opret konto for at gemme
            </Button>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="border-white text-white hover:bg-white hover:bg-opacity-10"
            >
              Har du allerede en konto? Log ind
            </Button>
          </div>
        )}
      </div>

      {/* Recipe Content */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Recipe Image */}
        {recipe.image_url && (
          <div className="w-full h-64 bg-gray-100">
            <img
              src={recipe.image_url}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Recipe Info */}
        <div className="p-6">
          <h1 className="text-4xl font-bold mb-4">{recipe.name}</h1>
          
          {recipe.description && (
            <p className="text-gray-600 text-lg mb-6">{recipe.description}</p>
          )}

          {/* Ingredients */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Ingredienser</h2>
            <div className="space-y-2">
              {recipe.ingredients?.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium">{ingredient.name}</span>
                  <span className="text-gray-600">
                    {ingredient.quantity} {ingredient.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          {recipe.instructions && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">Fremgangsmåde</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{recipe.instructions}</p>
              </div>
            </div>
          )}

          {/* Recipe Meta */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {recipe.category && (
                <div>
                  <span className="font-medium">Kategori:</span> {recipe.category}
                </div>
              )}
              {recipe.servings && (
                <div>
                  <span className="font-medium">Portioner:</span> {recipe.servings}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      {!user && (
        <div className="mt-6 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="text-xl font-bold mb-2">Kan du lide denne opskrift?</h3>
          <p className="text-gray-600 mb-4">
            Opret en gratis konto for at gemme denne opskrift og oprette dine egne!
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/signup')}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              Kom i gang gratis
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
            >
              Udforsk flere opskrifter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedRecipePage;
