import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { FaArrowLeft, FaGlobe } from 'react-icons/fa';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';

const CreateTipPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('maskiner');
  const [isInternational, setIsInternational] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageOwnershipConfirmed, setImageOwnershipConfirmed] = useState(false);

  const categories = [
    { id: 'maskiner', name: 'Maskiner', icon: '🧊' },
    { id: 'produkter', name: 'Produkter & Ingredienser', icon: '🍓' },
    { id: 'rengoring', name: 'Rengøring & Vedligehold', icon: '🧼' },
    { id: 'teknik', name: 'Teknik & Udstyr', icon: '⚙️' },
    { id: 'brugertips', name: 'Brugertips & Erfaringer', icon: '💡' },
    { id: 'tilbehor', name: 'Tilbehør & Servering', icon: '📦' }
  ];

  // Redirect if not authorized
  if (!user || user.role === 'guest') {
    navigate('/tips');
    return null;
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Kun billedfiler er tilladt');
        return;
      }
      
      // Validate file size (max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Billede må maks. være 10MB');
        return;
      }
      
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageOwnershipConfirmed(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      toast.error('Titel er påkrævet');
      return;
    }
    if (title.length > 100) {
      toast.error('Titel må maks. være 100 tegn');
      return;
    }
    if (!content.trim()) {
      toast.error('Indhold er påkrævet');
      return;
    }
    if (content.length > 1000) {
      toast.error('Indhold må maks. være 1000 tegn');
      return;
    }
    if (imageFile && !imageOwnershipConfirmed) {
      toast.error('Du skal bekræfte at du ejer billedet');
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(`${API}/tips`, {
        title: title.trim(),
        content: content.trim(),
        category,
        is_international: isInternational
      });
      
      const tipId = response.data.id;
      
      // Upload image if provided
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        
        try {
          await axios.post(`${API}/tips/${tipId}/upload-image`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        } catch (imgError) {
          console.error('Error uploading image:', imgError);
          toast.error('Tip oprettet, men billede kunne ikke uploades');
        }
      }
      
      toast.success('Dit tip er sendt til godkendelse! Du får besked når det er offentliggjort.');
      navigate('/tips');
    } catch (error) {
      console.error('Error creating tip:', error);
      toast.error('Kunne ikke oprette tip. Prøv igen.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/tips')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FaArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Del Dit Tip</h1>
          <p className="text-gray-600">Hjælp fællesskabet med din erfaring og viden</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-6">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kategori *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  category === cat.id
                    ? 'bg-cyan-500 text-white border-cyan-500'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-cyan-300'
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="text-sm font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titel * <span className="text-gray-400 text-xs">({title.length}/100 tegn)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="F.eks. 'Sådan justerer du temperaturen på Elmeco maskiner'"
            maxLength={100}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            required
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Indhold * <span className="text-gray-400 text-xs">({content.length}/1000 tegn)</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Del din erfaring, tip eller trick her. Vær så detaljeret som muligt, så andre kan lære af dit råd."
            maxLength={1000}
            rows={10}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            required
          />
          <p className="text-xs text-gray-500 mt-2">
            💡 Tip: Brug konkrete eksempler og trin-for-trin vejledninger når det er relevant.
          </p>
        </div>

        {/* International */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isInternational}
              onChange={(e) => setIsInternational(e.target.checked)}
              className="w-5 h-5 text-cyan-500 rounded focus:ring-2 focus:ring-cyan-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-medium text-gray-900">
                <FaGlobe className="text-blue-500" />
                <span>Internationalt tip</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Markér dette, hvis dit tip er relevant for brugere i alle lande (f.eks. generel maskinteknik eller vedligehold).
              </p>
            </div>
          </label>
        </div>

        {/* Info Box */}
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <p className="text-sm text-gray-700">
            <strong>📝 Bemærk:</strong> Dit tip skal godkendes af en administrator før det bliver synligt for andre brugere. 
            Dette sikrer kvalitet og relevans i fællesskabet.
          </p>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/tips')}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Annuller
          </button>
          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
            className="flex-1 px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {submitting ? 'Sender...' : 'Send til Godkendelse'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTipPage;
