import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FaMagic, FaBoxOpen } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { API } from '../App';
import RecipeCard from '../components/RecipeCard';
import { Button } from '../components/ui/button';

const MatchFinderPage = ({ sessionId }) => {
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pantryCount, setPantryCount] = useState(0);

  useEffect(() => {
    checkPantry();
  }, [sessionId]);

  const checkPantry = async () => {
    try {
      const response = await axios.get(`${API}/pantry/${sessionId}`);
      setPantryCount(response.data.length);
    } catch (error) {
      console.error('Error checking pantry:', error);
    }
  };

  const findMatches = async () => {
    if (pantryCount === 0) {
      toast.error('Tilføj ingredienser først!');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/match`, {
        session_id: sessionId
      });
      setMatches(response.data);
      toast.success('Match fundet!');
    } catch (error) {
      console.error('Error finding matches:', error);
      toast.error('Kunne ikke finde matches');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 fade-in" data-testid="match-finder-page">
      <div>
        <h1 className="text-4xl font-bold mb-2">Find Match</h1>
        <p className="text-gray-600">Opdag hvilke opskrifter du kan lave med dine ingredienser</p>
      </div>

      {/* Status Card */}
      <div className="bg-gradient-to-br from-cyan-50 to-coral-50 rounded-2xl p-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-2xl font-bold mb-2">Dine Ingredienser</h3>
            <p className="text-gray-700 text-lg">
              Du har <span className="font-bold text-cyan-600">{pantryCount}</span> ingrediens{pantryCount !== 1 ? 'er' : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/pantry">
              <Button variant="outline" data-testid="manage-pantry-button">
                <FaBoxOpen className="mr-2" /> Administrér Ingredienser
              </Button>
            </Link>
            <Button
              onClick={findMatches}
              disabled={loading || pantryCount === 0}
              data-testid="find-match-button"
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700"
            >
              <FaMagic className="mr-2" />
              {loading ? 'Søger...' : 'Find Matches'}
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      )}

      {matches && (
        <div className="space-y-8">
          {/* Can Make Now */}
          {matches.can_make_now && matches.can_make_now.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h2 className="text-2xl font-bold">Kan Laves Nu ✓</h2>
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

          {/* Almost */}
          {matches.almost && matches.almost.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <h2 className="text-2xl font-bold">Næsten I Mål</h2>
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {matches.almost.length}
                </span>
              </div>
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

          {/* Need More */}
          {matches.need_more && matches.need_more.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h2 className="text-2xl font-bold">Behøver Mere</h2>
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {matches.need_more.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.need_more.slice(0, 6).map((item) => (
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

          {/* No matches at all */}
          {matches.can_make_now?.length === 0 && matches.almost?.length === 0 && matches.need_more?.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🤷</div>
              <h3 className="text-xl font-bold mb-2">Ingen matches fundet</h3>
              <p className="text-gray-600">Prøv at tilføje flere ingredienser</p>
            </div>
          )}
        </div>
      )}

      {!matches && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold mb-2">Klar til at finde matches?</h3>
          <p className="text-gray-600">Klik på "Find Matches" for at se hvilke opskrifter du kan lave</p>
        </div>
      )}
    </div>
  );
};

export default MatchFinderPage;