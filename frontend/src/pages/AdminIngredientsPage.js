import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FaPlus, FaEdit, FaTrash, FaSeedling } from 'react-icons/fa';
import { Button } from '../components/ui/button';
import { API } from '../App';

const AdminIngredientsPage = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Sirup',
    default_brix: 0,
    keywords: ''
  });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/admin/ingredients`, {
        withCredentials: true
      });
      setIngredients(response.data);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      toast.error('Kunne ikke hente ingredienser');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Angiv et navn');
      return;
    }

    try {
      setSaving(true);
      
      if (editingIngredient) {
        // Update
        await axios.put(`${API}/admin/ingredients/${editingIngredient.id}`, formData, {
          withCredentials: true
        });
        toast.success('Ingrediens opdateret!');
      } else {
        // Create
        await axios.post(`${API}/admin/ingredients`, formData, {
          withCredentials: true
        });
        toast.success('Ingrediens oprettet!');
      }
      
      fetchIngredients();
      setShowDialog(false);
      setEditingIngredient(null);
      setFormData({ name: '', category: 'Sirup', default_brix: 0, keywords: '' });
    } catch (error) {
      console.error('Error saving ingredient:', error);
      toast.error(error.response?.data?.detail || 'Kunne ikke gemme ingrediens');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Er du sikker på at du vil slette "${name}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API}/admin/ingredients/${id}`, {
        withCredentials: true
      });
      toast.success('Ingrediens slettet!');
      fetchIngredients();
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      toast.error('Kunne ikke slette ingrediens');
    }
  };

  const handleEdit = (ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      category: ingredient.category || 'Sirup',
      default_brix: ingredient.default_brix || 0
    });
    setShowDialog(true);
  };

  const handleSeedData = async () => {
    if (!window.confirm('Dette vil tilføje standard ingredienser. Fortsæt?')) {
      return;
    }

    try {
      const response = await axios.post(`${API}/admin/ingredients/seed`, {}, {
        withCredentials: true
      });
      toast.success(response.data.message);
      fetchIngredients();
    } catch (error) {
      console.error('Error seeding ingredients:', error);
      toast.error('Kunne ikke tilføje seed data');
    }
  };

  const filteredIngredients = ingredients.filter(ing =>
    ing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ing.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['Sirup', 'Energidrik', 'Sodavand', 'Juice', 'Alkohol', 'Basis', 'Frugt', 'Grønt', 'Krydderi', 'Andet'];

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
        <h1 className="text-4xl font-bold mb-2">Admin: Ingredienser</h1>
        <p className="text-gray-600">
          Administrer master ingrediens-listen for "Hurtig Tilføjelse"
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          <input
            type="text"
            placeholder="Søg efter ingrediens eller kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSeedData}
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50"
            >
              <FaSeedling className="mr-2" />
              Importer Seed Data
            </Button>
            <Button
              onClick={() => {
                setEditingIngredient(null);
                setFormData({ name: '', category: 'Sirup', default_brix: 0, keywords: '' });
                setShowDialog(true);
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-500"
            >
              <FaPlus className="mr-2" />
              Tilføj Ingrediens
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          {filteredIngredients.length} ingredienser
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold">Navn</th>
                <th className="text-left py-3 px-4 font-semibold">Kategori</th>
                <th className="text-left py-3 px-4 font-semibold">Standard Brix</th>
                <th className="text-right py-3 px-4 font-semibold">Handlinger</th>
              </tr>
            </thead>
            <tbody>
              {filteredIngredients.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-gray-500">
                    Ingen ingredienser fundet
                  </td>
                </tr>
              ) : (
                filteredIngredients.map((ingredient) => (
                  <tr key={ingredient.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{ingredient.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {ingredient.category || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">{ingredient.default_brix || 0}%</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(ingredient)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(ingredient.id, ingredient.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              {editingIngredient ? 'Rediger Ingrediens' : 'Tilføj Ingrediens'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Navn</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="F.eks. Jordbær sirup"
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Standard Brix (%)</label>
                <input
                  type="number"
                  value={formData.default_brix}
                  onChange={(e) => setFormData({ ...formData, default_brix: parseFloat(e.target.value) || 0 })}
                  placeholder="0-100"
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Keywords (søgeord)
                  <span className="text-xs text-gray-500 ml-2">Valgfrit - komma-separeret</span>
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="F.eks. Fanta, Appelsin sodavand, Orange"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tilføj produktnavne og alternative søgeord (komma-separeret)
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  {saving ? 'Gemmer...' : (editingIngredient ? 'Opdater' : 'Opret')}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowDialog(false);
                    setEditingIngredient(null);
                    setFormData({ name: '', category: 'Sirup', default_brix: 0, keywords: '' });
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={saving}
                >
                  Annuller
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIngredientsPage;
