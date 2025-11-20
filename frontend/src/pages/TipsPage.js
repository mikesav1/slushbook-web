import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { FaPlus, FaHeart, FaRegHeart, FaChevronDown, FaChevronUp, FaTrash, FaPaperPlane, FaGlobe } from 'react-icons/fa';
import { API, BACKEND } from '../App';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const TipsPage = () => {
  const navigate = useNavigate();
  const { user, sessionId } = useAuth();
  const { t } = useTranslation();
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTipId, setExpandedTipId] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showInternational, setShowInternational] = useState(true);
  const [collapsedComments, setCollapsedComments] = useState({}); // Track collapsed comment sections (default: collapsed per tip)

  const categories = [
    { id: 'all', name: t('tips.categoryAll'), icon: '📚' },
    { id: 'maskiner', name: t('tips.categoryMachines'), icon: '🧊' },
    { id: 'produkter', name: t('tips.categoryProducts'), icon: '🍓' },
    { id: 'rengoring', name: t('tips.categoryCleaning'), icon: '🧼' },
    { id: 'teknik', name: t('tips.categoryTechnical'), icon: '⚙️' },
    { id: 'brugertips', name: t('tips.categoryUserTips'), icon: '💡' },
    { id: 'tilbehor', name: t('tips.categoryAccessories'), icon: '📦' }
  ];

  useEffect(() => {
    fetchTips();
  }, [selectedCategory, showInternational]);

  const fetchTips = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      params.append('show_international', showInternational);
      
      const response = await axios.get(`${API}/tips?${params}`);
      setTips(response.data);
    } catch (error) {
      console.error('Error fetching tips:', error);
      toast.error(t('tips.errorFetchTips'));
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (tipId) => {
    try {
      const response = await axios.get(`${API}/tips/${tipId}/comments`);
      setComments(prev => ({ ...prev, [tipId]: response.data }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleToggleExpand = (tipId) => {
    if (expandedTipId === tipId) {
      setExpandedTipId(null);
    } else {
      setExpandedTipId(tipId);
      // Set comments as collapsed by default when expanding tip
      setCollapsedComments(prev => ({ ...prev, [tipId]: true }));
      // Fetch comments when expanding
      if (!comments[tipId]) {
        fetchComments(tipId);
      }
    }
  };

  const handleLike = async (tipId) => {
    if (!user || user.role === 'guest') {
      toast.error(t('tips.onlyProCanLike'));
      return;
    }

    try {
      const response = await axios.post(`${API}/tips/${tipId}/like`);
      setTips(tips.map(tip => {
        if (tip.id === tipId) {
          const isLiked = tip.liked_by?.includes(user.id);
          return {
            ...tip,
            likes: response.data.likes,
            liked_by: isLiked 
              ? tip.liked_by.filter(uid => uid !== user.id)
              : [...(tip.liked_by || []), user.id]
          };
        }
        return tip;
      }));
    } catch (error) {
      console.error('Error liking tip:', error);
      toast.error(t('tips.errorLike'));
    }
  };

  const handleDeleteTip = async (tipId) => {
    if (!window.confirm('Er du sikker på, at du vil slette dette tip?')) {
      return;
    }

    try {
      await axios.delete(`${API}/tips/${tipId}`);
      toast.success('Tip slettet');
      setTips(tips.filter(tip => tip.id !== tipId));
    } catch (error) {
      console.error('Error deleting tip:', error);
      toast.error(t('tips.errorDelete'));
    }
  };

  const handlePostComment = async (tipId) => {
    if (!user || user.role === 'guest') {
      toast.error('Kun PRO-brugere kan kommentere. Opgrader for at deltage!');
      return;
    }

    const content = newComment[tipId]?.trim();
    if (!content) {
      toast.error('Skriv en kommentar først');
      return;
    }

    try {
      const response = await axios.post(
        `${API}/tips/${tipId}/comments`,
        { content }
      );
      
      // Add new comment to list
      setComments(prev => ({
        ...prev,
        [tipId]: [...(prev[tipId] || []), response.data]
      }));
      
      // Clear input
      setNewComment(prev => ({ ...prev, [tipId]: '' }));
      toast.success('Kommentar tilføjet');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error(t('tips.errorPostComment'));
    }
  };

  const handleDeleteComment = async (tipId, commentId) => {
    if (!window.confirm('Er du sikker på, at du vil slette denne kommentar?')) {
      return;
    }

    try {
      await axios.delete(`${API}/tips/${tipId}/comments/${commentId}`);
      
      // Remove comment from list
      setComments(prev => ({
        ...prev,
        [tipId]: prev[tipId].filter(c => c.id !== commentId)
      }));
      
      toast.success('Kommentar slettet');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error(t('tips.errorDeleteComment'));
    }
  };

  const canDeleteTip = (tip) => {
    return user && (user.role === 'admin' || tip.created_by === user.id);
  };

  const canDeleteComment = (comment) => {
    return user && (user.role === 'admin' || comment.user_id === user.id);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">💡 {t('tips.communityForum')}</h1>
            <p className="text-cyan-50 text-lg">
              {t('tips.subtitle')}
            </p>
          </div>
          {user && user.role !== 'guest' && (
            <button
              onClick={() => navigate('/tips/create')}
              className="bg-white text-cyan-600 px-6 py-3 rounded-xl font-semibold hover:bg-cyan-50 transition-colors flex items-center gap-2 shadow-lg"
            >
              <FaPlus /> Opret nyt tip
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {/* International Toggle */}
          <button
            onClick={() => setShowInternational(!showInternational)}
            className={`ml-auto px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              showInternational
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaGlobe /> {showInternational ? 'Inkl. internationale' : 'Kun lokale'}
          </button>
        </div>
      </div>

      {/* Tips List - Accordion Style */}
      <div className="space-y-3">
        {tips.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-gray-500">Ingen tips fundet</p>
          </div>
        ) : (
          tips.map((tip) => {
            const isExpanded = expandedTipId === tip.id;
            const tipComments = comments[tip.id] || [];
            const isLiked = tip.liked_by?.includes(user?.id);

            return (
              <div
                key={tip.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all"
              >
                {/* Accordion Header - Always Visible */}
                <div
                  onClick={() => handleToggleExpand(tip.id)}
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 flex items-start gap-3">
                      <span className="text-2xl">{categories.find(c => c.id === tip.category)?.icon || '💡'}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{tip.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                          <span>{tip.creator_name}</span>
                          <span>•</span>
                          <span>{new Date(tip.created_at).toLocaleDateString('da-DK')}</span>
                          {tip.is_international && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600 font-medium flex items-center gap-1">
                                <FaGlobe size={12} /> International
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <FaHeart size={12} className="text-pink-500" />
                            {tip.likes || 0}
                          </span>
                          {tipComments.length > 0 && (
                            <>
                              <span>•</span>
                              <span>💬 {tipComments.length}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      {isExpanded ? (
                        <FaChevronUp className="text-gray-400" size={20} />
                      ) : (
                        <FaChevronDown className="text-gray-400" size={20} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Accordion Content - Expandable */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    {/* Tip Content */}
                    <div className="p-4 bg-gray-50">
                      {tip.image_url && (
                        <img
                          src={`${API}${tip.image_url}`}
                          alt={tip.title}
                          className="w-full max-h-64 object-cover rounded-lg mb-3"
                        />
                      )}
                      <p className="text-gray-700 whitespace-pre-wrap">{tip.content}</p>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleLike(tip.id)}
                          disabled={!user || user.role === 'guest'}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            isLiked
                              ? 'bg-pink-500 text-white hover:bg-pink-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isLiked ? <FaHeart /> : <FaRegHeart />}
                          {tip.likes || 0} likes
                        </button>

                        {canDeleteTip(tip) && (
                          <button
                            onClick={() => handleDeleteTip(tip.id)}
                            className="ml-auto px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center gap-2 font-medium"
                          >
                            <FaTrash size={14} /> Slet
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div className="p-4 border-t border-gray-200">
                      <div 
                        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded-lg transition-colors"
                        onClick={() => setCollapsedComments(prev => ({ ...prev, [tip.id]: !prev[tip.id] }))}
                      >
                        <h4 className="font-bold text-gray-700">💬 Svar ({tipComments.length})</h4>
                        {collapsedComments[tip.id] ? (
                          <FaChevronDown className="text-gray-400" size={16} />
                        ) : (
                          <FaChevronUp className="text-gray-400" size={16} />
                        )}
                      </div>
                      
                      {/* Comment List */}
                      {!collapsedComments[tip.id] && (
                      <div className="space-y-3 mb-4 mt-3">
                        {tipComments.map((comment) => (
                          <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">{comment.user_name}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.created_at).toLocaleDateString('da-DK', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              {canDeleteComment(comment) && (
                                <button
                                  onClick={() => handleDeleteComment(tip.id, comment.id)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                  title="Slet kommentar"
                                >
                                  <FaTrash size={12} />
                                </button>
                              )}
                            </div>
                            <p className="text-gray-700 text-sm">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                      )}

                      {/* Add Comment */}
                      {!collapsedComments[tip.id] && (user && user.role !== 'guest' ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newComment[tip.id] || ''}
                            onChange={(e) => setNewComment(prev => ({ ...prev, [tip.id]: e.target.value }))}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handlePostComment(tip.id);
                              }
                            }}
                            placeholder="Skriv et svar..."
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                          <button
                            onClick={() => handlePostComment(tip.id)}
                            className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-2 font-medium"
                          >
                            <FaPaperPlane size={14} /> Send
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-600 text-sm">
                            <button
                              onClick={() => navigate('/login')}
                              className="text-cyan-600 hover:underline font-semibold"
                            >
                              Log ind
                            </button>
                            {' '}eller{' '}
                            <button
                              onClick={() => navigate('/settings')}
                              className="text-cyan-600 hover:underline font-semibold"
                            >
                              opgrader til PRO
                            </button>
                            {' '}for at kommentere
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TipsPage;
