import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { FaUser, FaEnvelope, FaLock, FaSave } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const ProfilePage = () => {
  const { t } = useTranslation();
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        email: formData.email
      };

      // Only include password if user wants to change it
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          toast.error('Nye passwords stemmer ikke overens');
          setLoading(false);
          return;
        }
        if (formData.newPassword.length < 6) {
          toast.error('Nyt password skal være mindst 6 tegn');
          setLoading(false);
          return;
        }
        if (!formData.currentPassword) {
          toast.error('Indtast dit nuværende password for at ændre det');
          setLoading(false);
          return;
        }
        updateData.current_password = formData.currentPassword;
        updateData.new_password = formData.newPassword;
      }

      await axios.put(`${API}/auth/profile`, updateData, {
        withCredentials: true
      });

      toast.success('Profil opdateret!');
      
      // Refresh user data
      await checkAuth();
      
      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.detail || 'Kunne ikke opdatere profil');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto">
              <FaUser />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Velkommen til SLUSHBOOK</h1>
              <p className="text-gray-600">Log ind for at få adgang til din profil og ekstra funktioner</p>
            </div>
            
            <div className="flex flex-col gap-3 max-w-md mx-auto">
              <Button 
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 w-full"
              >
                Log ind
              </Button>
              <Button 
                onClick={() => navigate('/signup')}
                variant="outline"
                className="w-full"
              >
                Opret konto
              </Button>
              <Button 
                onClick={() => navigate('/guide')}
                variant="outline"
                className="border-cyan-500 text-cyan-600 hover:bg-cyan-50 w-full"
              >
                📖 Se vejledning
              </Button>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h3 className="font-semibold mb-3">Som gæst kan du:</h3>
              <ul className="text-left space-y-2 text-gray-600 max-w-md mx-auto">
                <li>✓ Browse alle opskrifter</li>
                <li>✓ Se opskrift detaljer</li>
                <li>✓ Læse vejledninger</li>
              </ul>
            </div>

            <div className="pt-4">
              <h3 className="font-semibold mb-3">Med Pro konto får du:</h3>
              <ul className="text-left space-y-2 text-gray-600 max-w-md mx-auto">
                <li>🌟 Opret dine egne opskrifter</li>
                <li>🌟 Gem favoritter</li>
                <li>🌟 Indkøbsliste</li>
                <li>🌟 Match finder</li>
                <li>🌟 Pantry system</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold">Min profil</h1>
            <p className="text-gray-600">{user.role} bruger</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FaUser className="text-cyan-500" />
              Basis information
            </h2>

            <div>
              <Label htmlFor="name">Navn</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </div>
          </div>

          {/* Change Password */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FaLock className="text-cyan-500" />
              Skift password
            </h2>
            <p className="text-sm text-gray-600">
              Lad felterne tomme hvis du ikke vil ændre dit password
            </p>

            <div>
              <Label htmlFor="currentPassword">Nuværende password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={handleChange}
                className="mt-1"
                placeholder="Kun hvis du vil ændre password"
              />
            </div>

            <div>
              <Label htmlFor="newPassword">Nyt password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                className="mt-1"
                placeholder="Min. 6 tegn"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Bekræft nyt password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-6">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700"
            >
              <FaSave className="mr-2" />
              {loading ? 'Gemmer...' : 'Gem ændringer'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Annuller
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
