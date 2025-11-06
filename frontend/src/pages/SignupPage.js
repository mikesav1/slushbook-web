import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { FaEye, FaEyeSlash, FaGlobe } from 'react-icons/fa';
import { API } from '../App';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { COUNTRIES } from '../utils/geolocation';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: 'DK' // Default to Denmark
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords stemmer ikke overens');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password skal være mindst 6 tegn');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API}/auth/signup`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        country: formData.country
      });

      toast.success('Konto oprettet! Log venligst ind.');
      navigate('/login');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.response?.data?.detail || 'Kunne ikke oprette konto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed top-0 left-0 w-screen h-screen object-cover"
        style={{zIndex: -1}}
      >
        <source src="/assets/slush-loop.mp4" type="video/mp4" />
      </video>

      <div className="w-full max-w-md px-6 py-8">
        {/* Logo - Reduced height by 50% */}
        <div className="text-center mb-6">
          <img 
            src="/assets/slushbook.png" 
            alt="SLUSHBOOK" 
            className="w-32 mx-auto mb-2"
          />
        </div>

        {/* Signup Form - Semi-transparent background */}
        <div className="rounded-3xl shadow-xl p-6 sm:p-8" style={{backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)'}}>
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Opret konto</h2>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Name */}
            <div>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Navn"
                required
                className="w-full px-4 py-3 border-2 rounded-xl"
                style={{ 
                  backgroundColor: '#D4E157',
                  borderColor: '#C0CA33'
                }}
              />
            </div>

            {/* Email */}
            <div>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
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
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={(e) => e.target.select()}
                placeholder="Password (min. 6 tegn)"
                required
                className="w-full px-4 py-3 pr-12 border-2 rounded-xl"
                style={{ 
                  backgroundColor: '#D4E157',
                  borderColor: '#C0CA33'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onFocus={(e) => e.target.select()}
                placeholder="Bekræft password"
                required
                className="w-full px-4 py-3 pr-12 border-2 rounded-xl"
                style={{ 
                  backgroundColor: '#D4E157',
                  borderColor: '#C0CA33'
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {showConfirmPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </button>
            </div>

            {/* Sign Up Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-lg"
              style={{ backgroundColor: '#7CB342' }}
            >
              {loading ? 'Opretter...' : 'Opret konto'}
            </Button>
          </form>

          {/* Link to Login */}
          <div className="mt-6 text-center">
            <span className="text-gray-600">Har du allerede en konto? </span>
            <Link
              to="/login"
              className="text-cyan-600 hover:text-cyan-700 font-medium"
            >
              Log ind
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
