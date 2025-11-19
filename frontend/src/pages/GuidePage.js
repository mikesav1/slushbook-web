import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FaArrowLeft, 
  FaBook, 
  FaMagic, 
  FaShoppingCart, 
  FaCog,
  FaRocket,
  FaQuestionCircle,
  FaLightbulb,
  FaTint,
  FaChartLine
} from 'react-icons/fa';

const GuidePage = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          to="/settings" 
          className="text-cyan-600 hover:text-cyan-700 flex items-center gap-2"
        >
          <FaArrowLeft /> {t('guide.backToSettings')}
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h1 className="text-4xl font-bold mb-4 text-gray-800 flex items-center gap-3">
          <FaBook className="text-cyan-600" /> {t('guide.title')}
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          {t('guide.subtitle')}
        </p>

        {/* Quick Start */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaRocket className="text-cyan-600" /> {t('guide.quickStart')}
          </h2>
          <div className="space-y-3 text-gray-700">
            <p>
              <strong>{t('guide.newUser')}</strong> {t('guide.newUserText')}
            </p>
            <p>
              <strong>{t('guide.proUser')}</strong> {t('guide.proUserText')}
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaBook className="text-cyan-600" /> {t('guide.recipesTitle')}
          </h2>
          <div className="space-y-4 text-gray-700 ml-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">{t('guide.findRecipes')}</h3>
              <p>{t('guide.findRecipesDesc')}</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>{t('guide.filterType')}</li>
                <li>{t('guide.filterAlcohol')}</li>
                <li>{t('guide.searchNameIngredients')}</li>
                <li><strong>{t('guide.advancedSearch')}</strong> {t('guide.advancedSearchDesc')}</li>
                <li><strong>{t('guide.allergenFilters')}</strong> {t('guide.allergenFiltersDesc')}</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">{t('guide.commentsReviews')}</h3>
              <p>{t('guide.commentsReviewsDesc')}</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>{t('guide.rateRecipes')}</li>
                <li>{t('guide.writeComments')}</li>
                <li>{t('guide.seeOthersOpinions')}</li>
                <li>{t('guide.proUnlimitedComments')}</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">{t('guide.seeAuthors')}</h3>
              <p>
                {t('guide.seeAuthorsDesc')}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">{t('guide.scaling')}</h3>
              <p>
                {t('guide.scalingDesc')}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">{t('guide.addOwnRecipes')}</h3>
              <p>
                {t('guide.addOwnRecipesDesc')}
              </p>
              
              {/* Copyright Notice */}
              <div className="mt-4 bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h4 className="font-bold text-amber-900 mb-2">{t('guide.copyrightNoticeTitle')}</h4>
                    <p className="text-sm text-amber-800 mb-2">
                      {t('guide.copyrightNoticeDesc')}
                    </p>
                    <ul className="list-disc pl-5 text-sm text-amber-800 space-y-1">
                      <li><strong>{t('guide.useOwnImages')}</strong></li>
                      <li>{t('guide.noInternetImages')}</li>
                      <li>{t('guide.publicRecipeConfirm')}</li>
                      <li>{t('guide.privateNoConfirm')}</li>
                    </ul>
                    <p className="text-xs text-amber-700 mt-3 italic">
                      {t('guide.copyrightProtection')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Favorites and Ratings */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaChartLine className="text-pink-600" /> {t('guide.favoritesRatingsTitle')}
          </h2>
          <div className="space-y-4 text-gray-700 ml-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">{t('guide.saveFavoritesTitle')}</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>{t('guide.clickStarToSave')}</li>
                <li>{t('guide.freeFavoriteLimit')}</li>
                <li>{t('guide.proUnlimitedFavorites')}</li>
                <li>{t('guide.findFavoritesFilter')}</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">{t('guide.rateRecipesTitle')}</h3>
              <p>{t('guide.rateRecipesDesc')}</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>{t('guide.give1to5Stars')}</li>
                <li>{t('guide.onlyProCanRate')}</li>
                <li>{t('guide.averageRatingShown')}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Match Finder */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaMagic className="text-purple-600" /> Match Finder
          </h2>
          <div className="space-y-3 text-gray-700 ml-4">
            <p>
              Match Finder hjælper dig med at finde opskrifter baseret på de ingredienser, du har derhjemme.
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Gå til "Match" i menuen</li>
              <li>Vælg de ingredienser, du har tilgængelige</li>
              <li>Se opskrifter sorteret efter hvor godt de matcher</li>
            </ol>
          </div>
        </section>

        {/* Shopping List */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaShoppingCart className="text-green-600" /> Indkøbsliste
          </h2>
          <div className="space-y-3 text-gray-700 ml-4">
            <p>
              Opret en indkøbsliste direkte fra dine opskrifter:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Åbn en opskrift</li>
              <li>Klik på "Tilføj til liste" ved de ingredienser, du mangler</li>
              <li>Gå til "Liste" i menuen for at se din samlede indkøbsliste</li>
              <li>Klik på købslinks for at købe direkte hos leverandører</li>
            </ol>
          </div>
        </section>

        {/* Settings */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaCog className="text-gray-600" /> Maskiner & Indstillinger
          </h2>
          <div className="space-y-3 text-gray-700 ml-4">
            <p>
              Tilføj dine slush-maskiner under Indstillinger for at få automatisk skalering:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Angiv beholder størrelse (f.eks. 6L, 12L)</li>
              <li>Sæt tab-margin (typisk 5%)</li>
              <li>Opskrifter vil automatisk tilpasse sig din maskine</li>
            </ul>
          </div>
        </section>

        {/* BRIX */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaTint className="text-blue-600" /> Hvad er BRIX?
          </h2>
          <div className="space-y-3 text-gray-700 ml-4">
            <p>
              BRIX er målet for sukkerindhold i din slushice. Det påvirker både frysepunkt og konsistens.
            </p>
            <div className="bg-cyan-50 p-4 rounded-lg mt-4">
              <p className="font-semibold mb-2">Tommelfingerregel:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>10-12 BRIX:</strong> Meget let, hurtig frysning (god til kolde dage)</li>
                <li><strong>13-15 BRIX:</strong> Standard (fungerer godt året rundt)</li>
                <li><strong>16-18 BRIX:</strong> Sød og cremet (god til varme dage)</li>
              </ul>
            </div>
            <p className="mt-3">
              <Link to="/brix-info" className="text-cyan-600 hover:underline">
                Læs mere om BRIX her →
              </Link>
            </p>
          </div>
        </section>

        {/* Tips & Tricks Community */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaLightbulb className="text-yellow-600" /> 🆕 Community Forum (Tips & Tricks)
          </h2>
          <div className="space-y-4 text-gray-700 ml-4">
            <p>
              Deltag i SLUSHBOOK's community forum og del viden med andre brugere. 
              Forum dækker maskiner, produkter, rengøring, teknik og meget mere.
            </p>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Sådan fungerer det:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Læs tips:</strong> Browse tips organiseret i kategorier (maskiner, produkter, rengøring, osv.)</li>
                <li><strong>Fold ud/ind:</strong> Klik på et tip for at læse hele indholdet</li>
                <li><strong>Kommenter:</strong> Svar på andres tips og stil spørgsmål (kun PRO)</li>
                <li><strong>Del viden:</strong> Opret dine egne tips med tekst og billeder (kun PRO)</li>
                <li><strong>Like:</strong> Giv hjertemarkeringer til nyttige tips (kun PRO)</li>
                <li><strong>Internationale tips:</strong> Slå "Inkl. internationale" til/fra for at se tips fra andre lande</li>
              </ul>
            </div>

            <div className="bg-cyan-50 p-4 rounded-lg mt-4">
              <p className="font-semibold mb-2">💡 Hurtige tips:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Gem dine favoritopskrifter ved at klikke på ⭐ på en opskrift</li>
                <li>Brug tags til at finde lignende opskrifter (f.eks. #sommer, #barn)</li>
                <li>Eksperimentér med farver - tilføj naturlige farvestoffer for sjov effekt</li>
                <li>Tilføj alkohol? Husk at BRIX skal justeres ned, da alkohol sænker frysepunkt</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mt-4">
              <p className="font-semibold text-yellow-900 mb-2">⚠️ Vigtigt om opslag</p>
              <p className="text-sm text-yellow-800">
                Tips publiceres øjeblikkeligt uden godkendelse. Som administrator kan vi slette upassende indlæg. 
                Vær respektfuld og del konstruktiv viden med fællesskabet.
              </p>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="mb-8 bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaQuestionCircle className="text-cyan-600" /> Brug for hjælp?
          </h2>
          <p className="text-gray-700">
            Har du spørgsmål eller feedback? Kontakt os på{' '}
            <a href="mailto:support@slushbook.dk" className="text-cyan-600 hover:underline font-semibold">
              support@slushbook.dk
            </a>
          </p>
        </section>

        {/* Back Button */}
        <div className="pt-6 border-t border-gray-200">
          <Link 
            to="/settings"
            className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-700 font-semibold"
          >
            <FaArrowLeft /> Tilbage til Indstillinger
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GuidePage;
