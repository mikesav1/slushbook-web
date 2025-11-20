import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { FaSearch, FaSave, FaGlobe, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const LANGUAGES = {
  de: { name: 'Tysk', flag: '🇩🇪' },
  fr: { name: 'Fransk', flag: '🇫🇷' },
  en: { name: 'Engelsk (UK)', flag: '🇬🇧' },
  en_us: { name: 'Engelsk (US)', flag: '🇺🇸' }
};

const SECTIONS = {
  all: { name: 'Alle sektioner', icon: '📋' },
  ui: { name: 'UI & Interface', icon: '🎨' },
  recipeContent: { name: 'Opskrifter', icon: '📖' },
  ingredients: { name: 'Ingredienser', icon: '🥕' }
};

const AdminTranslationsPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [selectedLanguage, setSelectedLanguage] = useState('de');
  const [translations, setTranslations] = useState([]);
  const [editedTranslations, setEditedTranslations] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin()) {
      toast.error('Kun administratorer kan tilgå denne side');
      navigate('/settings');
    }
  }, [isAdmin, navigate]);

  // Load translations when language changes
  useEffect(() => {
    if (selectedLanguage) {
      loadTranslations(selectedLanguage);
    }
  }, [selectedLanguage]);

  const loadTranslations = async (lang) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      const response = await axios.get(`${API}/admin/translations/editor?language=${lang}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      
      setTranslations(response.data.translations);
      setEditedTranslations({});
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading translations:', error);
      toast.error('Kunne ikke indlæse oversættelser');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslationChange = (key, value) => {
    setEditedTranslations(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const getCurrentTranslation = (item) => {
    // Return edited value if exists, otherwise original translation
    return editedTranslations.hasOwnProperty(item.key) 
      ? editedTranslations[item.key] 
      : item.translation;
  };

  const saveAllTranslations = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('session_token');
      
      // Build final translations object (merge original + edited)
      const finalTranslations = {};
      translations.forEach(item => {
        finalTranslations[item.key] = getCurrentTranslation(item);
      });
      
      await axios.put(
        `${API}/admin/translations/editor/${selectedLanguage}`,
        { translations: finalTranslations },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      
      toast.success(`✅ Alle oversættelser gemt for ${LANGUAGES[selectedLanguage].name}`);
      setHasChanges(false);
      setEditedTranslations({});
      
      // Reload to confirm
      await loadTranslations(selectedLanguage);
    } catch (error) {
      console.error('Error saving translations:', error);
      toast.error('Kunne ikke gemme oversættelser');
    } finally {
      setSaving(false);
    }
  };

  // Filter translations based on search query
  const filteredTranslations = translations.filter(item => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      item.key.toLowerCase().includes(query) ||
      item.master.toLowerCase().includes(query) ||
      item.translation.toLowerCase().includes(query) ||
      getCurrentTranslation(item).toLowerCase().includes(query)
    );
  });

  if (!isAdmin()) {
    return null;
  }

  return (
    <div className="space-y-6 fade-in pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <FaGlobe className="text-3xl" />
          <h1 className="text-4xl font-bold">Oversættelseseditor</h1>
        </div>
        <p className="text-white/90">
          Rediger alle oversættelser nemt og hurtigt. Vælg et sprog og ret de tekster, du ønsker.
        </p>
      </div>

      {/* Language Tabs */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <span className="font-semibold text-gray-700">Vælg sprog:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(LANGUAGES).map(([code, lang]) => (
            <button
              key={code}
              onClick={() => setSelectedLanguage(code)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedLanguage === code
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Søg i oversættelser (nøgle, dansk tekst eller oversættelse)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-3 text-lg"
          />
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-600 mt-2">
            Viser {filteredTranslations.length} af {translations.length} oversættelser
          </p>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="flex flex-col items-center gap-4">
            <FaSpinner className="animate-spin text-blue-500 text-5xl" />
            <p className="text-gray-600">Indlæser oversættelser...</p>
          </div>
        </div>
      )}

      {/* Translations List */}
      {!loading && filteredTranslations.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="space-y-6">
            {filteredTranslations.map((item, index) => (
              <div
                key={item.key}
                className="border-b border-gray-200 pb-6 last:border-b-0"
              >
                {/* Key Label */}
                <div className="mb-2">
                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {item.key}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Master (Danish) - Read-only */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Master (Dansk):
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-800">{item.master}</p>
                    </div>
                  </div>

                  {/* Translation - Editable */}
                  <div>
                    <label className="block text-sm font-semibold text-blue-700 mb-2">
                      {LANGUAGES[selectedLanguage].name} (redigerbar):
                    </label>
                    <Textarea
                      value={getCurrentTranslation(item)}
                      onChange={(e) => handleTranslationChange(item.key, e.target.value)}
                      className="min-h-[80px] resize-y"
                      placeholder={`Oversættelse til ${LANGUAGES[selectedLanguage].name}...`}
                    />
                  </div>
                </div>

                {/* Show indicator if edited */}
                {editedTranslations.hasOwnProperty(item.key) && (
                  <div className="mt-2">
                    <span className="text-xs text-green-600 font-semibold">
                      ✓ Ændret (endnu ikke gemt)
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && filteredTranslations.length === 0 && translations.length > 0 && (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500 text-lg">
            Ingen oversættelser matchede din søgning "{searchQuery}"
          </p>
        </div>
      )}

      {/* Fixed Save Button at Bottom */}
      {!loading && translations.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              {hasChanges ? (
                <p className="text-sm text-orange-600 font-semibold">
                  ⚠️ Du har ugemte ændringer
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  Alle ændringer er gemt
                </p>
              )}
            </div>
            <Button
              onClick={saveAllTranslations}
              disabled={saving || !hasChanges}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 text-lg font-bold shadow-md"
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Gemmer...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  💾 Gem alle ændringer
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTranslationsPage;
