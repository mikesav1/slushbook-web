import React, { useState } from 'react';
import { FaRobot, FaCalculator, FaLightbulb, FaComments } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import AIChatPopup from '../components/AIChatPopup';

const SlushBookAI = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('brix');
  const [showBrixPopup, setShowBrixPopup] = useState(false);
  const [showTipsPopup, setShowTipsPopup] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);

  const tabs = [
    {
      id: 'brix',
      name: 'Brix Assistent',
      icon: FaCalculator,
      color: 'from-blue-500 to-cyan-600',
      description: 'Præcise Brix-beregninger og justeringsforslag',
      features: [
        'Beregn samlet Brix for din opskrift',
        'Få forslag til justering (12-14°Bx)',
        'Tjek frysestabilitet',
        'Alkoholberegning'
      ]
    },
    {
      id: 'tips',
      name: 'Tips & Tricks',
      icon: FaLightbulb,
      color: 'from-green-500 to-teal-600',
      description: 'Få eksperthjælp til opskrifter og maskinindstillinger',
      features: [
        'Smag og konsistens råd',
        'Ingrediens udskiftninger',
        'Maskintips og fejlretning',
        'Temperatur og frysepunkt'
      ]
    },
    {
      id: 'chat',
      name: 'Fri Chat',
      icon: FaComments,
      color: 'from-purple-500 to-pink-600',
      description: 'Stil generelle spørgsmål om slushice',
      features: [
        'Åbent chat-format',
        'Alle typer spørgsmål',
        'Kreative ideer',
        'Generel vejledning'
      ]
    }
  ];

  const currentTab = tabs.find(t => t.id === activeTab);
  const IconComponent = currentTab.icon;

  const openPopup = () => {
    if (activeTab === 'brix') setShowBrixPopup(true);
    else if (activeTab === 'tips') setShowTipsPopup(true);
    else if (activeTab === 'chat') setShowChatPopup(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FaRobot className="text-6xl text-blue-500" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SlushBook AI
            </h1>
            <span className="px-3 py-1 bg-blue-100 text-blue-600 text-sm font-bold rounded-full">
              BETA
            </span>
          </div>
          <p className="text-xl text-gray-600">
            Din AI-assistent til perfekte slushice opskrifter
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-2 shadow-sm">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r ' + tab.color + ' text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <TabIcon className="text-xl" />
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Tab Header */}
          <div className={`bg-gradient-to-r ${currentTab.color} p-8 text-white`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 p-4 rounded-xl">
                <IconComponent className="text-4xl" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">{currentTab.name}</h2>
                <p className="text-white/90 text-lg">{currentTab.description}</p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="p-8">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Funktioner:</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {currentTab.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className={`bg-gradient-to-br ${currentTab.color} text-white p-2 rounded-lg flex-shrink-0`}>
                    ✓
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* Start Button */}
            <button
              onClick={openPopup}
              className={`w-full py-4 px-6 bg-gradient-to-r ${currentTab.color} text-white font-bold text-lg rounded-xl hover:shadow-xl transition-all transform hover:scale-105`}
            >
              <div className="flex items-center justify-center gap-3">
                <FaRobot className="text-2xl" />
                <span>Start {currentTab.name}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-2">
            💡 Tip: Flersprogsunderstøttelse
          </h3>
          <p className="text-blue-800">
            AI'en svarer automatisk på samme sprog som du spørger på. 
            Understøttet: Dansk, Engelsk, Tysk, Fransk.
          </p>
        </div>
      </div>

      {/* AI Popups */}
      <AIChatPopup
        isOpen={showBrixPopup}
        onClose={() => setShowBrixPopup(false)}
        endpoint="/api/ai/brix"
        title="Brix Assistent"
        placeholder="Beskriv dine ingredienser og mængder..."
      />

      <AIChatPopup
        isOpen={showTipsPopup}
        onClose={() => setShowTipsPopup(false)}
        endpoint="/api/ai/help"
        title="Tips & Tricks"
        placeholder="Stil dit spørgsmål om slushice..."
      />

      <AIChatPopup
        isOpen={showChatPopup}
        onClose={() => setShowChatPopup(false)}
        endpoint="/api/ai/create-recipe"
        title="Opskriftsgenerator"
        placeholder="Beskriv din ønskede slush-opskrift..."
      />
    </div>
  );
};

export default SlushBookAI;
