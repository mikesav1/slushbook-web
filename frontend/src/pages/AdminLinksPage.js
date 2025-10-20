import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FaPlus, FaEdit, FaTrash, FaExternalLinkAlt, FaToggleOn, FaToggleOff, FaChartBar } from 'react-icons/fa';
import { Button } from '../components/ui/button';
import { API } from '../App';

const AdminLinksPage = () => {
  const [mappings, setMappings] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // {type: 'mapping'|'option'|'supplier', id, name}
  const [editingMapping, setEditingMapping] = useState(null);
  const [editingOption, setEditingOption] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('mappings'); // 'mappings' or 'suppliers'
  
  // Use proxy through backend instead of direct localhost
  const REDIRECT_API = `${API}/redirect-proxy`;
  const ADMIN_TOKEN = 'dev-token-change-in-production';

  useEffect(() => {
    fetchMappings();
    fetchSuppliers();
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

  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const response = await axios.get(`${REDIRECT_API}/admin/suppliers`);
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Kunne ikke hente leverandører');
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const createSupplier = async (data) => {
    try {
      setSaving(true);
      await axios.post(
        `${REDIRECT_API}/admin/suppliers`,
        data,
        { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
      );
      toast.success('Leverandør oprettet!');
      fetchSuppliers();
      setShowSupplierDialog(false);
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast.error('Kunne ikke oprette leverandør');
    } finally {
      setSaving(false);
    }
  };

  const updateSupplier = async (id, data) => {
    try {
      setSaving(true);
      await axios.patch(
        `${REDIRECT_API}/admin/suppliers/${id}`,
        data,
        { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
      );
      toast.success('Leverandør opdateret!');
      fetchSuppliers();
      setEditingSupplier(null);
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast.error('Kunne ikke opdatere leverandør');
    } finally {
      setSaving(false);
    }
  };

  const deleteSupplier = async (id) => {
    const supplier = suppliers.find(s => s.id === id);
    setDeleteTarget({ type: 'supplier', id, name: supplier?.name || id });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      if (deleteTarget.type === 'mapping') {
        await axios.delete(
          `${REDIRECT_API}/admin/mapping/${deleteTarget.id}`,
          { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
        );
        toast.success('Produkt-link slettet!');
        fetchMappings();
      } else if (deleteTarget.type === 'option') {
        await axios.delete(
          `${REDIRECT_API}/admin/option/${deleteTarget.id}`,
          { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
        );
        toast.success('Leverandør-link slettet!');
        fetchMappings();
      } else if (deleteTarget.type === 'supplier') {
        await axios.delete(
          `${REDIRECT_API}/admin/suppliers/${deleteTarget.id}`,
          { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
        );
        toast.success('Leverandør slettet!');
        fetchSuppliers();
      }
    } catch (error) {
      console.error('Error deleting:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Kunne ikke slette';
      toast.error(`Fejl: ${errorMsg}`);
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };
  const createMapping = async (data) => {
    try {
      setSaving(true);
      
      // Auto-generate ID from name (slug format)
      const id = data.name.toLowerCase()
        .replace(/æ/g, 'ae')
        .replace(/ø/g, 'oe')
        .replace(/å/g, 'aa')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      const mappingData = {
        mapping: {
          id: id,
          name: data.name,
          ean: data.ean || null,
          keywords: data.keywords || ''
        }
      };
      
      console.log('Creating mapping with data:', mappingData);
      
      const response = await axios.post(
        `${REDIRECT_API}/admin/mapping`,
        mappingData,
        { 
          headers: { 
            Authorization: `Bearer ${ADMIN_TOKEN}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      toast.success('Produkt-link oprettet!');
      fetchMappings();
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error creating mapping:', error);
      toast.error(error.response?.data?.error || 'Kunne ikke oprette produkt-link');
    } finally {
      setSaving(false);
    }
  };

  const deleteMapping = async (id) => {
    setDeleteTarget({ type: 'mapping', id, name: id });
    setShowDeleteConfirm(true);
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
    setDeleteTarget({ type: 'option', id: optionId, name: mappingName });
    setShowDeleteConfirm(true);
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Admin: Links & Leverandører</h1>
          <p className="text-gray-600">Administrer produkt-links og leverandører</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('mappings')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'mappings'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Produkt-Links
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'suppliers'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Leverandører
        </button>
      </div>

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setShowSupplierDialog(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-500"
            >
              <FaPlus className="mr-2" />
              Tilføj Leverandør
            </Button>
          </div>

          {loadingSuppliers ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Navn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Handlinger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">{supplier.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{supplier.url || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => updateSupplier(supplier.id, { active: supplier.active ? 0 : 1 })}
                          className="flex items-center gap-2"
                        >
                          {supplier.active ? (
                            <>
                              <FaToggleOn className="text-green-500 text-2xl" />
                              <span className="text-sm text-green-600 font-medium">Aktiv</span>
                            </>
                          ) : (
                            <>
                              <FaToggleOff className="text-gray-400 text-2xl" />
                              <span className="text-sm text-gray-500 font-medium">Inaktiv</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingSupplier(supplier)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Rediger"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => deleteSupplier(supplier.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Slet"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Mappings Tab */}
      {activeTab === 'mappings' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-blue-500 to-cyan-500"
            >
              <FaPlus className="mr-2" />
              Tilföj Nyt Link
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
                  <button
                    onClick={() => deleteMapping(mapping.mapping.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Slet produkt-link"
                  >
                    <FaTrash />
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
                  name: formData.get('name'),
                  ean: formData.get('ean') || null,
                  keywords: formData.get('keywords')
                });
              }}
              className="space-y-4"
            >
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
              {/* Leverandør-links tilføjes efter oprettelse af produkt-link */}

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

      {/* Edit Mapping Dialog */}
      {editingMapping && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4">Rediger Mapping</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                updateMapping({
                  id: editingMapping.id, // ID kan ikke ændres
                  name: formData.get('name'),
                  ean: formData.get('ean') || null,
                  keywords: formData.get('keywords')
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Mapping ID (kan ikke ændres)</label>
                <input
                  value={editingMapping.id}
                  disabled
                  className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">ID kan ikke ændres efter oprettelse</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Produkt Navn</label>
                <input
                  name="name"
                  required
                  defaultValue={editingMapping.name}
                  placeholder="SodaStream Cola 440 ml"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">EAN (valgfrit)</label>
                <input
                  name="ean"
                  defaultValue={editingMapping.ean || ''}
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
                  defaultValue={editingMapping.keywords || ''}
                  placeholder="pepsi,cola,sodastream pepsi"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Kommasepareret liste. Fx: "7up,7-up,seven up,lemon"
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                  disabled={saving}
                >
                  {saving ? 'Gemmer...' : 'Gem Ændringer'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setEditingMapping(null)}
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

      {/* Add/Edit Supplier Dialog */}
      {(showSupplierDialog || editingSupplier) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              {editingSupplier ? 'Rediger Leverandør' : 'Tilføj Leverandør'}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = {
                name: formData.get('name'),
                url: formData.get('url')
              };
              
              if (editingSupplier) {
                updateSupplier(editingSupplier.id, data);
              } else {
                createSupplier(data);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Navn *</label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editingSupplier?.name || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="f.eks. Dorita"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">URL (valgfri)</label>
                <input
                  name="url"
                  type="url"
                  defaultValue={editingSupplier?.url || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://www.dorita.dk"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowSupplierDialog(false);
                    setEditingSupplier(null);
                  }}
                >
                  Annuller
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-green-500 to-emerald-500"
                >
                  {saving ? 'Gemmer...' : (editingSupplier ? 'Gem Ændringer' : 'Opret')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Bekræft Sletning</h2>
            <p className="text-gray-700 mb-6">
              Er du sikker på at du vil slette <strong>{deleteTarget?.name}</strong>?
              {deleteTarget?.type === 'mapping' && ' Dette vil også slette alle tilknyttede leverandør-links.'}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
              >
                Annuller
              </Button>
              <Button
                type="button"
                onClick={confirmDelete}
                className="bg-gradient-to-r from-red-500 to-red-600"
              >
                Ja, Slet
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLinksPage;
