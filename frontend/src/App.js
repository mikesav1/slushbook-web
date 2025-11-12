import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast, Toaster } from "sonner";
import { FaHome, FaBook, FaBoxOpen, FaShoppingCart, FaHeart, FaSearch, FaCog, FaMagic, FaPlus, FaSignOutAlt, FaSeedling, FaLink, FaAd } from "react-icons/fa";
import "@/App.css";
import { getSessionId } from "./utils/session";
import { AuthProvider, useAuth } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import RecipesPage from "./pages/RecipesPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import PantryPage from "./pages/PantryPage";
import MatchFinderPage from "./pages/MatchFinderPage";
import ShoppingListPage from "./pages/ShoppingListPage";
import FavoritesPage from "./pages/FavoritesPage";
import SettingsPage from "./pages/SettingsPage";
import AddRecipePage from "./pages/AddRecipePage";
import EditRecipePage from "./pages/EditRecipePage";
import AdminPage from "./pages/AdminPage";
import AdminSandboxPage from "./pages/AdminSandboxPage";
import AdminIngredientsPage from "./pages/AdminIngredientsPage";
import AdminCommentsPage from "./pages/AdminCommentsPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import MembersPage from "./pages/MembersPage";
import BrixInfoPage from "./pages/BrixInfoPage";
import AdminLinksPage from "./pages/AdminLinksPage";
import AdminAdsPage from "./pages/AdminAdsPage";
import AdSlot from "./components/AdSlot";
import GuidePage from "./pages/GuidePage";

// Backend URL configuration - uses environment variable
// Deployment system will automatically set REACT_APP_BACKEND_URL
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
export const API = `${BACKEND_URL}/api`;


console.log('[App] Hostname:', window.location.hostname);
console.log('[App] Backend URL:', BACKEND_URL);

// Navigation Component
const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isGuest } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (isUserMenuOpen && !e.target.closest('.relative')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isUserMenuOpen]);

  const navItems = [
    { path: "/", icon: FaHome, label: "Hjem" },
    { path: "/recipes", icon: FaBook, label: "Opskrifter" },
    { path: "/match", icon: FaMagic, label: "Match" },
    ...(user && user.role !== 'guest' ? [{ path: "/shopping", icon: FaShoppingCart, label: "Liste" }] : []),
    ...(user && user.role !== 'guest' ? [{ path: "/favorites", icon: FaHeart, label: "Favoritter" }] : []),
    { path: "/settings", icon: FaCog, label: "Indstillinger" },
  ];

  return (
    <nav className="border-b border-gray-200 sticky top-0 z-40 shadow-sm relative" style={{backgroundColor: '#115DA8'}}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* SLUSHBOOK Text - Visible on mobile, hidden on desktop */}
          <Link to="/" className="flex-shrink-0 lg:hidden">
            <span className="text-2xl font-bold text-white" style={{fontFamily: 'Fredoka'}}>
              SLUSHBOOK
            </span>
          </Link>
          
          {/* Desktop Navigation - Right side only */}
          <div className="hidden lg:flex items-center gap-4 ml-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className={`nav-link flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
            
            {/* User Info / Login */}
            {user ? (
              <div className="relative pl-6 border-l border-white/20">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                  data-tour="settings-menu"
                >
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-white">{user.name}</div>
                    <div className="text-xs text-white/70">{user.role}</div>
                  </div>
                  <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-800">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    
                    {/* Bruger Platformen Section */}
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 tracking-wider">
                      Bruger platformen
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Min profil
                    </Link>
                    
                    {/* Admin Section */}
                    {user.role === 'admin' && (
                      <>
                        <div className="px-4 py-2 mt-2 text-xs font-semibold text-gray-500 tracking-wider border-t border-gray-100">
                          Admin
                        </div>
                        <Link
                          to="/members"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          Medlemmer
                        </Link>
                        <Link
                          to="/admin/sandbox"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <FaSearch className="w-4 h-4" />
                          Sandkasse
                        </Link>
                        <Link
                          to="/admin/ingredients"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <FaSeedling className="w-4 h-4" />
                          Ingredienser
                        </Link>
                        <Link
                          to="/admin/links"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <FaLink className="w-4 h-4" />
                          Leverandør Links
                        </Link>
                        <Link
                          to="/admin/ads"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <FaAd className="w-4 h-4" />
                          Reklamer
                        </Link>
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <FaCog className="w-4 h-4" />
                          Admin panel
                        </Link>
                      </>
                    )}
                    
                    <Link
                      to="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100 mt-2"
                    >
                      <FaCog className="w-4 h-4" />
                      Indstillinger
                    </Link>
                    <button
                      onClick={async () => {
                        setIsUserMenuOpen(false);
                        await logout();
                        window.location.href = '/login';
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                    >
                      <FaSignOutAlt className="w-4 h-4" />
                      Log ud
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-white/90 font-medium"
              >
                Log ind
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="absolute right-4 top-4 lg:hidden">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all"
              data-testid="mobile-profile-button"
              data-tour="settings-menu"
            >
              <FaCog size={24} className="text-white" />
            </button>
            
            {/* Dropdown menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <Link
                  to="/profile"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Min profil
                </Link>
                
                <Link
                  to="/favorites"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FaHeart className="w-4 h-4" />
                  Favoritter
                </Link>
                
                <Link
                  to="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100"
                >
                  <FaCog className="w-4 h-4" />
                  Indstillinger
                </Link>
                
                <button
                  onClick={async () => {
                    setIsUserMenuOpen(false);
                    await logout();
                    navigate('/login');
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                >
                  <FaSignOutAlt className="w-4 h-4" />
                  Log ud
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3 py-2 bg-white text-blue-600 rounded-lg hover:bg-white/90 font-medium text-sm"
              data-testid="mobile-login-button"
            >
              Log ind
            </Link>
            <Link
              to="/signup"
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-sm"
              data-testid="mobile-signup-button"
            >
              Tilmeld
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

const App = () => {
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const id = getSessionId();
    setSessionId(id);
  }, []);

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent sessionId={sessionId} />
      </AuthProvider>
    </BrowserRouter>
  );
}

// Separate component to use AuthContext
const AppContent = ({ sessionId }) => {
  const { user, loading, login } = useAuth();
  const location = useLocation();
  
  // Use user.id as sessionId for logged-in users, otherwise use guest sessionId
  // More robust check: user must be object with id property
  const effectiveSessionId = (user && typeof user === 'object' && user.id) ? user.id : sessionId;
  
  // Debug logging
  React.useEffect(() => {
    console.log('[App] User object:', user);
    console.log('[App] User type:', typeof user);
    console.log('[App] User.id:', user?.id);
    console.log('[App] User:', user ? `${user.email} (id: ${user.id})` : 'Guest');
    console.log('[App] Guest sessionId:', sessionId);
    console.log('[App] Effective sessionId:', effectiveSessionId);
  }, [user, sessionId, effectiveSessionId]);

  const navItems = [
    { path: "/", icon: FaHome, label: "Hjem" },
    { path: "/recipes", icon: FaBook, label: "Opskrifter" },
    { path: "/match", icon: FaMagic, label: "Match" },
    ...(user && user.role !== 'guest' ? [{ path: "/shopping", icon: FaShoppingCart, label: "Liste" }] : []),
    ...(user && user.role !== 'guest' ? [{ path: "/favorites", icon: FaHeart, label: "Favoritter" }] : []),
    { path: "/settings", icon: FaCog, label: "Indstillinger" },
  ];

  // Don't show nav on auth pages
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(location.pathname);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Background decorations */}
      <div className="bg-decoration bg-decoration-1"></div>
      <div className="bg-decoration bg-decoration-2"></div>

      <div className="relative z-10">
        {!isAuthPage && <Navigation />}

        <main className={`container mx-auto px-4 py-6 ${!isAuthPage ? 'mb-20 lg:mb-6' : ''}`}>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage onLogin={login} />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* App Routes */}
            <Route path="/" element={<HomePage sessionId={effectiveSessionId} />} />
            <Route path="/recipes" element={<RecipesPage sessionId={effectiveSessionId} />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage sessionId={effectiveSessionId} />} />
            <Route path="/pantry" element={<PantryPage sessionId={effectiveSessionId} />} />
            <Route path="/match" element={<MatchFinderPage sessionId={effectiveSessionId} />} />
            <Route path="/shopping" element={<ShoppingListPage sessionId={effectiveSessionId} />} />
            <Route path="/favorites" element={<FavoritesPage sessionId={effectiveSessionId} />} />
            <Route path="/settings" element={<SettingsPage sessionId={effectiveSessionId} />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="/add-recipe" element={<AddRecipePage sessionId={effectiveSessionId} />} />
            <Route path="/edit-recipe/:id" element={<EditRecipePage sessionId={effectiveSessionId} />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/brix-info" element={<BrixInfoPage />} />
            <Route path="/admin" element={<AdminPage sessionId={effectiveSessionId} />} />
            <Route path="/admin/sandbox" element={<AdminSandboxPage sessionId={effectiveSessionId} />} />
            <Route path="/admin/comments" element={<AdminCommentsPage />} />
            <Route path="/admin/ingredients" element={<AdminIngredientsPage sessionId={effectiveSessionId} />} />
            <Route path="/admin/links" element={<AdminLinksPage sessionId={effectiveSessionId} />} />
            <Route path="/admin/ads" element={<AdminAdsPage />} />
          </Routes>
        </main>
      </div>

      {/* Global Ad Slot for guests - shows on all pages except auth pages */}
      {!isAuthPage && <AdSlot placement="bottom_banner" />}

      {/* Mobile Bottom Navigation */}
      {!isAuthPage && (
        <div className="lg:hidden border-t border-gray-200 bg-white fixed bottom-0 left-0 right-0 z-40 shadow-lg">
          <div className="grid grid-cols-5 gap-1 p-2">
            {/* Hjem */}
            <Link
              to="/"
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                location.pathname === '/' ? "bg-cyan-50 text-cyan-600" : "text-gray-600"
              }`}
            >
              <FaHome size={18} />
              <span className="text-xs font-medium">Hjem</span>
            </Link>
            
            {/* Opskrifter */}
            <Link
              to="/recipes"
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                location.pathname === '/recipes' ? "bg-cyan-50 text-cyan-600" : "text-gray-600"
              }`}
            >
              <FaBook size={18} />
              <span className="text-xs font-medium">Opskrifter</span>
            </Link>
            
            {/* Match */}
            <Link
              to="/match"
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                location.pathname === '/match' ? "bg-cyan-50 text-cyan-600" : "text-gray-600"
              }`}
            >
              <FaMagic size={18} />
              <span className="text-xs font-medium">Match</span>
            </Link>
            
            {/* Liste (Shopping) */}
            <Link
              to="/shopping"
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                location.pathname === '/shopping' ? "bg-cyan-50 text-cyan-600" : "text-gray-600"
              }`}
            >
              <FaShoppingCart size={18} />
              <span className="text-xs font-medium">Liste</span>
            </Link>
            
            {/* Settings/Profile */}
            <Link
              to="/profile"
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                location.pathname === '/profile' ? "bg-cyan-50 text-cyan-600" : "text-gray-600"
              }`}
            >
              <FaCog size={18} />
              <span className="text-xs font-medium">Profil</span>
            </Link>
          </div>
        </div>
      )}

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
