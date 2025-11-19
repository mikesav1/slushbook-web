import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { FaArrowLeft, FaTrophy, FaUpload, FaSave, FaMedal } from 'react-icons/fa';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';

const AdminBadgesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const [editingBadge, setEditingBadge] = useState(null);

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== 'admin') {
      navigate('/settings');
      return;
    }
    fetchBadges();
  }, [user, navigate]);

  const fetchBadges = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await axios.get(`${API}/admin/badges`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setBadges(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching badges:', error);
      toast.error('Kunne ikke hente badges');
      setLoading(false);
    }
  };

  const handleFileUpload = async (level, file) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Kun billedfiler er tilladt');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Billedet må ikke være større end 2MB');
      return;
    }

    setUploading(level);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('session_token');
      const response = await axios.post(
        `${API}/admin/badges/upload?level=${level}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true
        }
      );

      // Update badge with new image URL
      const badge = badges.find(b => b.level === level);
      if (badge) {
        await updateBadge(level, { ...badge, image_url: response.data.image_url });
      }

      toast.success('Badge billede uploadet!');
      setUploading(null);
    } catch (error) {
      console.error('Error uploading badge:', error);
      toast.error('Upload fejlede');
      setUploading(null);
    }
  };

  const updateBadge = async (level, badgeData) => {
    try {
      const token = localStorage.getItem('session_token');
      await axios.put(
        `${API}/admin/badges/${level}`,
        badgeData,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      
      fetchBadges();
      toast.success('Badge opdateret!');
      setEditingBadge(null);
    } catch (error) {
      console.error('Error updating badge:', error);
      toast.error('Kunne ikke opdatere badge');
    }
  };

  const getBadgeIcon = (level) => {
    switch (level) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'diamond': return '💎';
      default: return '🏆';
    }
  };

  const getBadgeColor = (level) => {
    switch (level) {
      case 'bronze': return 'from-orange-300 via-amber-400 to-orange-500';
      case 'silver': return 'from-gray-300 via-gray-400 to-gray-300';
      case 'gold': return 'from-yellow-300 via-yellow-400 to-yellow-500';
      case 'diamond': return 'from-purple-400 via-pink-400 to-purple-500';
      default: return 'from-cyan-500 to-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <FaArrowLeft className="text-xl text-gray-700" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
              <FaTrophy className="text-yellow-500" />
              Badge Management
            </h1>
            <p className="text-gray-600 mt-1">Administrer bruger achievement badges</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-2">📋 Hvordan virker badges?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Badges tildeles automatisk baseret på antal <strong>godkendte og publicerede</strong> opskrifter</li>
            <li>• Du kan uploade custom billeder til hver badge (max 2MB)</li>
            <li>• Hvis intet billede er uploadet, vises emoji + gradient farve</li>
            <li>• Badges vises på opskriftskort ved siden af favorit-hjertet</li>
          </ul>
        </div>

        {/* Badges List */}
        <div className="space-y-4">
          {badges.map((badge) => (
            <div
              key={badge.level}
              className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-100 hover:border-purple-200 transition-all"
            >
              <div className="flex items-start gap-6">
                {/* Badge Preview */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-20 h-20 bg-gradient-to-br ${badge.color_gradient || getBadgeColor(badge.level)} text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white relative`}
                  >
                    {badge.image_url ? (
                      <img
                        src={badge.image_url}
                        alt={badge.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl">{badge.emoji || getBadgeIcon(badge.level)}</span>
                    )}
                  </div>
                </div>

                {/* Badge Info */}
                <div className="flex-grow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 capitalize">
                        {badge.level} Badge
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {badge.name || `${badge.level} Chef`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                        {badge.min_recipes}+ opskrifter
                      </div>
                    </div>
                  </div>

                  {/* Edit Form or Display */}
                  {editingBadge === badge.level ? (
                    <div className="space-y-3 mt-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Badge Navn
                        </label>
                        <input
                          type="text"
                          value={badge.name}
                          onChange={(e) => {
                            const updated = badges.map(b =>
                              b.level === badge.level ? { ...b, name: e.target.value } : b
                            );
                            setBadges(updated);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder={`${badge.level} Chef`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Minimum Opskrifter
                        </label>
                        <input
                          type="number"
                          value={badge.min_recipes}
                          onChange={(e) => {
                            const updated = badges.map(b =>
                              b.level === badge.level ? { ...b, min_recipes: parseInt(e.target.value) } : b
                            );
                            setBadges(updated);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Emoji (fallback hvis intet billede)
                        </label>
                        <input
                          type="text"
                          value={badge.emoji}
                          onChange={(e) => {
                            const updated = badges.map(b =>
                              b.level === badge.level ? { ...b, emoji: e.target.value } : b
                            );
                            setBadges(updated);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="🏆"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => updateBadge(badge.level, badge)}
                          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                        >
                          <FaSave /> Gem
                        </button>
                        <button
                          onClick={() => {
                            setEditingBadge(null);
                            fetchBadges(); // Reset changes
                          }}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                        >
                          Annuller
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 mt-2">
                      {badge.image_url && (
                        <div className="text-sm text-gray-600">
                          <strong>Billede URL:</strong>{' '}
                          <a
                            href={badge.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Se billede
                          </a>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => setEditingBadge(badge.level)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                        >
                          Rediger
                        </button>

                        <label
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors text-sm cursor-pointer ${
                            uploading === badge.level
                              ? 'bg-gray-300 text-gray-500'
                              : 'bg-purple-500 hover:bg-purple-600 text-white'
                          }`}
                        >
                          {uploading === badge.level ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Uploader...
                            </>
                          ) : (
                            <>
                              <FaUpload /> Upload Billede
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(badge.level, e.target.files[0])}
                            className="hidden"
                            disabled={uploading === badge.level}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <FaMedal /> Badge System Aktiv
          </h3>
          <p className="text-white/90 text-sm">
            Badges vises automatisk på alle bruger-opskrifter baseret på forfatterens antal godkendte opskrifter.
            Ændringer træder i kraft øjeblikkeligt.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminBadgesPage;
