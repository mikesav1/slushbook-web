import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FaCheck, FaImage, FaSearch } from 'react-icons/fa';
import { Button } from '../components/ui/button';
import { API } from '../App';

const AdminMatchImagesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/admin/match-images`, {
        withCredentials: true
      });
      setRecipes(response.data.recipes);
      setImages(response.data.images);
      toast.success(`Hentet ${response.data.recipes.length} opskrifter og ${response.data.images.length} billeder`);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Kunne ikke hente data');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (imageUrl) => {
    if (!selectedRecipe) {
      toast.error('Vælg først en opskrift');
      return;
    }

    try {
      setUpdating(true);
      await axios.post(`${API}/admin/update-recipe-image`, {
        recipe_id: selectedRecipe.id,
        image_url: imageUrl
      }, {
        withCredentials: true
      });

      // Update local state
      setRecipes(recipes.map(r => 
        r.id === selectedRecipe.id ? { ...r, image_url: imageUrl } : r
      ));

      toast.success(`Billede opdateret for "${selectedRecipe.name}"`);
      setSelectedRecipe(null);
    } catch (error) {
      console.error('Error updating image:', error);
      toast.error('Kunne ikke opdatere billede');
    } finally {
      setUpdating(false);
    }
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recipesWithoutCloudinary = recipes.filter(r => 
    !r.image_url.includes('cloudinary')
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Henter data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🖼️ Match Billeder til Opskrifter
          </h1>
          <p className="text-gray-600">
            {recipesWithoutCloudinary} opskrifter mangler billeder • {images.length} billeder tilgængelige
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Søg opskrift..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recipes List */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaImage className="text-cyan-600" />
              Opskrifter ({filteredRecipes.length})
            </h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredRecipes.map(recipe => (
                <div
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedRecipe?.id === recipe.id
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-200 hover:border-cyan-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {recipe.image_url.includes('cloudinary') ? (
                      <FaCheck className="text-green-500 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-300 rounded flex-shrink-0"></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{recipe.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{recipe.description}</p>
                    </div>
                    {recipe.image_url.includes('cloudinary') && (
                      <img
                        src={recipe.image_url}
                        alt={recipe.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Images Grid */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Cloudinary Billeder ({images.length})
            </h2>
            {selectedRecipe ? (
              <div className="mb-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                <p className="text-sm font-semibold text-cyan-900">
                  Vælger billede til: <span className="font-bold">{selectedRecipe.name}</span>
                </p>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="text-xs text-cyan-600 hover:text-cyan-800 underline mt-1"
                >
                  Annuller
                </button>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-900">
                  👈 Vælg en opskrift til venstre først
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
              {images.map((image, index) => (
                <div
                  key={index}
                  onClick={() => handleImageSelect(image.url)}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedRecipe
                      ? 'hover:border-cyan-500 hover:shadow-lg'
                      : 'opacity-50 cursor-not-allowed border-gray-200'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={`Cloudinary ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  {selectedRecipe && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                      <Button className="opacity-0 group-hover:opacity-100 transition-opacity bg-cyan-600">
                        Vælg
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {updating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Opdaterer billede...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMatchImagesPage;
