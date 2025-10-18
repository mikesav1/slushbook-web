import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FaPlus, FaEdit, FaTrash, FaExternalLinkAlt, FaToggleOn, FaToggleOff, FaChartBar } from 'react-icons/fa';
import { Button } from '../components/ui/button';
import { API } from '../App';

const AdminLinksPage = () => {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [editingOption, setEditingOption] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Use proxy through backend instead of direct localhost
  const REDIRECT_API = `${API}/redirect-proxy`;
  const ADMIN_TOKEN = 'dev-token-change-in-production';

  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async () => {
    try {
      setLoading(true);
      
      // Fetch all mappings using the new endpoint
      const response = await axios.get(
        `${REDIRECT_API}/admin/mappings`,
        { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
      );
      
      // For each mapping, fetch its options
      const allData = [];
      for (const mapping of response.data) {
        try {
          const optionsResponse = await axios.get(
            `${REDIRECT_API}/admin/mapping/${mapping.id}`,
            { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
          );
          if (optionsResponse.data) {
            allData.push(optionsResponse.data);
          }
        } catch (error) {
          console.log(`Error fetching options for ${mapping.id}:`, error.message);
        }
      }
      
      setMappings(allData);
      
      if (allData.length === 0) {
        toast.info('Ingen mappings fundet. Tilføj din første!');
      }
    } catch (error) {
      console.error('Error fetching mappings:', error);
      toast.error('Kunne ikke hente produkt-links');
    } finally {
      setLoading(false);
    }
  };

  const createMapping = async (data) => {
    try {
      setSaving(true);
      console.log('Creating mapping with data:', data);
      
      const response = await axios.post(
        `${REDIRECT_API}/admin/mapping`,
        data,
        { 
          headers: { 
            Authorization: `Bearer ${ADMIN_TOKEN}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      console.log('Response:', response.data);
      toast.success('Mapping oprettet!');
      fetchMappings();
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error creating mapping:', error);
      console.error('Error response:', error.response?.data);
      toast.error(`Kunne ikke oprette mapping: ${error.response?.data?.error || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateMapping = async (mappingData) => {
    try {
      setSaving(true);
      
      const response = await axios.post(
        `${REDIRECT_API}/admin/mapping`,
        { mapping: mappingData },
        { 
          headers: { 
            Authorization: `Bearer ${ADMIN_TOKEN}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      toast.success('Mapping opdateret!');
      fetchMappings();
      setEditingMapping(null);
    } catch (error) {
      console.error('Error updating mapping:', error);
      toast.error(`Kunne ikke opdatere mapping: ${error.response?.data?.error || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleOptionStatus = async (optionId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await axios.patch(
        `${REDIRECT_API}/admin/option/${optionId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
      );
      toast.success(`Link ${newStatus === 'active' ? 'aktiveret' : 'deaktiveret'}`);
      fetchMappings();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Kunne ikke ændre status');
    }
  };

  const updateOption = async (optionId, updates) => {
    try {
      setSaving(true);
      await axios.patch(
        `${REDIRECT_API}/admin/option/${optionId}`,
        updates,
        { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
      );
      toast.success('Link opdateret!');
      fetchMappings();
      setEditingOption(null);
    } catch (error) {
      console.error('Error updating option:', error);
      toast.error('Kunne ikke opdatere link');
    } finally {
      setSaving(false);
    }
  };

  const deleteOption = async (optionId, mappingName) => {
    if (!window.confirm(`Er du sikker på at du vil slette denne leverandør link fra "${mappingName}"?`)) {
      return;
    }
    
    try {
      setSaving(true);
      // Since there's no DELETE endpoint, we'll deactivate it
      await axios.patch(
        `${REDIRECT_API}/admin/option/${optionId}`,
        { status: 'deleted' },
        { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
      );
      toast.success('Link slettet!');
      fetchMappings();
    } catch (error) {
      console.error('Error deleting option:', error);
      toast.error('Kunne ikke slette link');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Produkt-Links Administration</h1>
          <p className="text-gray-600">Administrer links til eksterne leverandører</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-to-r from-blue-500 to-cyan-500"
        >
          <FaPlus className="mr-2" />
          Tilføj Nyt Link
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      ) : mappings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FaExternalLinkAlt /></div>
          <h3 className="text-xl font-bold mb-2">Ingen produkt-links endnu</h3>
          <p className="text-gray-600">Tilføj dit første link til en leverandør</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mappings.map((mapping) => (
            <div key={mapping.mapping.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-800">{mapping.mapping.name}</h3>
                  <p className="text-sm text-gray-500 font-mono mt-1">ID: {mapping.mapping.id}</p>
                  {mapping.mapping.ean && (
                    <p className="text-sm text-gray-500 mt-1">EAN: {mapping.mapping.ean}</p>
                  )}
                  {mapping.mapping.keywords && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 font-semibold mb-1">Søgeord:</p>
                      <div className="flex flex-wrap gap-1">
                        {mapping.mapping.keywords.split(',').map((keyword, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {keyword.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingMapping(mapping.mapping)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Rediger mapping (ID, navn, søgeord)"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => window.open(`${REDIRECT_API}/go/${mapping.mapping.id}`, '_blank')}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Test redirect"
                  >
                    <FaExternalLinkAlt />
                  </button>
                </div>
              </div>

              {/* Options/Links */}
              <div className="space-y-3 mt-4">
                <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  Leverandør Links ({mapping.options.length})
                </h4>
                {mapping.options.map((option) => (
                  <div
                    key={option.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      option.status === 'active'
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            option.status === 'active'
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-400 text-white'
                          }`}>
                            {option.supplier.toUpperCase()}
                          </span>
                          <span className={`text-sm font-medium ${
                            option.status === 'active' ? 'text-green-700' : 'text-gray-500'
                          }`}>
                            {option.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </div>
                        <p className="font-medium text-gray-800 mb-1">{option.title}</p>
                        <a
                          href={option.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline break-all"
                        >
                          {option.url}
                        </a>
                        {option.priceLastSeen && (
                          <p className="text-sm text-gray-600 mt-2">
                            Seneste pris: {option.priceLastSeen} kr.
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Opdateret: {new Date(option.updatedAt).toLocaleString('da-DK')}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => toggleOptionStatus(option.id, option.status)}
                          className={`p-2 rounded-lg transition-colors ${
                            option.status === 'active'
                              ? 'text-green-600 hover:bg-green-100'
                              : 'text-gray-500 hover:bg-gray-200'
                          }`}
                          title={option.status === 'active' ? 'Deaktiver' : 'Aktiver'}
                        >
                          {option.status === 'active' ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                        </button>
                        <button
                          onClick={() => setEditingOption(option)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Rediger"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => deleteOption(option.id, mapping.mapping.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Slet"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add option button */}
              <button
                onClick={() => {
                  const optionId = prompt('Option ID (fx: opt_power_123):');
                  const supplier = prompt('Leverandør (fx: power):');
                  const title = prompt('Produkt titel:');
                  const url = prompt('Produkt URL:');
                  
                  if (optionId && supplier && title && url) {
                    createMapping({
                      mapping: mapping.mapping,
                      options: [
                        ...mapping.options,
                        { id: optionId, supplier, title, url, status: 'active' }
                      ]
                    });
                  }
                }}
                className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Tilføj leverandør-link
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4">Tilføj Nyt Produkt-Link</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                createMapping({
                  mapping: {
                    id: formData.get('mappingId'),
                    name: formData.get('name'),
                    ean: formData.get('ean') || null,
                    keywords: formData.get('keywords')
                  },
                  options: [{
                    id: formData.get('optionId'),
                    supplier: formData.get('supplier'),
                    title: formData.get('title'),
                    url: formData.get('url'),
                    status: 'active'
                  }]
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Mapping ID (slug)</label>
                <input
                  name="mappingId"
                  required
                  placeholder="sodastream-cola-440ml"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Produkt Navn</label>
                <input
                  name="name"
                  required
                  placeholder="SodaStream Cola 440 ml"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">EAN (valgfrit)</label>
                <input
                  name="ean"
                  placeholder="1234567890123"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Søgeord / Nøgleord <span className="text-red-500">*</span>
                </label>
                <input
                  name="keywords"
                  required
                  placeholder="pepsi,cola,sodastream pepsi"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Kommasepareret liste. Fx: "7up,7-up,seven up,lemon". Bruges til at matche ingredienser automatisk.
                </p>
              </div>
              
              <hr className="my-4" />
              <h3 className="font-bold text-lg">Første Leverandør-Link</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1">Option ID</label>
                <input
                  name="optionId"
                  required
                  placeholder="opt_power_cola_123"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Leverandør</label>
                <select
                  name="supplier"
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="power">Power</option>
                  <option value="barshopen">Barshopen</option>
                  <option value="bilka">Bilka</option>
                  <option value="foetex">Føtex</option>
                  <option value="matas">Matas</option>
                  <option value="nemlig">Nemlig.com</option>
                  <option value="amazon">Amazon</option>
                  <option value="other">Andet</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Vælg hvor produktet kan købes</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Produkt Titel</label>
                <input
                  name="title"
                  required
                  placeholder="SodaStream Cola 440 ml"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Produkt URL</label>
                <input
                  name="url"
                  type="url"
                  required
                  placeholder="https://www.power.dk/..."
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500"
                  disabled={saving}
                >
                  {saving ? 'Opretter...' : 'Opret'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowAddDialog(false)}
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

      {/* Edit Option Dialog */}
      {editingOption && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4">Rediger Leverandør-Link</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                updateOption(editingOption.id, {
                  supplier: formData.get('supplier'),
                  title: formData.get('title'),
                  url: formData.get('url'),
                  status: formData.get('status')
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Leverandør</label>
                <select
                  name="supplier"
                  required
                  defaultValue={editingOption.supplier}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="power">Power</option>
                  <option value="barshopen">Barshopen</option>
                  <option value="bilka">Bilka</option>
                  <option value="foetex">Føtex</option>
                  <option value="matas">Matas</option>
                  <option value="nemlig">Nemlig.com</option>
                  <option value="amazon">Amazon</option>
                  <option value="other">Andet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Produkt Titel</label>
                <input
                  name="title"
                  required
                  defaultValue={editingOption.title}
                  placeholder="SodaStream Cola 440 ml"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Produkt URL</label>
                <input
                  name="url"
                  type="url"
                  required
                  defaultValue={editingOption.url}
                  placeholder="https://www.power.dk/..."
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  required
                  defaultValue={editingOption.status}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="active">Aktiv</option>
                  <option value="inactive">Inaktiv</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500"
                  disabled={saving}
                >
                  {saving ? 'Gemmer...' : 'Gem Ændringer'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setEditingOption(null)}
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

export default AdminLinksPage;
