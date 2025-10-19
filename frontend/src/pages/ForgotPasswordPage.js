import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../App';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/forgot-password`, { email });
      
      // For testing: show reset token (REMOVE IN PRODUCTION)
      if (response.data.reset_token) {
        setResetToken(response.data.reset_token);
        toast.success('Reset token genereret! (Se nedenfor for testing)');
      } else {
        toast.success('Hvis emailen eksisterer, vil du modtage et reset link');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Noget gik galt. Prøv igen.');
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

        {/* Forgot Password Form - Semi-transparent background */}
        <div className="rounded-3xl shadow-xl p-6 sm:p-8" style={{backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)'}}>
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">Glemt password?</h2>
          <p className="text-center text-gray-600 mb-6">
            Indtast din email, så sender vi dig et reset link
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-lg"
              style={{ backgroundColor: '#7CB342' }}
            >
              {loading ? 'Sender...' : 'Send reset link'}
            </Button>
          </form>

          {/* Testing: Show reset token */}
          {resetToken && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-1">TEST MODE - Reset Token:</p>
              <code className="text-xs bg-white p-2 block rounded break-all">{resetToken}</code>
              <Button
                onClick={() => navigate(`/reset-password?token=${resetToken}`)}
                className="mt-2 w-full text-sm"
                variant="outline"
              >
                Gå til reset side
              </Button>
            </div>
          )}

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

export default ForgotPasswordPage;
