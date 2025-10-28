import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FaAd, FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaMousePointer, FaGlobe } from 'react-icons/fa';

const AdminAdsPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [formData, setFormData] = useState({
    image: '',
    link: '',
    country: 'DK',
    placement: 'bottom_banner',
    active: true,
    title: '',
    description: ''
  });

  useEffect(() => {
    if (!isAdmin()) {
      toast.error('Kun admin har adgang');
      navigate('/');
      return;
    }
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await axios.get(`${API}/admin/ads`, {
        withCredentials: true,
        headers: sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}
      });
      setAds(response.data);
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast.error('Kunne ikke hente reklamer');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const sessionToken = localStorage.getItem('session_token');
      const config = {
        withCredentials: true,
        headers: sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}
      };

      if (editingAd) {
        await axios.put(`${API}/admin/ads/${editingAd.id}`, formData, config);
        toast.success('Reklame opdateret!');
      } else {
        await axios.post(`${API}/admin/ads`, formData, config);
        toast.success('Reklame oprettet!');
      }

      setShowModal(false);
      setEditingAd(null);
      resetForm();
      fetchAds();
    } catch (error) {
      console.error('Error saving ad:', error);
      toast.error('Kunne ikke gemme reklame');
    }
  };

  const handleDelete = async (adId) => {
    if (!window.confirm('Er du sikker på at du vil slette denne reklame?')) {
      return;
    }

    try {
      const sessionToken = localStorage.getItem('session_token');
      await axios.delete(`${API}/admin/ads/${adId}`, {
        withCredentials: true,
        headers: sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}
      });
      toast.success('Reklame slettet!');
      fetchAds();
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast.error('Kunne ikke slette reklame');
    }
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setFormData({
      image: ad.image,
      link: ad.link,
      country: ad.country,
      placement: ad.placement,
      active: ad.active,
      title: ad.title || '',
      description: ad.description || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      image: '',
      link: '',
      country: 'DK',
      placement: 'bottom_banner',
      active: true,
      title: '',
      description: ''
    });
  };

  const openCreateModal = () => {
    setEditingAd(null);
    resetForm();
    setShowModal(true);
  };

  const placements = [
    { value: 'bottom_banner', label: 'Bottom Banner' },
    { value: 'recipe_list', label: 'Opskriftsliste' },
    { value: 'homepage_hero', label: 'Homepage Hero' },
    { value: 'sidebar', label: 'Sidebar' }
  ];

  const countries = [
    { value: 'DK', label: '🇩🇰 Danmark' },
    { value: 'DE', label: '🇩🇪 Tyskland' },
    { value: 'GB', label: '🇬🇧 Storbritannien' },
    { value: 'US', label: '🇺🇸 USA' },
    { value: 'FR', label: '🇫🇷 Frankrig' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <FaAd className="text-cyan-500" />
            Reklame Administration
          </h1>
          <p className="text-gray-600">Administrer reklamer til gæstebrugere</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 flex items-center gap-2 font-medium"
        >
          <FaPlus />
          Opret Reklame
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-gray-500 text-sm mb-1">Total Reklamer</div>
          <div className="text-2xl font-bold">{ads.length}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-gray-500 text-sm mb-1">Aktive</div>
          <div className="text-2xl font-bold text-green-600">
            {ads.filter(ad => ad.active).length}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-gray-500 text-sm mb-1">Total Visninger</div>
          <div className="text-2xl font-bold text-blue-600">
            {ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-gray-500 text-sm mb-1">Total Klik</div>
          <div className="text-2xl font-bold text-purple-600">
            {ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0)}
          </div>
        </div>
      </div>

      {/* Ads List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {ads.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FaAd className="mx-auto text-6xl mb-4 text-gray-300" />
            <p>Ingen reklamer endnu</p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
            >
              Opret din første reklame
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Billede
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Titel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Land
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Placering
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statistik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ads.map((ad) => (
                <tr key={ad.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <img
                      src={ad.image}
                      alt={ad.title}
                      className="h-12 w-20 object-cover rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{ad.title || 'Ingen titel'}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{ad.link}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-2xl">{countries.find(c => c.value === ad.country)?.label.split(' ')[0]}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {placements.find(p => p.value === ad.placement)?.label}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <FaEye className="text-blue-500" />
                        <span>{ad.impressions || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaMousePointer className="text-purple-500" />
                        <span>{ad.clicks || 0}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {ad.active ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        Aktiv
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        Inaktiv
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(ad)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingAd ? 'Rediger Reklame' : 'Opret Ny Reklame'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Billede URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/ad-image.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
                {formData.image && (
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="mt-2 h-24 rounded"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                )}
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://leverandor.dk/produkt"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titel (valgfri)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Leverandør navn"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beskrivelse (valgfri)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Kort beskrivelse af tilbuddet"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              {/* Country & Placement */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Land *
                  </label>
                  <select
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    {countries.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Placering *
                  </label>
                  <select
                    required
                    value={formData.placement}
                    onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    {placements.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {formData.active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 font-medium"
                >
                  {editingAd ? 'Gem Ændringer' : 'Opret Reklame'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingAd(null);
                    resetForm();
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Annuller
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAdsPage;
