import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FaPlus, FaEdit, FaTrash, FaExternalLinkAlt, FaToggleOn, FaToggleOff, FaChartBar, FaDownload, FaUpload, FaGlobe } from 'react-icons/fa';
import { Button } from '../components/ui/button';
import { API } from '../App';
import { COUNTRIES } from '../utils/geolocation';

const AdminLinksPage = () => {
  const [mappings, setMappings] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // {type: 'mapping'|'option'|'supplier', id, name}
  const [editingMapping, setEditingMapping] = useState(null);
  const [editingOption, setEditingOption] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('mappings'); // 'mappings' or 'suppliers'
  const [selectedMappings, setSelectedMappings] = useState([]); // For bulk delete
  const [selectedSuppliers, setSelectedSuppliers] = useState([]); // For bulk delete
  const fileInputRef = useRef(null);
  
  // Use direct API endpoints instead of proxy
  const REDIRECT_API = `${API}`;
  const ADMIN_TOKEN = 'dev-token-change-in-production';

  useEffect(() => {
    fetchMappings();
    fetchSuppliers();
  }, []);

  const fetchMappings = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching mappings from:', `${REDIRECT_API}/admin/mappings`);
      
      // Fetch all mappings using the new endpoint
      const response = await axios.get(
        `${REDIRECT_API}/admin/mappings`,
        { 
          headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
          withCredentials: true
        }
      );
      
      console.log('Mappings response:', response.data.length, 'mappings found');
      
      // For each mapping, fetch its options with delay to avoid rate limiting
      const allData = [];
      for (let i = 0; i < response.data.length; i++) {
        const mapping = response.data[i];
        try {
          // Add small delay between requests to avoid 429
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 100)); // Reduced from 200ms to 100ms
          }
          
          const optionsResponse = await axios.get(
            `${REDIRECT_API}/admin/mapping/${mapping.id}`,
            { 
              headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
              withCredentials: true
            }
          );
          if (optionsResponse.data) {
            allData.push(optionsResponse.data);
            console.log(`Fetched mapping ${i+1}/${response.data.length}: ${mapping.name}`);
          }
        } catch (error) {
          console.error(`Error fetching options for ${mapping.name}:`, error);
          // Still add mapping without options
          allData.push({ mapping, options: [] });
        }
      }
      
      console.log('Final allData:', allData.length, 'mappings with options');
      setMappings(allData);
      
      if (allData.length === 0) {
        toast.info('Ingen mappings fundet. Tilføj din første!');
      } else {
        toast.success(`Hentet ${allData.length} produkt-links`);
      }
    } catch (error) {
      console.error('Error fetching mappings:', error);
      toast.error(`Kunne ikke hente produkt-links: ${error.message}`);
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

  const createOption = async (mappingId, data) => {
    try {
      setSaving(true);
      
      // Auto-generate option ID
      const optionId = `opt_${data.supplier}_${Date.now()}`;
      
      const optionData = {
        option: {
          id: optionId,
          mappingId: mappingId,
          supplier: data.supplier,
          title: data.title,
          url: data.url,
          status: 'active',
          country_codes: data.country_codes || ['DK', 'US', 'GB']
        }
      };
      
      await axios.post(
        `${REDIRECT_API}/admin/option`,
        optionData,
        { 
          headers: { 
            Authorization: `Bearer ${ADMIN_TOKEN}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      toast.success('Leverandør-link oprettet!');
      fetchMappings();
      setEditingOption(null);
    } catch (error) {
      console.error('Error creating option:', error);
      toast.error(error.response?.data?.error || 'Kunne ikke oprette leverandør-link');
    } finally {
      setSaving(false);
    }
  };

  const deleteMapping = async (id) => {
    setDeleteTarget({ type: 'mapping', id, name: id });
    setShowDeleteConfirm(true);
  };

  // Bulk delete functions
  const toggleSelectAllMappings = () => {
    if (selectedMappings.length === mappings.length) {
      setSelectedMappings([]);
    } else {
      // Extract mapping.id from the {mapping, options} structure
      setSelectedMappings(mappings.map(m => m.mapping.id));
      console.log('[BulkSelect] Selected mappings:', mappings.map(m => m.mapping.id));
    }
  };

  const toggleSelectMapping = (id) => {
    console.log('[BulkSelect] Toggling mapping:', id);
    setSelectedMappings(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const bulkDeleteMappings = async () => {
    if (selectedMappings.length === 0) {
      toast.error('Vælg mindst én mapping at slette');
      return;
    }

    if (!window.confirm(`Er du sikker på at du vil slette ${selectedMappings.length} mappings?`)) {
      return;
    }

    try {
      setSaving(true);
      let successCount = 0;
      let failCount = 0;
      const errors = [];

      // Add delay between requests to avoid rate limiting
      for (let i = 0; i < selectedMappings.length; i++) {
        const id = selectedMappings[i];
        try {
          console.log(`[BulkDelete] Deleting ${i + 1}/${selectedMappings.length}: ${id}`);
          await axios.delete(
            `${REDIRECT_API}/admin/mapping/${id}`,
            { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
          );
          console.log(`[BulkDelete] Successfully deleted: ${id}`);
          successCount++;
          
          // Add 200ms delay to avoid rate limiting
          if (i < selectedMappings.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (error) {
          console.error(`[BulkDelete] Failed to delete ${id}:`, error);
          console.error(`[BulkDelete] Error details:`, error.response?.data);
          errors.push({ id, error: error.response?.data?.error || error.message });
          failCount++;
        }
      }

      console.log(`[BulkDelete] Results: ${successCount} success, ${failCount} failed`);
      if (errors.length > 0) {
        console.log(`[BulkDelete] Errors:`, errors);
      }

      if (successCount > 0) {
        toast.success(`${successCount} mappings slettet!`);
        fetchMappings();
        setSelectedMappings([]);
      }
      if (failCount > 0) {
        toast.error(`${failCount} mappings kunne ikke slettes. Tjek console for detaljer.`);
      }
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast.error('Fejl ved sletning');
    } finally {
      setSaving(false);
    }
  };

  const toggleSelectAllSuppliers = () => {
    if (selectedSuppliers.length === suppliers.length) {
      setSelectedSuppliers([]);
    } else {
      setSelectedSuppliers(suppliers.map(s => s.id));
    }
  };

  const toggleSelectSupplier = (id) => {
    setSelectedSuppliers(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const bulkDeleteSuppliers = async () => {
    if (selectedSuppliers.length === 0) {
      toast.error('Vælg mindst én leverandør at slette');
      return;
    }

    if (!window.confirm(`Er du sikker på at du vil slette ${selectedSuppliers.length} leverandører?`)) {
      return;
    }

    try {
      setSaving(true);
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedSuppliers) {
        try {
          await axios.delete(
            `${REDIRECT_API}/admin/supplier/${id}`,
            { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
          );
          successCount++;
        } catch (error) {
          console.error(`Failed to delete ${id}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} leverandører slettet!`);
        fetchSuppliers();
        setSelectedSuppliers([]);
      }
      if (failCount > 0) {
        toast.error(`${failCount} leverandører kunne ikke slettes`);
      }
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast.error('Fejl ved sletning');
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
    setDeleteTarget({ type: 'option', id: optionId, name: mappingName });
    setShowDeleteConfirm(true);
  };

  const exportCSV = async () => {
    try {
      const response = await axios.get(
        `${REDIRECT_API}/admin/export-product-csv`,
        { 
          headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'slushice-links.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('CSV eksporteret!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Kunne ikke eksportere CSV');
    }
  };

  const importCSV = async () => {
    if (!importFile) {
      toast.error('Vælg en fil først');
      return;
    }
    
    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await axios.post(
        `${REDIRECT_API}/admin/import-product-csv`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${ADMIN_TOKEN}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      setImportResult(response.data);
      
      const totalImported = response.data.mappings + response.data.options;
      
      if (response.data.errors && response.data.errors.length > 0) {
        toast.warning(`Importeret ${totalImported} items med ${response.data.errors.length} fejl`);
      } else if (totalImported === 0) {
        toast.info('Ingen nye items at importere (alle findes allerede)');
      } else {
        toast.success(`Importeret! ${response.data.mappings} nye produkter, ${response.data.options} nye links`);
      }
      
      // Refresh mappings
      fetchMappings();
      
      // Keep dialog open to show results
      setImportFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.message || 'Kunne ikke importere CSV';
      toast.error(errorMsg);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Admin: Links & Leverandører</h1>
          <p className="text-gray-600">Administrer produkt-links og leverandører</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportCSV}
            variant="outline"
            className="border-green-500 text-green-600 hover:bg-green-50"
          >
            <FaDownload className="mr-2" />
            Eksporter CSV
          </Button>
          <Button
            onClick={() => {
              setShowImportDialog(true);
              setImportResult(null);
            }}
            className="bg-gradient-to-r from-purple-500 to-pink-500"
          >
            <FaUpload className="mr-2" />
            Importer CSV
          </Button>
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
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2 items-center">
              <Button
                onClick={() => setShowSupplierDialog(true)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <FaPlus className="mr-2" />
                Tilføj Leverandør
              </Button>
              
              {selectedSuppliers.length > 0 && (
                <Button
                  onClick={bulkDeleteSuppliers}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  disabled={saving}
                >
                  <FaTrash className="mr-2" />
                  Slet valgte ({selectedSuppliers.length})
                </Button>
              )}
            </div>
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
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedSuppliers.length === suppliers.length && suppliers.length > 0}
                        onChange={toggleSelectAllSuppliers}
                        className="w-4 h-4 text-cyan-600 rounded cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Navn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">URL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 tracking-wider">Handlinger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedSuppliers.includes(supplier.id)}
                          onChange={() => toggleSelectSupplier(supplier.id)}
                          className="w-4 h-4 text-cyan-600 rounded cursor-pointer"
                        />
                      </td>
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
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2 items-center">
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <FaPlus className="mr-2" />
                Tilföj Nyt Link
              </Button>
              
              {selectedMappings.length > 0 && (
                <Button
                  onClick={bulkDeleteMappings}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  disabled={saving}
                >
                  <FaTrash className="mr-2" />
                  Slet valgte ({selectedMappings.length})
                </Button>
              )}
            </div>
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
          {mappings.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={selectedMappings.length === mappings.length && mappings.length > 0}
                onChange={toggleSelectAllMappings}
                className="w-4 h-4 text-cyan-600 rounded cursor-pointer"
              />
              <label className="text-sm text-gray-600">
                Vælg alle ({mappings.length} mappings)
              </label>
            </div>
          )}
          {mappings.map((mapping) => (
            <div key={mapping.mapping.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedMappings.includes(mapping.mapping._id || mapping.mapping.id)}
                    onChange={() => toggleSelectMapping(mapping.mapping._id || mapping.mapping.id)}
                    className="w-4 h-4 text-cyan-600 rounded cursor-pointer mt-1"
                  />
                  <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-800">{mapping.mapping.name}</h3>
                  <p className="text-sm text-gray-500 font-mono mt-1">ID: {mapping.mapping._id || mapping.mapping.id}</p>
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
                <h4 className="font-semibold text-gray-700 text-sm tracking-wide">
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
                            {option.supplier}
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
                        
                        {/* Display Countries */}
                        {option.country_codes && option.country_codes.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            <FaGlobe className="text-gray-400" size={12} />
                            {option.country_codes.map(code => {
                              const country = COUNTRIES[code];
                              return country ? (
                                <span key={code} className="text-lg" title={country.name}>
                                  {country.flag}
                                </span>
                              ) : (
                                <span key={code} className="text-xs text-gray-500 px-1">
                                  {code}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        
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
                  setEditingOption({
                    mappingId: mapping.mapping.id,
                    mappingName: mapping.mapping.name,
                    isNew: true
                  });
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

      {/* Edit/Add Option Dialog */}
      {editingOption && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4">
              {editingOption.isNew ? 'Tilføj Leverandør-Link' : 'Rediger Leverandør-Link'}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                // Get selected countries from checkboxes
                const selectedCountries = [];
                Object.keys(COUNTRIES).forEach(countryCode => {
                  if (formData.get(`country_${countryCode}`) === 'on') {
                    selectedCountries.push(countryCode);
                  }
                });
                
                if (editingOption.isNew) {
                  // Create new option
                  createOption(editingOption.mappingId, {
                    supplier: formData.get('supplier'),
                    title: formData.get('title'),
                    url: formData.get('url'),
                    status: 'active',
                    country_codes: selectedCountries.length > 0 ? selectedCountries : ['DK', 'US', 'GB']
                  });
                } else {
                  // Update existing option
                  updateOption(editingOption.id, {
                    supplier: formData.get('supplier'),
                    title: formData.get('title'),
                    url: formData.get('url'),
                    status: formData.get('status'),
                    country_codes: selectedCountries.length > 0 ? selectedCountries : ['DK', 'US', 'GB']
                  });
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Leverandør *</label>
                <select
                  name="supplier"
                  required
                  defaultValue={editingOption.supplier || ''}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Vælg leverandør...</option>
                  {suppliers.filter(s => s.active).map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
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
              
              {/* Country Selection */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <FaGlobe className="text-blue-500" />
                  Tilgængelig i lande
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-gray-50">
                  {Object.entries(COUNTRIES).map(([code, country]) => (
                    <label key={code} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                      <input
                        type="checkbox"
                        name={`country_${code}`}
                        defaultChecked={editingOption.country_codes ? 
                          editingOption.country_codes.includes(code) : 
                          ['DK', 'US', 'GB'].includes(code)}
                        className="w-4 h-4"
                      />
                      <span className="text-lg">{country.flag}</span>
                      <span className="text-sm">{country.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Vælg mindst ét land. Standard: DK, US, GB
                </p>
              </div>
              
              {!editingOption.isNew && (
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
              )}

              <div className="flex gap-3 mt-6">
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500"
                  disabled={saving}
                >
                  {saving ? 'Gemmer...' : (editingOption.isNew ? 'Opret Link' : 'Gem Ændringer')}
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

      {/* Import CSV Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Importer Links fra CSV</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">CSV Format:</h3>
              <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
produkt_navn,keywords,ean,leverandør,url,title
Agave Sirup,Agave;Nectar;Sirup,,Bevco,https://...,Monin Agave
              </pre>
              <p className="text-sm text-blue-800 mt-2">
                ⚠️ Keywords skal adskilles med <strong>semikolon (;)</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Vælg CSV fil</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    setImportFile(e.target.files[0]);
                    setImportResult(null);
                  }}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              {importResult && (
                <div className={`p-4 rounded-lg ${
                  importResult.errors?.length > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'
                }`}>
                  <h4 className="font-semibold mb-2">Import Resultat:</h4>
                  <ul className="text-sm space-y-1">
                    <li>✅ Mappings oprettet: {importResult.mappings}</li>
                    <li>✅ Options oprettet: {importResult.options}</li>
                    {importResult.errors?.length > 0 && (
                      <li className="text-yellow-800 mt-2">
                        ⚠️ {importResult.errors.length} fejl:
                        <ul className="ml-4 mt-1 max-h-32 overflow-y-auto">
                          {importResult.errors.map((err, idx) => (
                            <li key={idx} className="text-xs">{err}</li>
                          ))}
                        </ul>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={importCSV}
                  disabled={!importFile || importing}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  {importing ? 'Importerer...' : 'Importer'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportFile(null);
                    setImportResult(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="flex-1"
                  disabled={importing}
                >
                  Luk
                </Button>
              </div>
            </div>
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
