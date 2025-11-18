import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FaSeedling, FaCheckCircle } from 'react-icons/fa';
import { Button } from '../components/ui/button';
import { API } from '../App';

const AdminSeedIngredients = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const defaultIngredients = [
    { name: "Jordbær sirup", category: "Sirup", brix: 65 },
    { name: "Citron sirup", category: "Sirup", brix: 65 },
    { name: "Blå curaçao", category: "Sirup", brix: 65 },
    { name: "Hindbær sirup", category: "Sirup", brix: 65 },
    { name: "Vanilje sirup", category: "Sirup", brix: 65 },
    { name: "Karamel sirup", category: "Sirup", brix: 65 },
    { name: "Power", category: "Energidrik", brix: 11 },
    { name: "Sodastream", category: "Sodavand", brix: 10 },
    { name: "Coca Cola", category: "Sodavand", brix: 11 },
    { name: "Sprite", category: "Sodavand", brix: 9 },
    { name: "Fanta", category: "Sodavand", brix: 12 },
    { name: "Appelsin juice", category: "Juice", brix: 11 },
    { name: "Æble juice", category: "Juice", brix: 11 },
    { name: "Ananas juice", category: "Juice", brix: 13 },
    { name: "Mango juice", category: "Juice", brix: 14 },
    { name: "Vodka", category: "Alkohol", brix: 0 },
    { name: "Rom", category: "Alkohol", brix: 0 },
    { name: "Tequila", category: "Alkohol", brix: 0 },
    { name: "Is", category: "Basis", brix: 0 },
    { name: "Vand", category: "Basis", brix: 0 },
  ];

  const handleSeed = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/admin/ingredients/seed`, {}, {
        withCredentials: true
      });
      
      setResult(response.data);
      
      if (response.data.success) {
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error('Error seeding ingredients:', error);
      toast.error('Kunne ikke tilføje ingredienser');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FaSeedling className="text-4xl text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Seed Standard Ingredienser
              </h1>
              <p className="text-gray-600">
                Tilføj 20 grundlæggende ingredienser til systemet
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-green-900 mb-3">📦 Hvad tilføjes?</h3>
            <p className="text-green-800 text-sm mb-3">
              Dette vil tilføje følgende ingredienser (kun hvis de ikke allerede findes):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {defaultIngredients.map((ing, index) => (
                <div key={index} className="bg-white rounded p-2 border border-green-200">
                  <span className="font-semibold">{ing.name}</span>
                  <span className="text-gray-500 text-xs ml-2">
                    ({ing.category}, {ing.brix}°Bx)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          {!result && (
            <Button
              onClick={handleSeed}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 text-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Tilføjer...
                </div>
              ) : (
                '🌱 Tilføj Standard Ingredienser'
              )}
            </Button>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {result.message}
              </h2>
              
              <div className="bg-green-50 rounded-lg p-6 mb-4">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {result.count}
                </div>
                <div className="text-sm text-green-800">
                  nye ingredienser tilføjet
                </div>
              </div>

              {result.count === 0 && (
                <p className="text-gray-600">
                  Alle standard ingredienser findes allerede i systemet! 🎉
                </p>
              )}
              
              <Button
                onClick={() => window.location.href = '/admin/ingredients'}
                className="mt-4 bg-green-600 hover:bg-green-700"
              >
                Gå til Ingredienser
              </Button>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h3 className="font-bold text-gray-900 mb-3">ℹ️ Hvad gør dette?</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              <span>Tjekker om hver ingrediens allerede findes i systemet</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              <span>Tilføjer kun ingredienser der ikke findes i forvejen</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              <span>Hver ingrediens får tildelt korrekt kategori og Brix-værdi</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              <span>Sikkert at køre flere gange - duplikater springes over</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminSeedIngredients;
