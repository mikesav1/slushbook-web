import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FaTrash, FaShoppingCart, FaCheck } from 'react-icons/fa';
import { API } from '../App';
import { Button } from '../components/ui/button';

const ShoppingListPage = ({ sessionId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchShoppingList();
    fetchProducts();
  }, [sessionId]);

  const fetchShoppingList = async () => {
    try {
      const response = await axios.get(`${API}/shopping-list/${sessionId}`);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching shopping list:', error);
      toast.error('Kunne ikke hente indkøbsliste');
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = async (itemId, currentChecked) => {
    try {
      await axios.put(`${API}/shopping-list/${itemId}`, null, {
        params: { checked: !currentChecked }
      });
      setItems(items.map(item =>
        item.id === itemId ? { ...item, checked: !currentChecked } : item
      ));
    } catch (error) {
      console.error('Error toggling item:', error);
      toast.error('Kunne ikke opdatere');
    }
  };

  const deleteItem = async (itemId) => {
    try {
      await axios.delete(`${API}/shopping-list/${itemId}`);
      setItems(items.filter(item => item.id !== itemId));
      toast.success('Fjernet fra liste');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Kunne ikke fjerne');
    }
  };

  const clearCompleted = async () => {
    const completedItems = items.filter(item => item.checked);
    try {
      for (const item of completedItems) {
        await axios.delete(`${API}/shopping-list/${item.id}`);
      }
      setItems(items.filter(item => !item.checked));
      toast.success('Fjernet afkrydsede');
    } catch (error) {
      console.error('Error clearing completed:', error);
      toast.error('Kunne ikke rydde liste');
    }
  };

  const groupedItems = items.reduce((acc, item) => {
    const recipeName = item.linked_recipe_name || 'Generelt';
    if (!acc[recipeName]) acc[recipeName] = [];
    acc[recipeName].push(item);
    return acc;
  }, {});

  const uncheckedCount = items.filter(item => !item.checked).length;

  return (
    <div className="space-y-6 fade-in" data-testid="shopping-list-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Indkøbsliste</h1>
          <p className="text-gray-600">
            {uncheckedCount} ingrediens{uncheckedCount !== 1 ? 'er' : ''} tilbage
          </p>
        </div>
        {items.some(item => item.checked) && (
          <Button
            onClick={clearCompleted}
            data-testid="clear-completed-button"
            variant="outline"
          >
            Ryd Afkrydsede
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FaShoppingCart /></div>
          <h3 className="text-xl font-bold mb-2">Din indkøbsliste er tom</h3>
          <p className="text-gray-600">Tilføj manglende ingredienser fra opskrifter</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([recipeName, recipeItems]) => (
            <div key={recipeName} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg mb-4 text-cyan-600">{recipeName}</h3>
              <div className="space-y-2">
                {recipeItems.map((item) => (
                  <div
                    key={item.id}
                    data-testid={`shopping-item-${item.id}`}
                    className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                      item.checked ? 'bg-gray-50 opacity-60' : 'bg-cyan-50'
                    }`}
                  >
                    <button
                      onClick={() => toggleCheck(item.id, item.checked)}
                      data-testid={`check-${item.id}`}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        item.checked
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 hover:border-cyan-500'
                      }`}
                    >
                      {item.checked && <FaCheck className="text-white" size={12} />}
                    </button>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        item.checked ? 'line-through text-gray-500' : 'text-gray-800'
                      }`}>
                        {item.ingredient_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteItem(item.id)}
                      data-testid={`delete-${item.id}`}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShoppingListPage;