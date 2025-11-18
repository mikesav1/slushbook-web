import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FaUserShield, FaKey, FaExclamationTriangle } from 'react-icons/fa';
import { Button } from '../components/ui/button';
import { API } from '../App';

const SetupPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSetup = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/auth/setup-admin`);
      setResult(response.data);
      
      if (response.data.status === 'created') {
        toast.success('Admin bruger oprettet!');
      } else if (response.data.status === 'already_exists') {
        toast.info('Admin bruger findes allerede');
      } else {
        toast.error('Kunne ikke oprette admin');
      }
    } catch (error) {
      console.error('Error setting up admin:', error);
      toast.error('Fejl ved oprettelse af admin');
      setResult({
        status: 'error',
        message: error.response?.data?.detail || 'Ukendt fejl'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FaUserShield className="text-4xl text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Setup Admin Bruger
              </h1>
              <p className="text-gray-600">
                Opret en admin bruger til systemet
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <FaKey className="text-blue-600 text-xl flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-blue-900 mb-2">📝 Information</h3>
                <p className="text-blue-800 text-sm mb-2">
                  Dette vil oprette en admin bruger med følgende credentials:
                </p>
                <ul className="text-blue-800 text-sm space-y-1 ml-4">
                  <li>• <strong>Email:</strong> admin@slushbook.dk</li>
                  <li>• <strong>Password:</strong> admin123</li>
                  <li>• <strong>Rolle:</strong> Admin</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Warning */}
          {!result && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="text-yellow-600 text-xl flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-yellow-900 mb-2">⚠️ Vigtigt!</h3>
                  <p className="text-yellow-800 text-sm">
                    Husk at ændre password efter første login af sikkerhedsmæssige årsager!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          {!result && (
            <Button
              onClick={handleSetup}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-4 text-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Opretter...
                </div>
              ) : (
                '🔐 Opret Admin Bruger'
              )}
            </Button>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            {result.status === 'created' && (
              <div className="text-center">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-green-600 mb-4">
                  Admin Bruger Oprettet!
                </h2>
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 mb-6 text-left">
                  <h3 className="font-bold text-green-900 mb-3">🔑 Login Credentials:</h3>
                  <div className="space-y-2">
                    <div className="bg-white rounded p-3 border border-green-200">
                      <span className="text-sm text-gray-600">Email:</span>
                      <p className="font-mono font-bold text-gray-900">{result.email}</p>
                    </div>
                    <div className="bg-white rounded p-3 border border-green-200">
                      <span className="text-sm text-gray-600">Password:</span>
                      <p className="font-mono font-bold text-gray-900">{result.password}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                  <p className="text-red-800 font-semibold">
                    ⚠️ {result.warning}
                  </p>
                </div>
              </div>
            )}

            {result.status === 'already_exists' && (
              <div className="text-center">
                <div className="text-6xl mb-4">ℹ️</div>
                <h2 className="text-2xl font-bold text-blue-600 mb-4">
                  Admin Bruger Findes Allerede
                </h2>
                <p className="text-gray-700">
                  Der er allerede en admin bruger med email: <strong>{result.email}</strong>
                </p>
              </div>
            )}

            {result.status === 'error' && (
              <div className="text-center">
                <div className="text-6xl mb-4">❌</div>
                <h2 className="text-2xl font-bold text-red-600 mb-4">
                  Fejl ved Oprettelse
                </h2>
                <p className="text-gray-700">{result.message}</p>
              </div>
            )}
          </div>
        )}

        {/* Additional Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h3 className="font-bold text-gray-900 mb-3">ℹ️ Hvad gør dette?</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <span>Opretter en ny bruger med admin rettigheder</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <span>Giver adgang til alle admin funktioner</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <span>Hvis admin brugeren allerede findes, får du besked</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <span>Brugeren kan login med de viste credentials</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
