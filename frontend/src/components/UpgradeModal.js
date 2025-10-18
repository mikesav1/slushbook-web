import React, { useState } from 'react';
import { FaCrown, FaTimes, FaCheck } from 'react-icons/fa';

const UpgradeModal = ({ isOpen, onClose, reason = 'general' }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const messages = {
    'recipe_locked': {
      title: 'Denne opskrift er kun tilgængelig for Pro-brugere',
      description: 'Få adgang til alle 78+ opskrifter og ubegrænsede muligheder.'
    },
    'recipe_limit': {
      title: 'Du har nået grænsen for gratis opskrifter',
      description: 'Opgradér til Pro for at oprette ubegrænset antal opskrifter.'
    },
    'publish': {
      title: 'Deling kræver Pro-adgang',
      description: 'Udgiv dine opskrifter og del dem med hele SLUSHBOOK fællesskabet.'
    },
    'general': {
      title: 'Opgradér til SLUSHBOOK Pro',
      description: 'Få fuld adgang til alle funktioner og ubegrænsede muligheder.'
    }
  };

  const message = messages[reason] || messages.general;

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Send email til waitlist
    console.log('Email submitted:', email);
    setSubmitted(true);
    setTimeout(() => {
      setEmail('');
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <FaTimes size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
            <FaCrown className="text-white text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {message.title}
          </h2>
          <p className="text-gray-600">
            {message.description}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
            <span className="text-sm text-gray-700">Adgang til alle 78+ opskrifter</span>
          </div>
          <div className="flex items-start gap-3">
            <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
            <span className="text-sm text-gray-700">Ubegrænset antal egne opskrifter</span>
          </div>
          <div className="flex items-start gap-3">
            <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
            <span className="text-sm text-gray-700">Udgiv og del dine opskrifter</span>
          </div>
          <div className="flex items-start gap-3">
            <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
            <span className="text-sm text-gray-700">Prioriteret support</span>
          </div>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pro-adgang er på vej! Få besked når det er klar:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@email.dk"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-3 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all"
            >
              Ja tak, informer mig!
            </button>
          </form>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <FaCheck className="text-green-500 text-2xl mx-auto mb-2" />
            <p className="text-green-700 font-medium">
              Tak! Vi sender dig besked når Pro er klar 🎉
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm font-medium"
        >
          Måske senere
        </button>
      </div>
    </div>
  );
};

export default UpgradeModal;
