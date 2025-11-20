import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FaGlobe, FaSearch, FaSave, FaSpinner } from 'react-icons/fa';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';

const LANGUAGES = {
  de: { name: 'Tysk', flag: '🇩🇪' },
  fr: { name: 'Fransk', flag: '🇫🇷' },
  en: { name: 'Engelsk (UK)', flag: '🇬🇧' },
  en_us: { name: 'Engelsk (US)', flag: '🇺🇸' }
};

const AdminTranslationsPage = () => {
  const { t } = useTranslation();
  const [selectedLang, setSelectedLang] = useState('da');
  const [translations, setTranslations] = useState({});
  const [allTranslations, setAllTranslations] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  // Load all translations
  useEffect(() => {
    loadAllTranslations();
  }, []);

  const loadAllTranslations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      const loadedTranslations = {};
      
      for (const lang of Object.keys(LANGUAGES)) {
        const response = await axios.get(`${API}/admin/translations/${lang}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        loadedTranslations[lang] = response.data.translations;
      }
      
      setAllTranslations(loadedTranslations);
      setTranslations(loadedTranslations[selectedLang] || {});
    } catch (error) {
      console.error('Error loading translations:', error);
      console.error('Error details:', error.response?.status, error.response?.data);
      if (error.response?.status === 403) {
        toast.error('Du skal være logget ind som admin for at se oversættelser');
      } else {
        toast.error(t('admin.translations.loadError'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Get all sections from translations
  const getSections = () => {
    const sections = Object.keys(translations);
    return ['all', ...sections];
  };

  // Flatten nested object to key-value pairs
  const flattenObject = (obj, prefix = '') => {
    let result = [];
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result = [...result, ...flattenObject(value, fullKey)];
      } else {
        result.push({ key: fullKey, value, section: prefix || key });
      }
    }
    return result;
  };

  // Get filtered translations
  const getFilteredTranslations = () => {
    const flattened = flattenObject(translations);
    
    let filtered = flattened;
    
    // Filter by section
    if (selectedSection !== 'all') {
      filtered = filtered.filter(item => item.section === selectedSection);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Save translations to backend
  const saveTranslations = async () => {
    try {
      const token = localStorage.getItem('session_token');
      await axios.post(`${API}/admin/translations/${selectedLang}`, {
        translations: translations
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update all translations state
      setAllTranslations({
        ...allTranslations,
        [selectedLang]: translations
      });
      
      toast.success(t('admin.translations.saveSuccess', { language: LANGUAGES[selectedLang].name }));
    } catch (error) {
      console.error('Error saving translations:', error);
      toast.error(t('admin.translations.saveError'));
    }
  };

  // Update nested object value
  const updateNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((acc, key) => {
      if (!acc[key]) acc[key] = {};
      return acc[key];
    }, obj);
    target[lastKey] = value;
    return { ...obj };
  };

  // Handle edit save
  const handleSaveEdit = (key) => {
    const updated = updateNestedValue(translations, key, editValue);
    setTranslations(updated);
    setEditingKey(null);
    setEditValue('');
  };

  // Handle add new key
  const handleAddKey = () => {
    if (!newKey || !newValue) {
      toast.error(t('admin.translations.addError'));
      return;
    }
    
    const updated = updateNestedValue(translations, newKey, newValue);
    setTranslations(updated);
    setShowAddModal(false);
    setNewKey('');
    setNewValue('');
    toast.success(t('admin.translations.addSuccess'));
  };

  // Export translations
  const exportTranslations = () => {
    const dataStr = JSON.stringify(translations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedLang}.json`;
    link.click();
    toast.success(t('admin.translations.exportSuccess'));
  };

  const filteredTranslations = getFilteredTranslations();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">{t('admin.translations.title')}</h1>
          <p className="text-gray-600">{t('admin.translations.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportTranslations} variant="outline">
            <FaDownload className="mr-2" /> {t('admin.translations.export')}
          </Button>
          <Button onClick={saveTranslations} className="bg-green-600 hover:bg-green-700">
            <FaSave className="mr-2" /> {t('admin.translations.save')}
          </Button>
        </div>
      </div>

      {/* Language Selector */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <Label className="text-sm font-medium mb-2 block">{t('admin.translations.selectLanguage')}</Label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {Object.entries(LANGUAGES).map(([code, language]) => (
            <button
              key={code}
              onClick={() => {
                setSelectedLang(code);
                setTranslations(allTranslations[code] || {});
                setSearchTerm('');
                setSelectedSection('all');
              }}
              className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                selectedLang === code
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">{language.flag}</span>
              <span className="text-sm font-medium">{language.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <Label className="text-sm font-medium mb-2 block">{t('admin.translations.search')}</Label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('admin.translations.searchPlaceholder')}
                className="pl-10"
              />
            </div>
          </div>

          {/* Section Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">{t('admin.translations.section')}</Label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {getSections().map(section => (
                <option key={section} value={section}>
                  {section === 'all' ? t('admin.translations.allSections') : section}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {t('admin.translations.showing', { count: filteredTranslations.length, total: flattenObject(translations).length })}
          </p>
          <Button onClick={() => setShowAddModal(true)} size="sm">
            <FaPlus className="mr-2" /> {t('admin.translations.addKey')}
          </Button>
        </div>
      </div>

      {/* Translations List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredTranslations.map((item, index) => (
            <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                      {item.section}
                    </span>
                    <span className="text-sm font-medium text-gray-700 break-all">
                      {item.key}
                    </span>
                  </div>
                  
                  {editingKey === item.key ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        rows={3}
                        className="w-full"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveEdit(item.key)}>
                          {t('common.save')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingKey(null)}>
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
                      {String(item.value)}
                    </p>
                  )}
                </div>

                {editingKey !== item.key && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingKey(item.key);
                      setEditValue(String(item.value));
                    }}
                  >
                    <FaEdit />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Key Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">{t('admin.translations.addNewKey')}</h2>
            
            <div className="space-y-4">
              <div>
                <Label>{t('admin.translations.keyLabel')}</Label>
                <Input
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder={t('admin.translations.keyPlaceholder')}
                />
              </div>

              <div>
                <Label>{t('admin.translations.valueLabel')}</Label>
                <Textarea
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={t('admin.translations.valuePlaceholder')}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleAddKey}>
                  <FaPlus className="mr-2" /> {t('admin.translations.addKey')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTranslationsPage;
