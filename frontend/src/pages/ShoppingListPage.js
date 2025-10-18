import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FaTrash, FaShoppingCart, FaCheck } from 'react-icons/fa';
import { API } from '../App';
import { Button } from '../components/ui/button';

// BuyButton component to display dynamic supplier
const BuyButton = ({ mappingId, redirectApi, fetchSupplier }) => {
  const [supplierInfo, setSupplierInfo] = useState(null);

  useEffect(() => {
    fetchSupplier(mappingId).then(info => {
      setSupplierInfo(info);
    });
  }, [mappingId, fetchSupplier]);

  if (!supplierInfo) return null;

  return (
    <button
      onClick={() => window.open(`${redirectApi}/${mappingId}`, '_blank')}
      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium ml-10 hover:underline transition-colors"
    >
      🛒 Køb hos {supplierInfo.displayName} →
    </button>
  );
};

const ShoppingListPage = ({ sessionId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supplierCache, setSupplierCache] = useState({});

  // Use backend proxy instead of direct localhost
  const REDIRECT_API = `${API}/redirect-proxy/go`;
  const ADMIN_REDIRECT_API = `${API}/redirect-proxy/admin/mapping`;
  const ADMIN_TOKEN = 'dev-token-change-in-production';
  
  // Mapping af almindelige ingredienser til redirect service IDs
  // Kun ingredienser der kan købes får et mapping
  const ingredientMappings = {
    'blå curaçao': 'blaa-curacao-sirup',
    'blue curacao': 'blaa-curacao-sirup',
    'blå curacao': 'blaa-curacao-sirup',
    'sodastream pepsi': 'sodastream-pepsi-440ml',
    'sodastream 7up': 'sodastream-7up-free-440ml',
    'pepsi sirup': 'sodastream-pepsi-440ml',
    '7up sirup': 'sodastream-7up-free-440ml',
    'mirinda sirup': 'sodastream-mirinda-440ml',
    // Tilføj flere mappings her efter behov
  };
  
  // Ingredienser der IKKE skal have køb-knap
  const excludedIngredients = ['vand', 'is', 'isterninger', 'koldt vand', 'vand (koldt)'];
  
  const getMappingId = (ingredientName) => {
    const nameLower = ingredientName.toLowerCase().trim();
    
    // Check hvis den er excluded
    if (excludedIngredients.some(excluded => nameLower.includes(excluded))) {
      return null;
    }
    
    // Check direct mapping
    for (const [key, mappingId] of Object.entries(ingredientMappings)) {
      if (nameLower.includes(key)) {
        return mappingId;
      }
    }
    
    // Default: hvis det indeholder "sirup", "smag", eller "ekstrakt" - vis kategori link
    if (nameLower.includes('sirup') || nameLower.includes('smag') || nameLower.includes('ekstrakt')) {
      return 'power-flavours-category';
    }
    
    return null;
  };

  useEffect(() => {
    fetchShoppingList();
  }, [sessionId]);

  const fetchSupplierInfo = async (mappingId) => {
    // Check cache first
    if (supplierCache[mappingId]) {
      return supplierCache[mappingId];
    }

    try {
      const response = await axios.get(`${ADMIN_REDIRECT_API}/${mappingId}`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
      });
      
      if (response.data && response.data.options && response.data.options.length > 0) {
        const activeOption = response.data.options.find(opt => opt.status === 'active') || response.data.options[0];
        const supplierInfo = {
          supplier: activeOption.supplier,
          displayName: getSupplierDisplayName(activeOption.supplier)
        };
        
        // Cache it
        setSupplierCache(prev => ({ ...prev, [mappingId]: supplierInfo }));
        return supplierInfo;
      }
    } catch (error) {
      console.error('Error fetching supplier info:', error);
    }
    
    return { supplier: 'power', displayName: 'Power' }; // Default
  };

  const getSupplierDisplayName = (supplier) => {
    const names = {
      'power': 'Power',
      'barshopen': 'Barshopen',
      'bilka': 'Bilka',
      'foetex': 'Føtex',
      'matas': 'Matas',
      'nemlig': 'Nemlig.com',
      'amazon': 'Amazon',
      'other': 'Leverandør'
    };
    return names[supplier] || supplier.charAt(0).toUpperCase() + supplier.slice(1);
  };

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
                {recipeItems.map((item) => {
                  const mappingId = getMappingId(item.ingredient_name);
                  return (
                    <div
                      key={item.id}
                      data-testid={`shopping-item-${item.id}`}
                      className={`p-3 rounded-lg transition-all ${
                        item.checked ? 'bg-gray-50 opacity-60' : 'bg-cyan-50'
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-2">
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
                      {mappingId && !item.checked && (
                        <BuyButton 
                          mappingId={mappingId}
                          redirectApi={REDIRECT_API}
                          fetchSupplier={fetchSupplierInfo}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShoppingListPage;