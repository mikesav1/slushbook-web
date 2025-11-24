import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FaMagic, FaBoxOpen, FaTimes, FaPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { API } from '../App';
import RecipeCard from '../components/RecipeCard';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import OnboardingTooltip from '../components/OnboardingTooltip';
import { matchPageSteps, isTourCompleted, markTourCompleted, TOUR_KEYS } from '../utils/onboarding';
import { useTranslation } from 'react-i18next';

const MatchFinderPage = ({ sessionId }) => {
  const { user, updateCompletedTours } = useAuth();
  const { t } = useTranslation();
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pantryCount, setPantryCount] = useState(0);
  const [pantryItems, setPantryItems] = useState([]);
  const [currentTourStep, setCurrentTourStep] = useState(-1);
  const [previousPantryCount, setPreviousPantryCount] = useState(0);

  useEffect(() => {
    checkPantry();
    
    // Restore previous match results if they exist
    const savedMatches = sessionStorage.getItem(`matches_${sessionId}`);
    if (savedMatches) {
      try {
        setMatches(JSON.parse(savedMatches));
      } catch (e) {
        console.error('Error restoring matches:', e);
      }
    }
  }, [sessionId]);

  // Clear matches when pantry changes
  useEffect(() => {
    if (previousPantryCount !== pantryCount && previousPantryCount !== 0) {
      console.log(`Pantry changed from ${previousPantryCount} to ${pantryCount} - clearing matches`);
      setMatches(null);
      sessionStorage.removeItem(`matches_${sessionId}`);
      
      // Notify user that they should re-run match
      if (pantryCount > 0) {
        toast.info(t('matchFinder.pantryUpdated', 'Dine ingredienser er opdateret! Klik "Find matches" for at se nye resultater.'), {
          duration: 4000
        });
      }
    }
    setPreviousPantryCount(pantryCount);
  }, [pantryCount]);


  // Start tour for first-time users
  useEffect(() => {
    if (user && user.role !== 'guest' && !isTourCompleted(TOUR_KEYS.MATCH, user)) {
      console.log('[Tour] Starting match finder tour...');
      setTimeout(() => {
        setCurrentTourStep(0);
      }, 1500);
    }
  }, [user]);

  const handleTourNext = () => {
    setCurrentTourStep(prev => prev + 1);
  };

  const handleTourSkip = () => {
    markTourCompleted(TOUR_KEYS.MATCH, API, updateCompletedTours);
    setCurrentTourStep(-1);
  };

  const handleTourFinish = () => {
    markTourCompleted(TOUR_KEYS.MATCH, API, updateCompletedTours);
    setCurrentTourStep(-1);
    toast.success(t('matchFinder.tourComplete', 'Match-Finder guide færdig!'));
  };


  const checkPantry = async () => {
    try {
      const response = await axios.get(`${API}/pantry/${sessionId}`);
      setPantryItems(response.data);
      setPantryCount(response.data.length);
    } catch (error) {
      console.error('Error checking pantry:', error);
    }
  };

  const removeIngredient = async (itemId) => {
    try {
      await axios.delete(`${API}/pantry/${sessionId}/${itemId}`);
      toast.success(t('matchFinder.ingredientRemoved', 'Ingrediens fjernet'));
      
      // Clear matches since pantry changed
      setMatches(null);
      
      checkPantry(); // Refresh pantry count
    } catch (error) {
      console.error('Error removing ingredient:', error);
      toast.error(t('matchFinder.removeError', 'Kunne ikke fjerne ingrediens'));
    }
  };

  const findMatches = async () => {
    if (pantryCount === 0) {
      toast.error(t('matchFinder.addIngredientsFirst', 'Tilføj ingredienser først!'));
      return;
    }

    setLoading(true);
    try {
      // Add cache busting
      const response = await axios.post(`${API}/match?_t=${Date.now()}`, {
        session_id: sessionId
      });
      
      console.log('Match Results:', {
        can_make: response.data.can_make_now?.length,
        almost: response.data.almost?.length,
        need_more: response.data.need_more?.length,
        pantry_items: pantryItems.map(i => i.ingredient_name)
      });
      
      setMatches(response.data);
      
      // Save matches AND pantry snapshot to sessionStorage
      sessionStorage.setItem(`matches_${sessionId}`, JSON.stringify(response.data));
      sessionStorage.setItem(`pantry_snapshot_${sessionId}`, JSON.stringify(pantryItems));
      
      toast.success(t('matchFinder.foundMatches', `Fandt ${response.data.can_make_now?.length || 0} matches!`, { count: response.data.can_make_now?.length || 0 }));
    } catch (error) {
      console.error('Error finding matches:', error);
      toast.error(t('matchFinder.searchError', 'Kunne ikke finde matches'));
    } finally {
      setLoading(false);
    }
  };

  // Show upgrade modal for guest users
  if (!user || user.role === 'guest') {
    return (
      <div className="space-y-6 fade-in" data-testid="match-finder-page">
        <div>
          <h1 className="text-4xl font-bold mb-2">{t('matchFinder.title')}</h1>
          <p className="text-gray-600">{t('matchFinder.subtitle')}</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-coral-50 rounded-2xl p-8 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-6xl">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800">{t('matchFinder.proFeature', 'Match-Finder er en PRO-funktion')}</h2>
            <p className="text-gray-600">
              {t('matchFinder.upgradeMessage', 'Opgradér til PRO for at matche dine ingredienser med opskrifter og finde ud af hvad du kan lave!')}
            </p>
            <div className="pt-4">
              <a
                href="/upgrade"
                className="inline-block bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                {t('matchFinder.upgradeToPro', 'Opgradér til PRO')}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="match-finder-page">
      {/* Onboarding Tour */}
      <OnboardingTooltip
        steps={matchPageSteps}
        currentStep={currentTourStep}
        onNext={handleTourNext}
        onSkip={handleTourSkip}
        onFinish={handleTourFinish}
      />
      
      <div>
        <h1 className="text-4xl font-bold mb-2">{t('matchFinder.title')}</h1>
        <p className="text-gray-600">{t('matchFinder.subtitle')}</p>
      </div>

      {/* Ingredients Display & Actions */}
      <div className="bg-gradient-to-br from-cyan-50 to-coral-50 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-1">{t('matchFinder.yourIngredients')}</h3>
            <p className="text-gray-600">
              {t(pantryCount === 1 ? 'matchFinder.ingredientCount' : 'matchFinder.ingredientCountPlural', { count: pantryCount })}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link to="/pantry" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full" data-tour="add-pantry-button">
                <FaPlus className="mr-2" /> {t('matchFinder.addMore')}
              </Button>
            </Link>
            <Button
              onClick={findMatches}
              disabled={loading || pantryCount === 0}
              data-testid="find-match-button"
              data-tour="find-matches-button"
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 w-full sm:w-auto"
            >
              <FaMagic className="mr-2" />
              {loading ? t('matchFinder.searching') : t('matchFinder.findMatches')}
            </Button>
          </div>
        </div>

        {/* Ingredient Pills */}
        {pantryCount > 0 ? (
          <div className="flex flex-wrap gap-2 mt-4">
            {pantryItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-full px-4 py-2 flex items-center gap-2 shadow-sm border border-gray-200 hover:border-cyan-300 transition-all group"
              >
                <span className="font-medium text-gray-800">{item.ingredient_name}</span>
                <button
                  onClick={() => removeIngredient(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Fjern ingrediens"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white/50 rounded-lg mt-4">
            <FaBoxOpen className="mx-auto text-4xl text-gray-300 mb-3" />
            <p className="text-gray-500 mb-4">{t('matchFinder.noIngredients')}</p>
            <Link to="/pantry">
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                <FaPlus className="mr-2" /> {t('matchFinder.addIngredients', 'Tilføj Ingredienser')}
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Hint Card - Only show if no matches yet */}
      {!matches && pantryCount > 0 && (
        <div className="bg-white rounded-lg p-6 border-l-4 border-cyan-500 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <span className="text-2xl">💡</span>
            Klar til at finde matches?
          </h3>
          <p className="text-gray-600">
            Klik på "Find matches" for at se hvilke opskrifter du kan lave med dine ingredienser
          </p>
        </div>
      )}

      {/* Results */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      )}

      {matches && (
        <div className="space-y-8">
          {/* All recipes with user's ingredients - sorted by match count */}
          {(matches.can_make_now && matches.can_make_now.length > 0) || (matches.almost && matches.almost.length > 0) ? (
            <>
              {/* Perfect matches first */}
              {matches.can_make_now && matches.can_make_now.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <h2 className="text-2xl font-bold">Har alle ingredienser ✓</h2>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {matches.can_make_now.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {matches.can_make_now.map((item) => (
                      <RecipeCard
                        key={item.recipe.id}
                        recipe={item.recipe}
                        sessionId={sessionId}
                        showMatchInfo={item}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recipes with some ingredients */}
              {matches.almost && matches.almost.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                    <h2 className="text-2xl font-bold">Bruger dine ingredienser</h2>
                    <span className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {matches.almost.length}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">Klik på en opskrift for at se hvad du mangler</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {matches.almost.map((item) => (
                      <RecipeCard
                        key={item.recipe.id}
                        recipe={item.recipe}
                        sessionId={sessionId}
                        showMatchInfo={item}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Ingen opskrifter bruger disse ingredienser</h3>
              <p className="text-gray-600 mb-6">
                Prøv at tilføje andre ingredienser til dit pantry
              </p>
            </div>
          )}
        </div>
      )}

      {!matches && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold mb-2">
            {t('matchFinder.readyToMatch')}
          </h3>
          <p className="text-gray-600 text-center">
            {t('matchFinder.clickToMatch')}
          </p>
        </div>
      )}
    </div>
  );
};

export default MatchFinderPage;