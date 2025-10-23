import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { API } from '../App';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setResetToken(token);
    } else {
      toast.error('Intet reset token fundet');
      navigate('/forgot-password');
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords stemmer ikke overens');
      return;
    }

    if (password.length < 6) {
      toast.error('Password skal være mindst 6 tegn');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API}/auth/reset-password`, {
        reset_token: resetToken,
        new_password: password
      });

      toast.success('Password nulstillet! Log venligst ind.');
      navigate('/login');
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.detail || 'Kunne ikke nulstille password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5E6D3' }}>
      <div className="w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logo-samlet.png" 
            alt="SLUSHBOOK" 
            className="w-64 mx-auto mb-2"
          />
        </div>

        {/* Reset Password Form */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">Nulstil password</h2>
          <p className="text-center text-gray-600 mb-6">
            Indtast dit nye password
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nyt password (min. 6 tegn)"
                required
                className="w-full px-4 py-3 border-2 rounded-xl"
                style={{ 
                  backgroundColor: '#D4E157',
                  borderColor: '#C0CA33'
                }}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Bekræft nyt password"
                required
                className="w-full px-4 py-3 border-2 rounded-xl"
                style={{ 
                  backgroundColor: '#D4E157',
                  borderColor: '#C0CA33'
                }}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-lg"
              style={{ backgroundColor: '#7CB342' }}
            >
              {loading ? 'Nulstiller...' : 'Nulstil password'}
            </Button>
          </form>

          {/* Link back to Login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-cyan-600 hover:text-cyan-700 font-medium"
            >
              ← Tilbage til login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
