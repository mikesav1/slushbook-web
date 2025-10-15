import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../App';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password
      }, {
        withCredentials: true
      });

      toast.success('Login successful!');
      onLogin(response.data.user);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Login failed');
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
            src="/logo-login.png" 
            alt="SLUSHBOOK" 
            className="w-80 mx-auto mb-2"
          />
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Log ind</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full px-4 py-3 border-2 rounded-xl"
                style={{ 
                  backgroundColor: '#D4E157',
                  borderColor: '#C0CA33'
                }}
              />
            </div>

            {/* Password */}
            <div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full px-4 py-3 border-2 rounded-xl"
                style={{ 
                  backgroundColor: '#D4E157',
                  borderColor: '#C0CA33'
                }}
              />
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-lg"
              style={{ backgroundColor: '#7CB342' }}
            >
              {loading ? 'Logging in...' : 'Sign in'}
            </Button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <Link
              to="/signup"
              className="block text-cyan-600 hover:text-cyan-700 font-medium"
            >
              Opret ny konto
            </Link>
            <Link
              to="/forgot-password"
              className="block text-cyan-600 hover:text-cyan-700 font-medium"
            >
              Glemt password?
            </Link>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">eller</span>
            </div>
          </div>

          {/* Google Login */}
          <Button
            type="button"
            onClick={() => toast.info('Google login coming soon')}
            className="w-full py-3 rounded-xl font-medium border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            <img 
              src="https://www.google.com/favicon.ico" 
              alt="Google" 
              className="w-5 h-5 inline mr-2"
            />
            Fortsæt med Google
          </Button>

          {/* Guest Mode */}
          <div className="mt-6 text-center">
            <Button
              type="button"
              onClick={() => navigate('/')}
              variant="link"
              className="text-gray-600 hover:text-gray-800"
            >
              Fortsæt som gæst (begrænset adgang)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
