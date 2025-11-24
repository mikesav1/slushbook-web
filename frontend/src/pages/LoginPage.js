import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { API } from '../App';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { updateUserPreferences } from '../utils/geolocation';
import { useTranslation } from 'react-i18next';

const LoginPage = ({ onLogin }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingGoogle, setProcessingGoogle] = useState(false);
  const navigate = useNavigate();

  // Generate device fingerprint
  const getDeviceFingerprint = () => {
    const data = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset()
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return 'device_' + Math.abs(hash).toString(36);
  };
  
  const getDeviceName = () => {
    const ua = navigator.userAgent;
    if (/iPhone/i.test(ua)) return 'iPhone';
    if (/iPad/i.test(ua)) return 'iPad';
    if (/Android/i.test(ua)) return 'Android Device';
    if (/Mac/i.test(ua)) return 'Mac';
    if (/Windows/i.test(ua)) return 'Windows PC';
    if (/Linux/i.test(ua)) return 'Linux PC';
    return 'Unknown Device';
  };

  // Google OAuth Handler
  const handleGoogleLogin = () => {
    // Redirect to Emergent Auth with our app as redirect target
    const redirectUrl = window.location.origin + '/'; // Redirect to homepage after auth
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    window.location.href = authUrl;
  };

  // Check for Google OAuth callback (session_id in URL fragment)
  React.useEffect(() => {
    const processGoogleCallback = async () => {
      // Check if we have session_id in URL fragment
      const hash = window.location.hash;
      if (!hash || !hash.includes('session_id=')) {
        return;
      }

      setProcessingGoogle(true);

      try {
        // Extract session_id from URL fragment
        const sessionId = hash.split('session_id=')[1]?.split('&')[0];
        
        if (!sessionId) {
          throw new Error('No session ID found');
        }

        console.log('Processing Google OAuth session...');

        // Exchange session_id for user data via our backend
        const response = await axios.post(
          `${API}/auth/google/session`,
          {},
          {
            headers: {
              'X-Session-ID': sessionId
            },
            withCredentials: true
          }
        );

        // Save session token
        if (response.data.token) {
          localStorage.setItem('session_token', response.data.token);
        }

        // Save user data
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        // Clean URL (remove fragment)
        window.history.replaceState(null, '', window.location.pathname);

        toast.success('Google login successful!');

        // Notify parent and navigate
        if (onLogin) {
          onLogin(response.data.user);
        }

        // Check if user came from shared recipe page
        const returnToShared = localStorage.getItem('return_to_shared');

        // Navigate to appropriate page
        if (returnToShared) {
          localStorage.removeItem('return_to_shared');
          navigate(`/shared/${returnToShared}`);
          toast.success('Du kan nu kopiere opskriften til din samling!');
        } else {
          navigate('/');
        }

      } catch (error) {
        console.error('Google auth error:', error);
        toast.error(error.response?.data?.detail || 'Google login failed');
        
        // Clean URL on error too
        window.history.replaceState(null, '', window.location.pathname);
      } finally {
        setProcessingGoogle(false);
      }
    };

    processGoogleCallback();
  }, [navigate, onLogin]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const deviceId = getDeviceFingerprint();
      const deviceName = getDeviceName();
      
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password,
        device_id: deviceId,
        device_name: deviceName
      }, {
        withCredentials: true,
        timeout: 15000 // 15 second timeout for mobile networks
      });

      // Show device limit warning if applicable
      if (response.data.device_limit) {
        const { current, max } = response.data.device_limit;
        if (current >= max) {
          toast.warning(t('auth.deviceLimitWarning', `Du er nu logget ind på maksimum ({{max}}) enheder. Ældre sessioner er blevet logget ud.`, { max }));
        }
      }
      
      toast.success(t('auth.loginSuccess', 'Login successful!'));
      
      // CRITICAL: Save session_token to localStorage (since httpOnly cookies don't work)
      if (response.data.session_token) {
        localStorage.setItem('session_token', response.data.session_token);
        console.log('[LoginPage] Saved session_token to localStorage');
      }
      
      // Save user's country and language preferences to localStorage
      // Use database values OR defaults if not set
      const userCountry = response.data.user.country || 'DK';
      const userLang = response.data.user.language || 'da';
      
      await updateUserPreferences(userCountry, userLang, false);
      
      // Update i18next immediately to ensure UI shows correct language
      if (window.i18n) {
        window.i18n.changeLanguage(userLang);
        console.log(`[LoginPage] Changed i18n language to: ${userLang}`);
      }
      
      console.log(`[LoginPage] Set user preferences - Country: ${userCountry}, Language: ${userLang}`);
      
      // Save user data
      onLogin(response.data.user);
      
      // Check if user came from shared recipe page
      const returnToShared = localStorage.getItem('return_to_shared');
      
      // Navigate to appropriate page (without reload to preserve localStorage)
      if (returnToShared) {
        localStorage.removeItem('return_to_shared');
        navigate(`/shared/${returnToShared}`);
        toast.success('Du kan nu kopiere opskriften til din samling!');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || t('auth.loginFailed', 'Login failed'));
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
        {/* Logo - 70% larger with minimal top margin */}
        <div className="text-center" style={{marginBottom: '20px'}}>
          <img 
            src="/assets/slushbook.png" 
            alt="SLUSHBOOK" 
            className="w-72 mx-auto"
          />
        </div>

        {/* Login Form - Semi-transparent background */}
        <div className="rounded-3xl shadow-xl p-6 sm:p-8" style={{backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)'}}>
          {processingGoogle ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
              <p className="text-gray-700 font-medium">Processing Google login...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait...</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">{t('auth.signIn')}</h2>

              <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.email')}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder={t('auth.password')}
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

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-lg"
              style={{ backgroundColor: '#7CB342' }}
            >
              {loading ? t('auth.loggingIn', 'Logging in...') : t('auth.signIn')}
            </Button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <Link
              to="/signup"
              className="block text-cyan-600 hover:text-cyan-700 font-medium"
            >
              {t('auth.createNewAccount', 'Opret ny konto')}
            </Link>
            <Link
              to="/forgot-password"
              className="block text-cyan-600 hover:text-cyan-700 font-medium"
            >
              {t('auth.forgotPassword')}
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
            onClick={handleGoogleLogin}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
