import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { FaArrowLeft, FaCheck, FaTimes, FaEdit, FaTrash, FaFilter, FaHeart, FaGlobe } from 'react-icons/fa';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';

const AdminTipsPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending'); // all, pending, approved, rejected
  const [editingTipId, setEditingTipId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const categories = {
    'maskiner': { name: 'Maskiner', icon: '🧊' },
    'produkter': { name: 'Produkter & Ingredienser', icon: '🍓' },
    'rengoring': { name: 'Rengøring & Vedligehold', icon: '🧼' },
    'teknik': { name: 'Teknik & Udstyr', icon: '⚙️' },
    'brugertips': { name: 'Brugertips & Erfaringer', icon: '💡' },
    'tilbehor': { name: 'Tilbehør & Servering', icon: '📦' }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchTips();
  }, [statusFilter]);

  const fetchTips = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await axios.get(`${API}/admin/tips/all?${params}`);
      setTips(response.data);
    } catch (error) {
      console.error('Error fetching tips:', error);
      toast.error('Kunne ikke hente tips');
    } finally {
      setLoading(false);
    }
  };

  const approveTip = async (tipId) => {
    try {
      await axios.put(`${API}/admin/tips/${tipId}/approve`);
      toast.success('Tip godkendt');
      fetchTips();
    } catch (error) {
      console.error('Error approving tip:', error);
      toast.error('Kunne ikke godkende tip');
    }
  };

  const rejectTip = async (tipId) => {
    const reason = prompt('Årsag til afvisning (valgfrit):');
    
    try {
      await axios.put(`${API}/admin/tips/${tipId}/reject${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`);
      toast.success('Tip afvist');
      fetchTips();
    } catch (error) {
      console.error('Error rejecting tip:', error);
      toast.error('Kunne ikke afvise tip');
    }
  };

  const deleteTip = async (tipId) => {
    if (!window.confirm('Er du sikker på, at du vil slette dette tip permanent?')) {
      return;
    }

    try {
      await axios.delete(`${API}/tips/${tipId}`);
      toast.success('Tip slettet');
      fetchTips();
    } catch (error) {
      console.error('Error deleting tip:', error);
      toast.error('Kunne ikke slette tip');
    }
  };

  const startEditing = (tip) => {
    setEditingTipId(tip.id);
    setEditTitle(tip.title);
    setEditContent(tip.content);
  };

  const cancelEditing = () => {
    setEditingTipId(null);
    setEditTitle('');
    setEditContent('');
  };

  const saveEdit = async (tipId) => {
    try {
      await axios.put(`${API}/tips/${tipId}`, {
        title: editTitle,
        content: editContent
      });
      toast.success('Tip opdateret');
      setEditingTipId(null);
      fetchTips();
    } catch (error) {
      console.error('Error updating tip:', error);
      toast.error('Kunne ikke opdatere tip');
    }
  };

  const getLanguageFlag = (lang) => {
    const flags = {
      'da': '🇩🇰',
      'de': '🇩🇪',
      'fr': '🇫🇷',
      'en': '🇬🇧',
      'en-US': '🇺🇸'
    };
    return flags[lang] || '🌍';
  };

  const getLanguageName = (lang) => {
    const names = {
      'da': 'Dansk',
      'de': 'Tysk',
      'fr': 'Fransk',
      'en': 'Engelsk',
      'en-US': 'Amerikansk'
    };
    return names[lang] || lang;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/settings')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FaArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold">💡 Tips & Tricks Moderation</h1>
          <p className="text-gray-600">Godkend, rediger eller afvis bruger-indsendte tips</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaFilter className="inline mr-1" />
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="pending">⏳ Afventer godkendelse</option>
              <option value="approved">✅ Godkendte</option>
              <option value="rejected">❌ Afviste</option>
              <option value="all">Alle</option>
            </select>
          </div>

          {/* Stats */}
          <div className="ml-auto flex items-end">
            <div className="text-right">
              <p className="text-sm text-gray-600">Total tips</p>
              <p className="text-2xl font-bold text-cyan-600">{tips.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips List */}
      {tips.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-gray-500">Ingen tips fundet med de valgte filtre</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tips.map((tip) => (
            <div
              key={tip.id}
              className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all ${
                tip.approval_status === 'pending'
                  ? 'border-yellow-200 bg-yellow-50'
                  : tip.approval_status === 'approved'
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{categories[tip.category]?.icon || '💡'}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      {categories[tip.category]?.name || tip.category}
                    </span>
                    <span className="text-2xl">{getLanguageFlag(tip.language)}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      {getLanguageName(tip.language)}
                    </span>
                    {tip.is_international && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                        🌍 International
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      tip.approval_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : tip.approval_status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {tip.approval_status === 'pending' ? '⏳ AFVENTER' : 
                       tip.approval_status === 'approved' ? '✅ GODKENDT' : '❌ AFVIST'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Af:</span> {tip.creator_name}
                    {' • '}
                    {new Date(tip.created_at).toLocaleDateString('da-DK', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {tip.approval_status === 'pending' && (
                    <>
                      <button
                        onClick={() => approveTip(tip.id)}
                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        title="Godkend tip"
                      >
                        <FaCheck size={18} />
                      </button>
                      <button
                        onClick={() => rejectTip(tip.id)}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="Afvis tip"
                      >
                        <FaTimes size={18} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => startEditing(tip)}
                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    title="Rediger tip"
                  >
                    <FaEdit size={18} />
                  </button>
                  <button
                    onClick={() => deleteTip(tip.id)}
                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    title="Slet tip"
                  >
                    <FaTrash size={18} />
                  </button>
                </div>
              </div>

              {/* Content - Editable or Display */}
              {editingTipId === tip.id ? (
                <div className="space-y-3 mt-4">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Titel"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                    placeholder="Indhold"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(tip.id)}
                      className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
                    >
                      Gem ændringer
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Annuller
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Image */}
                  {tip.image_url && (
                    <img
                      src={`${API}${tip.image_url}`}
                      alt={tip.title}
                      className="w-full max-h-64 object-cover rounded-lg mb-3"
                    />
                  )}
                  
                  {/* Title & Content */}
                  <div className="bg-white rounded-lg p-4 mb-3">
                    <h3 className="text-lg font-bold mb-2">{tip.title}</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{tip.content}</p>
                  </div>
                </>
              )}

              {/* Footer Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-600 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-1">
                  <FaHeart className="text-pink-500" />
                  <span>{tip.likes || 0} likes</span>
                </div>
                {tip.rejection_reason && (
                  <div className="text-red-600">
                    <strong>Afvisningsårsag:</strong> {tip.rejection_reason}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTipsPage;
