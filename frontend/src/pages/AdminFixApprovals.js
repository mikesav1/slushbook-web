import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { Button } from '../components/ui/button';
import { API } from '../App';

const AdminFixApprovals = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFixAll = async () => {
    if (!window.confirm('Er du sikker på at du vil godkende ALLE ventende opskrifter? Dette kan ikke fortrydes.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API}/admin/fix-all-approvals`, {}, {
        withCredentials: true
      });
      
      setResult(response.data);
      
      if (response.data.success) {
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error('Error fixing approvals:', error);
      toast.error('Kunne ikke godkende opskrifter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FaCheckCircle className="text-4xl text-orange-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Godkend Alle Opskrifter
              </h1>
              <p className="text-gray-600">
                Godkend alle ventende opskrifter med ét enkelt klik
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="text-yellow-600 text-xl flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-yellow-900 mb-2">⚠️ Vigtigt!</h3>
                <p className="text-yellow-800 text-sm">
                  Dette vil godkende ALLE opskrifter der har status "pending" eller mangler approval status.
                  Handlingen kan ikke fortrydes, så sørg for at du er sikker før du fortsætter.
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleFixAll}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 text-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Godkender...
              </div>
            ) : (
              '✅ Godkend Alle Opskrifter'
            )}
          </Button>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Resultat</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{result.found}</div>
                <div className="text-sm text-blue-800">Fundet</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{result.updated}</div>
                <div className="text-sm text-green-800">Opdateret</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {result.found - result.updated}
                </div>
                <div className="text-sm text-purple-800">Allerede OK</div>
              </div>
            </div>

            {result.recipes && result.recipes.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 mb-3">
                  Godkendte opskrifter ({Math.min(result.recipes.length, 50)}):
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <ul className="space-y-2">
                    {result.recipes.map((recipe, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <FaCheckCircle className="text-green-500 flex-shrink-0" />
                        <span className="font-medium">{recipe.name}</span>
                        <span className="text-gray-500 text-xs">
                          (af {recipe.author})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                {result.recipes.length > 50 && (
                  <p className="text-sm text-gray-500 mt-2">
                    ... og {result.recipes.length - 50} flere
                  </p>
                )}
              </div>
            )}

            {result.updated === 0 && (
              <div className="text-center py-8">
                <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-700">
                  Alle opskrifter er allerede godkendt! 🎉
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h3 className="font-bold text-gray-900 mb-3">ℹ️ Hvad gør dette?</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold">•</span>
              <span>Finder alle opskrifter med status "pending" eller manglende approval status</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold">•</span>
              <span>Sætter deres approval_status til "approved"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold">•</span>
              <span>Sætter deres status til "published"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold">•</span>
              <span>Opskrifterne bliver straks synlige for alle brugere</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminFixApprovals;
