import React from 'react';
import { FaCrown, FaTimes, FaCheck } from 'react-icons/fa';

const UpgradeModal = ({ isOpen, onClose, reason = 'general' }) => {
  if (!isOpen) return null;

  const messages = {
    'recipe_locked': {
      title: 'Denne opskrift er kun tilgængelig for Pro-brugere',
      description: 'Få ubegrænset adgang til alle opskrifter og funktioner i Slush Book Pro.'
    },
    'recipe_limit': {
      title: 'Du har nået grænsen for gratis opskrifter',
      description: 'Få ubegrænset adgang til alle opskrifter og funktioner i Slush Book Pro.'
    },
    'publish': {
      title: 'Deling kræver Pro-adgang',
      description: 'Få ubegrænset adgang til alle opskrifter og funktioner i Slush Book Pro.'
    },
    'general': {
      title: 'Opgradér til SLUSHBOOK Pro',
      description: 'Få ubegrænset adgang til alle opskrifter og funktioner i Slush Book Pro.'
    }
  };

  const message = messages[reason] || messages.general;

  const handleUpgrade = () => {
    window.open('https://slushbook.dk/upgrade', '_blank');
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
            <span className="text-sm text-gray-700">Ubegrænset adgang til alle opskrifter</span>
          </div>
          <div className="flex items-start gap-3">
            <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
            <span className="text-sm text-gray-700">Opret og udgiv dine egne opskrifter</span>
          </div>
          <div className="flex items-start gap-3">
            <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
            <span className="text-sm text-gray-700">Prioriteret support</span>
          </div>
          <div className="flex items-start gap-3">
            <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
            <span className="text-sm text-gray-700">Eksklusive Pro-funktioner</span>
          </div>
        </div>

        <button
          onClick={handleUpgrade}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-3 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all shadow-lg"
        >
          Køb Pro-adgang
        </button>

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
