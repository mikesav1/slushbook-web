import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { FaArrowLeft, FaEye, FaEyeSlash, FaTrash, FaFilter, FaHeart, FaGlobe, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';

const AdminCommentsPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // all, visible, hidden
  const [languageFilter, setLanguageFilter] = useState('all'); // all, da, de, en, etc.
  const [collapsedComments, setCollapsedComments] = useState({}); // Track collapsed comments

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchComments();
  }, [statusFilter, languageFilter]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (languageFilter !== 'all') params.append('language', languageFilter);
      
      const response = await axios.get(`${API}/admin/comments/all?${params}`);
      setComments(response.data);
      
      // Set all comments as collapsed by default
      const initialCollapsed = {};
      response.data.forEach(comment => {
        initialCollapsed[comment.id] = true;
      });
      setCollapsedComments(initialCollapsed);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Kunne ikke hente kommentarer');
    } finally {
      setLoading(false);
    }
  };

  const toggleCommentStatus = async (commentId, currentStatus) => {
    try {
      await axios.put(`${API}/comments/${commentId}/hide`);
      toast.success(`Kommentar ${currentStatus === 'visible' ? 'skjult' : 'vist'}`);
      fetchComments();
    } catch (error) {
      console.error('Error toggling comment status:', error);
      toast.error('Kunne ikke ændre kommentar status');
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Er du sikker på, at du vil slette denne kommentar?')) {
      return;
    }

    try {
      await axios.delete(`${API}/comments/${commentId}`);
      toast.success('Kommentar slettet');
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Kunne ikke slette kommentar');
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
          <h1 className="text-3xl font-bold">💬 Kommentar Moderation</h1>
          <p className="text-gray-600">Administrer alle kommentarer på opskrifter</p>
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
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle</option>
              <option value="visible">Synlige</option>
              <option value="hidden">Skjulte</option>
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaGlobe className="inline mr-1" />
              Sprog
            </label>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle sprog</option>
              <option value="da">🇩🇰 Dansk</option>
              <option value="de">🇩🇪 Tysk</option>
              <option value="fr">🇫🇷 Fransk</option>
              <option value="en">🇬🇧 Engelsk</option>
              <option value="en-US">🇺🇸 Amerikansk</option>
            </select>
          </div>

          {/* Stats */}
          <div className="ml-auto flex items-end">
            <div className="text-right">
              <p className="text-sm text-gray-600">Total kommentarer</p>
              <p className="text-2xl font-bold text-blue-600">{comments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-gray-500">Ingen kommentarer fundet med de valgte filtre</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all ${
                comment.status === 'hidden'
                  ? 'border-red-200 bg-red-50'
                  : 'border-gray-200 hover:border-blue-200'
              }`}
            >
              {/* Header - Clickable to collapse */}
              <div 
                className="flex items-start justify-between mb-3 cursor-pointer hover:bg-gray-50 -mx-6 px-6 py-3 rounded-lg transition-colors"
                onClick={() => setCollapsedComments(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-lg">{comment.user_name}</span>
                    <span className="text-2xl">{getLanguageFlag(comment.language)}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      {getLanguageName(comment.language)}
                    </span>
                    {comment.status === 'hidden' && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                        SKJULT
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Opskrift:</span>{' '}
                    <button
                      onClick={() => navigate(`/recipe/${comment.recipe_id}`)}
                      className="text-blue-600 hover:underline"
                    >
                      {comment.recipe_name}
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(comment.created_at).toLocaleDateString('da-DK', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {comment.updated_at && (
                      <span className="ml-2">(redigeret)</span>
                    )}
                  </div>
                </div>

                {/* Collapse icon and Action Buttons */}
                <div className="flex gap-2 items-center">
                  {collapsedComments[comment.id] ? (
                    <FaChevronDown className="text-gray-400" size={16} />
                  ) : (
                    <FaChevronUp className="text-gray-400" size={16} />
                  )}
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => toggleCommentStatus(comment.id, comment.status)}
                    className={`p-2 rounded-lg transition-colors ${
                      comment.status === 'visible'
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                    title={comment.status === 'visible' ? 'Skjul kommentar' : 'Vis kommentar'}
                  >
                    {comment.status === 'visible' ? (
                      <FaEyeSlash size={18} />
                    ) : (
                      <FaEye size={18} />
                    )}
                  </button>
                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    title="Slet kommentar"
                  >
                    <FaTrash size={18} />
                  </button>
                  </div>
                </div>
              </div>

              {/* Comment Body - Collapsible */}
              {!collapsedComments[comment.id] && (
                <>
                  <div className="bg-gray-50 rounded-lg p-4 mb-3">
                    <p className="text-gray-800 whitespace-pre-wrap">{comment.comment}</p>
                  </div>

                  {/* Footer Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <FaHeart className="text-pink-500" />
                      <span>{comment.likes || 0} likes</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCommentsPage;
