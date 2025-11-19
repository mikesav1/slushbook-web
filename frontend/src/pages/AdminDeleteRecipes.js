import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FaTrash, FaExclamationTriangle, FaSkull } from 'react-icons/fa';
import { Button } from '../components/ui/button';
import { API } from '../App';

const AdminDeleteRecipes = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== 'SLET ALT') {
      toast.error('Skriv "SLET ALT" for at bekræfte');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API}/admin/delete-all-recipes`, {}, {
        withCredentials: true
      });
      
      setResult(response.data);
      
      if (response.data.success) {
        toast.success(response.data.message);
        setConfirmText('');
      }
    } catch (error) {
      console.error('Error deleting recipes:', error);
      toast.error('Kunne ikke slette opskrifter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FaSkull className="text-5xl text-red-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ⚠️ Slet ALLE Opskrifter
              </h1>
              <p className="text-gray-600">
                ADVARSEL: Dette sletter ALLE system opskrifter permanent!
              </p>
            </div>
          </div>

          {/* Critical Warning */}
          <div className="bg-red-100 border-4 border-red-500 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <FaExclamationTriangle className="text-red-600 text-4xl flex-shrink-0 mt-1 animate-pulse" />
              <div>
                <h3 className="font-bold text-red-900 text-xl mb-3">🚨 KRITISK ADVARSEL!</h3>
                <ul className="text-red-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Dette sletter <strong>ALLE</strong> system opskrifter fra databasen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Handlingen kan <strong>IKKE</strong> fortrydes!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Alle billeder, ingredienser og data mistes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Bruger-opskrifter påvirkes IKKE</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {!result && (
            <>
              {/* Use Case */}
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-blue-900 mb-2">💡 Hvornår skal dette bruges?</h3>
                <p className="text-blue-800 text-sm">
                  Brug denne funktion når du skal erstatte ALLE opskrifter med nye fra en CSV import.
                  F.eks. efter en database migration eller rollback.
                </p>
              </div>

              {/* Confirmation Input */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Skriv "SLET ALT" for at bekræfte:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="SLET ALT"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg font-bold"
                />
              </div>

              {/* Delete Button */}
              <Button
                onClick={handleDelete}
                disabled={loading || confirmText !== 'SLET ALT'}
                className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-bold py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Sletter...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FaTrash />
                    Slet ALLE System Opskrifter
                  </div>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <FaTrash className="text-6xl text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Opskrifter Slettet
              </h2>
              
              <div className="bg-red-50 rounded-lg p-6 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-3xl font-bold text-red-600">
                      {result.count_before}
                    </div>
                    <div className="text-sm text-red-800">Før sletning</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">
                      {result.deleted}
                    </div>
                    <div className="text-sm text-green-800">Slettet</div>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Alle system opskrifter er nu slettet. Du kan nu importere nye opskrifter via CSV.
              </p>
              
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => window.location.href = '/admin/import-csv'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Gå til CSV Import
                </Button>
                <Button
                  onClick={() => setResult(null)}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  Slet Flere
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h3 className="font-bold text-gray-900 mb-3">📋 Sådan fortsætter du:</h3>
          <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
            <li>Slet alle gamle opskrifter (denne side)</li>
            <li>Gå til Admin → Import CSV</li>
            <li>Upload din nye CSV fil med opskrifter</li>
            <li>Verificer at alle opskrifter er importeret korrekt</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default AdminDeleteRecipes;
