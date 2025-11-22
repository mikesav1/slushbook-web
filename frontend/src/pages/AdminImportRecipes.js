import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FaUpload, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { Button } from '../components/ui/button';
import { API } from '../App';

const AdminImportRecipes = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/json') {
      setFile(selectedFile);
      setResult(null);
    } else {
      toast.error('Vælg venligst en JSON fil');
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Vælg en fil først');
      return;
    }

    try {
      setLoading(true);
      
      // Read file content
      const fileContent = await file.text();
      const data = JSON.parse(fileContent);
      
      // Validate data
      if (!data.recipes || !Array.isArray(data.recipes)) {
        toast.error('Ugyldig fil format - mangler "recipes" array');
        return;
      }
      
      console.log(`Importerer ${data.recipes.length} opskrifter...`);
      
      // Send to backend
      const response = await axios.post(
        `${API}/admin/import-recipes-bulk`,
        { recipes: data.recipes },
        {
          headers: { 
            'Content-Type': 'application/json',
          },
          withCredentials: true
        }
      );
      
      setResult(response.data);
      
      if (response.data.success) {
        toast.success(`✅ ${response.data.message}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Pydantic validation errors
          const errorMsg = error.response.data.detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join(', ');
          toast.error(`Validerings fejl: ${errorMsg}`);
        } else {
          toast.error(`Fejl: ${error.response.data.detail}`);
        }
      } else if (error.message.includes('JSON')) {
        toast.error('Ugyldig JSON fil');
      } else {
        toast.error(`Import fejlede: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FaUpload className="text-5xl text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Import Opskrifter
              </h1>
              <p className="text-gray-600">
                Upload en JSON fil med opskrifter og oversættelser
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Instruktioner:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Download export filen fra preview miljøet</li>
              <li>Vælg filen nedenfor (complete_recipes_export.json)</li>
              <li>Klik "Start Import"</li>
              <li>Vent på at importen er færdig</li>
            </ol>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vælg JSON fil:
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-2"
              />
              {file && (
                <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
                  <FaCheckCircle />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <Button
              onClick={handleImport}
              disabled={loading || !file}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg font-bold"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Importerer...
                </>
              ) : (
                <>
                  <FaUpload className="mr-2" />
                  Start Import
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className={`rounded-xl shadow-lg p-6 ${
            result.success ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
          }`}>
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              {result.success ? (
                <>
                  <FaCheckCircle className="text-green-600" />
                  <span className="text-green-900">Import Lykkedes!</span>
                </>
              ) : (
                <>
                  <FaExclamationTriangle className="text-red-600" />
                  <span className="text-red-900">Import Fejlede</span>
                </>
              )}
            </h3>
            
            <div className="space-y-2">
              <p className="text-gray-800"><strong>Besked:</strong> {result.message}</p>
              {result.created > 0 && (
                <p className="text-green-700">✨ Oprettet: {result.created} nye opskrifter</p>
              )}
              {result.updated > 0 && (
                <p className="text-blue-700">✅ Opdateret: {result.updated} opskrifter</p>
              )}
              {result.errors > 0 && (
                <p className="text-red-700">❌ Fejl: {result.errors}</p>
              )}
              
              {result.details && result.details.length > 0 && (
                <div className="mt-4 max-h-60 overflow-y-auto bg-white p-3 rounded border">
                  <h4 className="font-semibold mb-2">Detaljer:</h4>
                  <ul className="text-sm space-y-1">
                    {result.details.map((detail, idx) => (
                      <li key={idx} className="text-gray-700">• {detail}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Download Link */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg mt-6">
          <h3 className="font-semibold text-yellow-900 mb-2">📥 Download export filen:</h3>
          <p className="text-sm text-yellow-800 mb-2">
            Hvis du ikke allerede har filen, download den her:
          </p>
          <a
            href="https://multilingual-chef-3.preview.emergentagent.com/complete_recipes_export.json"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline font-semibold"
          >
            complete_recipes_export.json
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminImportRecipes;
