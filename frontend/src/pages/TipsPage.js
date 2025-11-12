import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { FaPlus, FaHeart, FaSearch, FaGlobe, FaRegHeart } from 'react-icons/fa';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';

const TipsPage = () => {
  const navigate = useNavigate();
  const { user, sessionId } = useAuth();
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showInternational, setShowInternational] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'Alle', icon: '📚' },
    { id: 'maskiner', name: 'Maskiner', icon: '🧊' },
    { id: 'produkter', name: 'Produkter & Ingredienser', icon: '🍓' },
    { id: 'rengoring', name: 'Rengøring & Vedligehold', icon: '🧼' },
    { id: 'teknik', name: 'Teknik & Udstyr', icon: '⚙️' },
    { id: 'brugertips', name: 'Brugertips & Erfaringer', icon: '💡' },
    { id: 'tilbehor', name: 'Tilbehør & Servering', icon: '📦' }
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
      toast.error('Kunne ikke hente tips');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (tipId) => {
    if (!user || user.role === 'guest') {
      toast.error('Kun PRO-brugere kan like tips. Opgrader for at deltage!');
      return;
    }

    try {
      const response = await axios.post(`${API}/tips/${tipId}/like`);
      // Update likes in UI
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
      toast.error('Kunne ikke like tip');
    }
  };

  const filteredTips = tips.filter(tip =>
    tip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tip.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get top 3 most liked tips
  const topTips = [...tips].sort((a, b) => b.likes - a.likes).slice(0, 3);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-4xl font-bold mb-2">💡 Tips & Tricks</h1>
        <p className="text-cyan-50 text-lg">
          Del erfaringer og lær af fællesskabet
        </p>
      </div>

      {/* Search & Actions */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Søg i tips..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* International Toggle */}
          <button
            onClick={() => setShowInternational(!showInternational)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
              showInternational
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
            }`}
          >
            <FaGlobe />
            <span className="text-sm font-medium">Internationale tips</span>
          </button>

          {/* Add Tip Button */}
          {user && user.role !== 'guest' && (
            <button
              onClick={() => navigate('/tips/create')}
              className="flex items-center gap-2 px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-medium"
            >
              <FaPlus />
              Del dit tip
            </button>
          )}
        </div>
      </div>

      {/* Top Tips - Most Liked */}
      {topTips.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-300">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            🏆 Mest Likede Tips
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {topTips.map((tip, index) => (
              <div key={tip.id} className="bg-white rounded-lg p-4 shadow-sm border border-yellow-200">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm line-clamp-2">{tip.title}</h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{tip.content}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500">{tip.creator_name}</span>
                  <div className="flex items-center gap-1 text-pink-500">
                    <FaHeart size={12} />
                    <span className="text-xs font-bold">{tip.likes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500 text-white border-cyan-500 shadow-md'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-cyan-300'
              }`}
            >
              <span>{cat.icon}</span>
              <span className="font-medium text-sm">{cat.name}</span>
              <span className="text-xs opacity-70">
                ({tips.filter(t => cat.id === 'all' || t.category === cat.id).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tips Grid */}
      {filteredTips.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">Ingen tips fundet i denne kategori endnu.</p>
          {user && user.role !== 'guest' && (
            <button
              onClick={() => navigate('/tips/create')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-medium"
            >
              <FaPlus />
              Vær den første til at dele et tip!
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTips.map(tip => (
            <div
              key={tip.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">
                      {categories.find(c => c.id === tip.category)?.icon || '💡'}
                    </span>
                    {tip.is_international && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        🌍 International
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg line-clamp-2">{tip.title}</h3>
                </div>
              </div>

              {/* Content */}
              <p className="text-gray-700 text-sm mb-4 line-clamp-4">{tip.content}</p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">{tip.creator_name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(tip.created_at).toLocaleDateString('da-DK')}
                  </p>
                </div>
                
                {/* Like Button */}
                {user && user.role !== 'guest' ? (
                  <button
                    onClick={() => handleLike(tip.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                      tip.liked_by?.includes(user.id)
                        ? 'bg-pink-100 text-pink-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-pink-50'
                    }`}
                  >
                    {tip.liked_by?.includes(user.id) ? (
                      <FaHeart className="text-pink-500" />
                    ) : (
                      <FaRegHeart />
                    )}
                    <span className="text-sm font-medium">{tip.likes || 0}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1 text-gray-400">
                    <FaHeart size={14} />
                    <span className="text-sm">{tip.likes || 0}</span>
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

export default TipsPage;
