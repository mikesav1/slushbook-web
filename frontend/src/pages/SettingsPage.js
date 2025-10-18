import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FaCog, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

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

  useEffect(() => {
    fetchData();
  }, [sessionId]);

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
    { name: 'Custom 6L', volumes: [6000] }
  ];

  return (
    <div className="space-y-6 fade-in" data-testid="settings-page">
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

      {/* My Recipes */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Mine Opskrifter</h2>
          <Link to="/add-recipe">
            <Button
              disabled={!canAddRecipe}
              data-testid="add-recipe-button"
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700"
            >
              <FaPlus className="mr-2" /> Tilføj Opskrift
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
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Mine Maskiner</h2>
          {user ? (
            <Dialog open={isAddMachineOpen} onOpenChange={setIsAddMachineOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-machine-button" variant="outline">
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
                  {!machine.is_system && (
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
        <h2 className="text-2xl font-bold mb-2">Om SLUSHBOOK</h2>
        <p className="text-gray-600 mb-4">
          SLUSHBOOK hjælper dig med at finde og lave de perfekte slushice opskrifter. Match med dine ingredienser, skalér automatisk til din maskine, og gem dine favoritter.
        </p>
        <p className="text-sm text-gray-500">
          Version 1.0.0 • Made with ❤️ for slushice entusiaster
        </p>
      </div>

      {/* Admin Section */}
      {isAdmin() && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 shadow-sm border-2 border-red-200">
          <h2 className="text-2xl font-bold mb-4 text-red-700">⚙️ Administrator</h2>
          <div className="space-y-3">
            <Link
              to="/members"
              className="block p-4 bg-white rounded-lg hover:shadow-md transition-all border border-red-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800">Medlemmer</h3>
                  <p className="text-sm text-gray-600">Administrer brugere og adgang</p>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;