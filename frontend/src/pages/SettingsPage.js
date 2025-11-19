import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FaCog, FaPlus, FaTrash, FaEdit, FaBook, FaGlobe, FaQuestionCircle, FaChevronDown, FaChevronUp, FaComments } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { COUNTRIES, getUserCountry, updateUserPreferences, refreshUserLocation } from '../utils/geolocation';
import OnboardingTooltip from '../components/OnboardingTooltip';
import { resetAllTours, resetTour, settingsPageSteps, isTourCompleted, markTourCompleted, TOUR_KEYS } from '../utils/onboarding';

const SettingsPage = ({ sessionId }) => {
  const { user, isAdmin, isPro, isEditor } = useAuth();
  const [machines, setMachines] = useState([]);
  const [userRecipesCount, setUserRecipesCount] = useState(0);
  const [canAddRecipe, setCanAddRecipe] = useState(true);
  const [limitMessage, setLimitMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddMachineOpen, setIsAddMachineOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editMachineId, setEditMachineId] = useState(null);
  const [newMachine, setNewMachine] = useState({
    name: '',
    tank_volumes_ml: [12000],
    loss_margin_pct: 5
  });
  const [selectedCountry, setSelectedCountry] = useState(getUserCountry());
  const [detectingCountry, setDetectingCountry] = useState(false);
  const [devices, setDevices] = useState([]);
  const [deviceLimits, setDeviceLimits] = useState({ current: 0, max: 1 });
  const [currentTourStep, setCurrentTourStep] = useState(-1);
  const [isAdminSectionExpanded, setIsAdminSectionExpanded] = useState(true);

  useEffect(() => {
    fetchData();
    fetchDevices();
    // Update selected country from localStorage when component mounts
    setSelectedCountry(getUserCountry());
  }, [sessionId]);

  // Start tour for first-time users
  useEffect(() => {
    if (user && user.role !== 'guest' && !isTourCompleted(TOUR_KEYS.SETTINGS, user)) {
      setTimeout(() => {
        setCurrentTourStep(0);
      }, 1000);
    }
  }, [user]);

  const handleTourNext = () => {
    setCurrentTourStep(prev => prev + 1);
  };

  const handleTourSkip = () => {
    markTourCompleted(TOUR_KEYS.SETTINGS, API);
    setCurrentTourStep(-1);
  };

  const handleTourFinish = () => {
    markTourCompleted(TOUR_KEYS.SETTINGS, API);
    setCurrentTourStep(-1);
    toast.success('Indstillinger guide færdig!');
  };
  
  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await axios.get(`${API}/auth/devices`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setDevices(response.data.devices);
      setDeviceLimits({
        current: response.data.current_count,
        max: response.data.max_devices
      });
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };
  
  const logoutDevice = async (deviceId, sessionToken) => {
    try {
      const token = localStorage.getItem('session_token');
      
      // Build request body - prefer device_id, fallback to session_token
      const requestBody = deviceId 
        ? { device_id: deviceId }
        : { session_token: sessionToken };
      
      await axios.post(`${API}/auth/devices/logout`, 
        requestBody,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      toast.success('Enhed logget ud');
      fetchDevices();
    } catch (error) {
      console.error('Logout device error:', error);
      toast.error('Kunne ikke logge enhed ud');
    }
  };
  
  const logoutAllDevices = async () => {
    if (!window.confirm('Log ud fra alle andre enheder?')) return;
    
    try {
      const token = localStorage.getItem('session_token');
      const response = await axios.post(`${API}/auth/devices/logout-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      toast.success(`${response.data.count} enheder logget ud`);
      fetchDevices();
    } catch (error) {
      toast.error('Kunne ikke logge ud fra enheder');
    }
  };

  const fetchData = async () => {
    try {
      const [machinesRes, limitsRes] = await Promise.all([
        axios.get(`${API}/machines/${sessionId}`),
        axios.get(`${API}/user/${sessionId}/limits`, {
          withCredentials: true
        })
      ]);
      setMachines(machinesRes.data);
      setUserRecipesCount(limitsRes.data.user_recipes_count);
      setCanAddRecipe(limitsRes.data.can_add_recipe);
      setLimitMessage(limitsRes.data.limit_message);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMachine = async (e) => {
    e.preventDefault();
    if (!newMachine.name) {
      toast.error('Indtast maskine navn');
      return;
    }

    try {
      if (isEditMode) {
        // Update existing machine
        await axios.put(`${API}/machines/${editMachineId}`, {
          session_id: sessionId,
          ...newMachine
        });
        toast.success('Maskine opdateret!');
      } else {
        // Add new machine
        await axios.post(`${API}/machines`, {
          session_id: sessionId,
          ...newMachine
        });
        toast.success('Maskine tilføjet!');
      }
      
      setIsAddMachineOpen(false);
      setIsEditMode(false);
      setEditMachineId(null);
      setNewMachine({
        name: '',
        tank_volumes_ml: [12000],
        loss_margin_pct: 5
      });
      fetchData();
    } catch (error) {
      console.error('Error saving machine:', error);
      toast.error(isEditMode ? 'Kunne ikke opdatere maskine' : 'Kunne ikke tilføje maskine');
    }
  };

  const handleEditMachine = (machine) => {
    setIsEditMode(true);
    setEditMachineId(machine.id);
    setNewMachine({
      name: machine.name,
      tank_volumes_ml: machine.tank_volumes_ml,
      loss_margin_pct: machine.loss_margin_pct
    });
    setIsAddMachineOpen(true);
  };

  const handleDeleteMachine = async (machineId) => {
    if (!window.confirm('Er du sikker på, at du vil slette denne maskine?')) {
      return;
    }

    try {
      await axios.delete(`${API}/machines/${machineId}?session_id=${sessionId}`);
      toast.success('Maskine slettet!');
      fetchData();
    } catch (error) {
      console.error('Error deleting machine:', error);
      toast.error('Kunne ikke slette maskine');
    }
  };

  const handleCancelMachine = () => {
    setIsAddMachineOpen(false);
    setIsEditMode(false);
    setEditMachineId(null);
    setNewMachine({
      name: '',
      tank_volumes_ml: [12000],
      loss_margin_pct: 5
    });
  };

  const presetMachines = [
    { name: 'SPM Pictor 6L', volumes: [6000] },
    { name: 'SPM Pictor 12L', volumes: [12000] },
    { name: 'SPM Pictor 2x12L', volumes: [12000, 12000] },
    { name: 'UGOLINI 10L', volumes: [10000] },
    { name: 'Ninja', volumes: [1890] },
    { name: 'Casper Sobzyk', volumes: [3000] },
    { name: 'Custom 6L', volumes: [6000] }
  ];

  return (
    <div className="space-y-6 fade-in" data-testid="settings-page">
      {/* Onboarding Tour */}
      <OnboardingTooltip
        steps={settingsPageSteps}
        currentStep={currentTourStep}
        onNext={handleTourNext}
        onSkip={handleTourSkip}
        onFinish={handleTourFinish}
      />
      
      <div>
        <h1 className="text-4xl font-bold mb-2">Indstillinger</h1>
        <p className="text-gray-600">Administrér din maskine og konto</p>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-4">Din Konto</h2>
        <div className="space-y-3">
          {user && (
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Bruger</span>
              <span className="text-sm font-semibold">{user.name}</span>
            </div>
          )}
          {!user && (
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Session ID</span>
              <span className="text-sm font-mono text-gray-500">{sessionId.slice(0, 8)}...</span>
            </div>
          )}
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Mine opskrifter</span>
            <span className="font-semibold">
              {userRecipesCount} {(isAdmin() || isPro() || isEditor()) ? '(ubegrænset)' : '/ 2'}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Status</span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              isAdmin() ? 'bg-red-100 text-red-700' :
              isEditor() ? 'bg-purple-100 text-purple-700' :
              isPro() ? 'bg-green-100 text-green-700' :
              'bg-cyan-100 text-cyan-700'
            }`}>
              {user ? user.role : 'Gæst'}
            </span>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gradient-to-br from-cyan-50 to-coral-50 rounded-lg">
          <p className="text-sm text-gray-700">
            {limitMessage || 'Indlæser...'}
          </p>
        </div>
      </div>

      {/* Device Management */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Dine Enheder</h2>
            <p className="text-sm text-gray-600">
              Du bruger {deviceLimits.current} af {deviceLimits.max} tilladte enheder
            </p>
          </div>
          {devices.length > 1 && (
            <Button
              onClick={logoutAllDevices}
              variant="outline"
              className="text-red-600 hover:text-red-700"
            >
              Log ud fra alle andre
            </Button>
          )}
        </div>
        
        {devices.length === 0 ? (
          <p className="text-gray-500">Ingen aktive enheder fundet</p>
        ) : (
          <div className="space-y-3">
            {devices.map((device, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  device.is_current ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-800">
                        {device.device_name}
                      </h3>
                      {device.is_current && (
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                          Nuværende enhed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Sidst aktiv: {new Date(device.last_active).toLocaleString('da-DK')}
                    </p>
                    <p className="text-xs text-gray-400">
                      IP: {device.ip_address}
                    </p>
                  </div>
                  {!device.is_current && (
                    <Button
                      onClick={() => logoutDevice(device.device_id, device.session_token)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      disabled={!device.device_id && !device.session_token}
                    >
                      Log ud
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
          <strong>💡 Tip:</strong> {deviceLimits.max === 1 
            ? 'Gratis brugere kan kun være logget ind på 1 enhed ad gangen.'
            : `Du kan være logget ind på op til ${deviceLimits.max} enheder samtidig.`}
          {deviceLimits.max < 3 && (
            <span> Opgrader til Pro for at bruge flere enheder!</span>
          )}
        </div>
      </div>

      {/* Country & Language Settings */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <FaGlobe className="text-blue-500 text-xl" />
          <h2 className="text-2xl font-bold">Land & Sprog</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Vælg dit land for at se relevante produktlinks. Dit land detekteres automatisk, men du kan ændre det her.
        </p>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Vælg Land</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(COUNTRIES).map(([code, country]) => (
                <button
                  key={code}
                  onClick={async () => {
                    setSelectedCountry(code);
                    await updateUserPreferences(code, country.lang);
                    toast.success(`Land ændret til ${country.name}`);
                  }}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    selectedCountry === code
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{country.flag}</span>
                  <span className="text-sm font-medium">{country.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                setDetectingCountry(true);
                try {
                  const result = await refreshUserLocation();
                  setSelectedCountry(result.country_code);
                  toast.success(`Land detekteret: ${COUNTRIES[result.country_code]?.name || result.country_code}`);
                } catch (error) {
                  toast.error('Kunne ikke detektere land');
                } finally {
                  setDetectingCountry(false);
                }
              }}
              disabled={detectingCountry}
              variant="outline"
              className="flex-1"
            >
              {detectingCountry ? 'Detekterer...' : '🔄 Gendetekter Land Automatisk'}
            </Button>
          </div>
          

      {/* Onboarding Tour Reset */}
      {user?.role !== 'guest' && (
        <div className="bg-yellow-50 rounded-2xl p-6 shadow-sm border border-yellow-200 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <FaQuestionCircle className="text-yellow-600 text-xl" />
            <h2 className="text-2xl font-bold">Guider & Hjælp</h2>
          </div>
          
          {/* Tips & Tricks Link */}
          <Link
            to="/tips"
            className="block p-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all mb-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  💡 Tips & Tricks
                </h3>
                <p className="text-cyan-50 text-sm mt-1">
                  Del erfaringer og lær af fællesskabet om maskiner, produkter og drift
                </p>
              </div>
              <span className="text-2xl">→</span>
            </div>
          </Link>

          <p className="text-gray-700 mb-4">
            Første gang du brugte appen, fik du vist gule guider. Hvis du vil se dem igen, kan du genstarte dem her.
          </p>
          
          {/* Reset All Tours Button */}
          <Button
            onClick={() => {
              resetAllTours();
              toast.success('Alle guider er nulstillet! De vil vises næste gang du besøger siderne.');
            }}
            data-tour="restart-tours-button"
            className="bg-yellow-500 hover:bg-yellow-600 text-white mb-4 w-full"
          >
            🔄 Genstart Alle Guider
          </Button>

          {/* Individual Tour Reset Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            <button
              onClick={() => {
                resetTour(TOUR_KEYS.HOME);
                toast.success('Hjem-guiden er nulstillet!');
              }}
              className="px-4 py-2 bg-white border-2 border-yellow-300 rounded-lg hover:bg-yellow-100 text-sm font-medium transition-colors"
            >
              🏠 Hjem
            </button>
            <button
              onClick={() => {
                resetTour(TOUR_KEYS.RECIPES);
                toast.success('Opskrifter-guiden er nulstillet!');
              }}
              className="px-4 py-2 bg-white border-2 border-yellow-300 rounded-lg hover:bg-yellow-100 text-sm font-medium transition-colors"
            >
              📖 Opskrifter
            </button>
            <button
              onClick={() => {
                resetTour(TOUR_KEYS.ADD_RECIPE);
                toast.success('Tilføj Opskrift-guiden er nulstillet!');
              }}
              className="px-4 py-2 bg-white border-2 border-yellow-300 rounded-lg hover:bg-yellow-100 text-sm font-medium transition-colors"
            >
              ➕ Tilføj Opskrift
            </button>
            <button
              onClick={() => {
                resetTour(TOUR_KEYS.MATCH);
                toast.success('Match Finder-guiden er nulstillet!');
              }}
              className="px-4 py-2 bg-white border-2 border-yellow-300 rounded-lg hover:bg-yellow-100 text-sm font-medium transition-colors"
            >
              🔍 Match Finder
            </button>
            <button
              onClick={() => {
                resetTour(TOUR_KEYS.SHOPPING_LIST);
                toast.success('Indkøbsliste-guiden er nulstillet!');
              }}
              className="px-4 py-2 bg-white border-2 border-yellow-300 rounded-lg hover:bg-yellow-100 text-sm font-medium transition-colors"
            >
              🛒 Indkøbsliste
            </button>
            <button
              onClick={() => {
                resetTour(TOUR_KEYS.SETTINGS);
                toast.success('Indstillinger-guiden er nulstillet!');
              }}
              className="px-4 py-2 bg-white border-2 border-yellow-300 rounded-lg hover:bg-yellow-100 text-sm font-medium transition-colors"
            >
              ⚙️ Indstillinger
            </button>
          </div>
        </div>
      )}

          <div className="p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
            <strong>💡 Tip:</strong> Dit land bruges til at vise relevante produktlinks når du klikker på "Indkøb" knapper.
          </div>
        </div>
      </div>

      {/* My Recipes */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Mine opskrifter</h2>
          <Link to="/add-recipe">
            <Button
              disabled={!canAddRecipe}
              data-testid="add-recipe-button"
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700"
            >
              <FaPlus className="mr-2" /> Tilføj opskrift
            </Button>
          </Link>
        </div>
        <p className="text-gray-600">
          {isAdmin() || isPro() || isEditor()
            ? `Du har oprettet ${userRecipesCount} opskrift${userRecipesCount !== 1 ? 'er' : ''}`
            : canAddRecipe
            ? `Du kan tilføje ${2 - userRecipesCount} mere opskrift${2 - userRecipesCount !== 1 ? 'er' : ''}`
            : 'Gratis limit nået (2/2). Opgradér til Pro for ubegrænset!'}
        </p>
      </div>

      {/* Machines */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100" data-tour="machine-section">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Mine Maskiner</h2>
          {user ? (
            <Dialog open={isAddMachineOpen} onOpenChange={setIsAddMachineOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-machine-button" data-tour="add-machine-button" variant="outline">
                  <FaPlus className="mr-2" /> Tilføj Maskine
                </Button>
              </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditMode ? 'Redigér Maskine' : 'Tilføj Maskine'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={addMachine} className="space-y-4">
                <div>
                  <Label>Maskine Navn</Label>
                  <Input
                    data-testid="machine-name-input"
                    value={newMachine.name}
                    onChange={(e) => setNewMachine({...newMachine, name: e.target.value})}
                    placeholder="fx SPM Pictor 12L"
                  />
                </div>
                {!isEditMode && (
                  <div>
                    <Label>Hurtig Valg</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {presetMachines.map((preset, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setNewMachine({
                            name: preset.name,
                            tank_volumes_ml: preset.volumes,
                            loss_margin_pct: 5
                          })}
                          className="px-3 py-2 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 text-sm"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <Label>Beholder Størrelse (ml)</Label>
                  <Input
                    type="number"
                    data-testid="tank-volume-input"
                    value={newMachine.tank_volumes_ml[0]}
                    onChange={(e) => setNewMachine({
                      ...newMachine,
                      tank_volumes_ml: [parseInt(e.target.value)]
                    })}
                  />
                </div>
                <div>
                  <Label>Tab Margin (%)</Label>
                  <Input
                    type="number"
                    value={newMachine.loss_margin_pct}
                    onChange={(e) => setNewMachine({
                      ...newMachine,
                      loss_margin_pct: parseFloat(e.target.value)
                    })}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleCancelMachine}
                  >
                    Annuller
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    data-testid="submit-machine"
                  >
                    {isEditMode ? 'Gem Ændringer' : 'Tilføj Maskine'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          ) : (
            <Button 
              onClick={() => toast.info('Log ind for at tilføje maskiner')}
              variant="outline"
              className="opacity-50 cursor-not-allowed"
              disabled
            >
              <FaPlus className="mr-2" /> Tilføj Maskine (Kun Pro)
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="loading-spinner"></div>
          </div>
        ) : machines.length === 0 ? (
          <p className="text-gray-600">Ingen maskiner tilføjet endnu. Tilføj din første maskine for auto-skalering.</p>
        ) : (
          <div className="space-y-3">
            {machines.map((machine) => (
              <div
                key={machine.id}
                data-testid={`machine-${machine.id}`}
                className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{machine.name}</h3>
                    <p className="text-sm text-gray-600">
                      Beholder: {machine.tank_volumes_ml.map(v => `${v/1000}L`).join(', ')}
                      {' • '}
                      Tab: {machine.loss_margin_pct}%
                    </p>
                    {machine.is_default && (
                      <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        ✓ Standard
                      </span>
                    )}
                  </div>
                  {!machine.is_system && user && (
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMachine(machine)}
                        data-testid={`edit-machine-${machine.id}`}
                        className="hover:bg-cyan-100"
                      >
                        <FaEdit className="text-cyan-600" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteMachine(machine.id)}
                        data-testid={`delete-machine-${machine.id}`}
                        className="hover:bg-red-100"
                      >
                        <FaTrash className="text-red-600" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* About */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-4">Om SLUSHBOOK</h2>
        <div className="space-y-4 text-gray-700">
          <p>
            SLUSHBOOK er din digitale opskriftsbog og værktøjskasse til alt, hvad der har med slushice at gøre. 
            Uanset om du er nybegynder eller erfaren entusiast, hjælper appen dig med at finde, tilpasse og gemme 
            opskrifter, så de passer præcist til din maskine og dine ingredienser.
          </p>
          
          <div className="pl-4">
            <p className="font-semibold mb-2">Du kan:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Matche dine egne ingredienser med eksisterende opskrifter</li>
              <li>Skalere mængder automatisk til din ønskede volumen (f.eks. 2 eller 6 liter)</li>
              <li>Tilføje og gemme dine egne favoritter</li>
              <li>Få inspiration fra andres opskrifter – og dele dine egne</li>
            </ul>
          </div>
          
          <p>
            Appen udvikles løbende, og vi arbejder hele tiden på at tilføje nye funktioner og forbedringer.
          </p>
          
          <div className="pt-2">
            <Link 
              to="/guide" 
              data-tour="guide-link"
              className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-700 font-semibold hover:underline"
            >
              <FaBook /> Læs den fulde vejledning til SLUSHBOOK her →
            </Link>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Version 1.0.0 – Skabt med ❤️ for slushice-entusiaster
          </p>
        </div>
      </div>

      {/* Administrator Section - Only for admin */}
      {user && user.role === 'admin' && (
        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl shadow-lg overflow-hidden">
          {/* Clickable Header */}
          <button
            onClick={() => setIsAdminSectionExpanded(!isAdminSectionExpanded)}
            className="w-full p-6 text-left hover:bg-black/10 transition-colors flex items-center justify-between"
          >
            <div>
              <h2 className="text-2xl font-bold mb-1">Administrator</h2>
              <p className="text-white/90">Admin værktøjer og indstillinger</p>
            </div>
            {isAdminSectionExpanded ? (
              <FaChevronUp className="text-white text-xl" />
            ) : (
              <FaChevronDown className="text-white text-xl" />
            )}
          </button>
        </div>
      )}
      
      {user && user.role === 'admin' && isAdminSectionExpanded && (
        <div className="space-y-3">
          <Link
            to="/admin/comments"
            className="block p-4 bg-white rounded-lg hover:shadow-md transition-all border border-blue-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <FaComments className="text-blue-500" />
                  💬 Kommentarer
                </h3>
                <p className="text-sm text-gray-600">Moderer og administrer kommentarer på opskrifter</p>
              </div>
              <span className="text-blue-600">→</span>
            </div>
          </Link>
          
          <Link
            to="/admin/sandbox"
            className="block p-4 bg-white rounded-lg hover:shadow-md transition-all border border-purple-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">🔍 Sandkasse - Godkend Opskrifter</h3>
                <p className="text-sm text-gray-600">Godkend eller afvis brugeropskrifter</p>
              </div>
              <span className="text-purple-600">→</span>
            </div>
          </Link>
          <Link
            to="/admin/ingredients"
            className="block p-4 bg-white rounded-lg hover:shadow-md transition-all border border-green-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">🥤 Ingredienser</h3>
                <p className="text-sm text-gray-600">Administrer master ingrediens-listen</p>
              </div>
              <span className="text-green-600">→</span>
            </div>
          </Link>
          <Link
            to="/admin"
            className="block p-4 bg-white rounded-lg hover:shadow-md transition-all border border-red-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">Admin panel</h3>
                <p className="text-sm text-gray-600">CSV import og vendor management</p>
              </div>
              <span className="text-red-600">→</span>
            </div>
          </Link>
          <Link
            to="/admin/links"
            className="block p-4 bg-white rounded-lg hover:shadow-md transition-all border border-red-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">Produkt-Links</h3>
                <p className="text-sm text-gray-600">Administrer links til leverandører</p>
              </div>
              <span className="text-red-600">→</span>
            </div>
          </Link>
          <Link
            to="/admin/badges"
            className="block p-4 bg-white rounded-lg hover:shadow-md transition-all border border-yellow-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <span>🏆</span> Badge Management
                </h3>
                <p className="text-sm text-gray-600">Administrer bruger achievement badges</p>
              </div>
              <span className="text-yellow-600">→</span>
            </div>
          </Link>
        </div>
      )}

      {/* Bruger Platformen Section - Only for admin */}
      {user && user.role === 'admin' && (
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl p-6 shadow-lg mt-6">
          <h2 className="text-2xl font-bold mb-1">Bruger Platformen</h2>
          <p className="text-white/90 mb-4">Se alle brugere og deres aktivitet</p>
        </div>
      )}
      
      {user && user.role === 'admin' && (
        <div className="space-y-3">
          <Link
            to="/members"
            className="block p-4 bg-white rounded-lg hover:shadow-md transition-all border border-blue-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">👥 Medlemmer</h3>
                <p className="text-sm text-gray-600">Se alle brugere og deres aktivitet</p>
              </div>
              <span className="text-blue-600">→</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;