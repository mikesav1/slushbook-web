import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FaPlus, FaTrash, FaBox } from 'react-icons/fa';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

const PantryPage = ({ sessionId }) => {
  const [pantryItems, setPantryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    ingredient_name: '',
    category_key: '',
    quantity: 0,
    unit: 'ml',
    brix: null
  });

  useEffect(() => {
    fetchPantry();
  }, [sessionId]);

  const fetchPantry = async () => {
    try {
      const response = await axios.get(`${API}/pantry/${sessionId}`);
      setPantryItems(response.data);
    } catch (error) {
      console.error('Error fetching pantry:', error);
      toast.error('Kunne ikke hente pantry');
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.ingredient_name || !newItem.category_key) {
      toast.error('Udfyld venligst navn og kategori');
      return;
    }

    try {
      await axios.post(`${API}/pantry`, {
        session_id: sessionId,
        ...newItem,
        brix: newItem.brix ? parseFloat(newItem.brix) : null
      });
      toast.success('Ingrediens tilføjet!');
      setIsAddDialogOpen(false);
      setNewItem({
        ingredient_name: '',
        category_key: '',
        quantity: 0,
        unit: 'ml',
        brix: null
      });
      fetchPantry();
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Kunne ikke tilføje ingrediens');
    }
  };

  const deleteItem = async (ingredientName) => {
    try {
      await axios.delete(`${API}/pantry/${sessionId}/${encodeURIComponent(ingredientName)}`);
      toast.success('Ingrediens fjernet');
      fetchPantry();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Kunne ikke fjerne ingrediens');
    }
  };

  const commonIngredients = [
    { name: 'Jordbær sirup', category: 'sirup.baer.jordbaer', brix: 65 },
    { name: 'Citron sirup', category: 'sirup.citrus.citron', brix: 65 },
    { name: 'Blå curaçao sirup', category: 'sirup.blue', brix: 60 },
    { name: 'Cola sirup', category: 'sirup.cola', brix: 68 },
    { name: 'Appelsin sirup', category: 'sirup.citrus.appelsin', brix: 65 },
    { name: 'Vand/knust is', category: 'base.vand', brix: 0 },
    { name: 'Mynte sirup', category: 'sirup.mynte', brix: 60 },
    { name: 'Kokos sirup', category: 'sirup.kokos', brix: 65 }
  ];

  const quickAdd = async (ingredient) => {
    try {
      await axios.post(`${API}/pantry`, {
        session_id: sessionId,
        ingredient_name: ingredient.name,
        category_key: ingredient.category,
        quantity: 500,
        unit: 'ml',
        brix: ingredient.brix
      });
      toast.success(`${ingredient.name} tilføjet!`);
      fetchPantry();
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Ingrediens findes måske allerede');
    }
  };

  return (
    <div className="space-y-6 fade-in" data-testid="pantry-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Mine ingredienser</h1>
          <p className="text-gray-600">Administrer dine ingredienser</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-pantry-button" className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700">
              <FaPlus className="mr-2" /> Tilføj Ingrediens
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tilføj Ingrediens</DialogTitle>
            </DialogHeader>
            <form onSubmit={addItem} className="space-y-4">
              <div>
                <Label>Navn *</Label>
                <Input
                  data-testid="ingredient-name-input"
                  value={newItem.ingredient_name}
                  onChange={(e) => setNewItem({...newItem, ingredient_name: e.target.value})}
                  placeholder="fx Jordbær sirup"
                />
              </div>
              <div>
                <Label>Kategori *</Label>
                <Input
                  data-testid="ingredient-category-input"
                  value={newItem.category_key}
                  onChange={(e) => setNewItem({...newItem, category_key: e.target.value})}
                  placeholder="fx sirup.baer.jordbaer"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mængde</Label>
                  <Input
                    type="number"
                    data-testid="ingredient-quantity-input"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Enhed</Label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                  >
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="g">g</option>
                    <option value="stk">stk</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Brix (valgfrit)</Label>
                <Input
                  type="number"
                  data-testid="ingredient-brix-input"
                  value={newItem.brix || ''}
                  onChange={(e) => setNewItem({...newItem, brix: e.target.value})}
                  placeholder="fx 65"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="submit-ingredient">
                Tilføj
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Add */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold mb-3">Hurtig Tilføjelse</h3>
        <div className="flex flex-wrap gap-2">
          {commonIngredients.map((ingredient, index) => (
            <button
              key={index}
              onClick={() => quickAdd(ingredient)}
              data-testid={`quick-add-${ingredient.name}`}
              className="px-4 py-2 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 transition-colors text-sm font-medium"
            >
              + {ingredient.name}
            </button>
          ))}
        </div>
      </div>

      {/* Pantry Items */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      ) : pantryItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FaBox /></div>
          <h3 className="text-xl font-bold mb-2">Dine ingredienser er tomme</h3>
          <p className="text-gray-600 mb-4">Tilføj ingredienser for at få opskrift-forslag</p>
          <Button onClick={() => setIsAddDialogOpen(true)} data-testid="empty-add-button">
            <FaPlus className="mr-2" /> Tilføj Første Ingrediens
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {pantryItems.map((item) => (
            <div
              key={item.id}
              data-testid={`pantry-item-${item.ingredient_name}`}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{item.ingredient_name}</h3>
                <p className="text-sm text-gray-600">
                  {item.quantity} {item.unit}
                  {item.brix && ` • ${item.brix}°Bx`}
                </p>
                <p className="text-xs text-gray-400 mt-1">{item.category_key}</p>
              </div>
              <button
                onClick={() => deleteItem(item.ingredient_name)}
                data-testid={`delete-${item.ingredient_name}`}
                className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PantryPage;