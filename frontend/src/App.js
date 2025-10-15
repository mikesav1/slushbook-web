import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast, Toaster } from "sonner";
import { FaHome, FaBook, FaBoxOpen, FaShoppingCart, FaHeart, FaSearch, FaCog, FaMagic, FaPlus, FaSignOutAlt } from "react-icons/fa";
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
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import MembersPage from "./pages/MembersPage";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

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
    { path: "/pantry", icon: FaBoxOpen, label: "Ingredienser" },
    { path: "/match", icon: FaMagic, label: "Match" },
    { path: "/shopping", icon: FaShoppingCart, label: "Liste" },
    { path: "/favorites", icon: FaHeart, label: "Favoritter" },
    { path: "/settings", icon: FaCog, label: "Indstillinger" },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <img 
              src="/kop.png" 
              alt="SLUSHBOOK" 
              className="h-10"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className={`nav-link flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? "bg-cyan-50 text-cyan-600" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
            
            {/* User Info / Login */}
            {user ? (
              <div className="relative pl-6 border-l border-gray-200">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-800">{user.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-800">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
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
                    {user.role === 'admin' && (
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
                    )}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
                className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 font-medium"
              >
                Log ind
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => navigate("/settings")}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              data-testid="mobile-menu-button"
            >
              <FaCog size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200 bg-white fixed bottom-0 left-0 right-0 z-50 shadow-lg">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                  isActive ? "bg-cyan-50 text-cyan-600" : "text-gray-600"
                }`}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

// Main App Component
function App() {
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

        <main className={`container mx-auto px-4 py-6 ${!isAuthPage ? 'mb-20 md:mb-6' : ''}`}>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage onLogin={login} />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* App Routes */}
            <Route path="/" element={<HomePage sessionId={sessionId} />} />
            <Route path="/recipes" element={<RecipesPage sessionId={sessionId} />} />
            <Route path="/recipe/:id" element={<RecipeDetailPage sessionId={sessionId} />} />
            <Route path="/pantry" element={<PantryPage sessionId={sessionId} />} />
            <Route path="/match" element={<MatchFinderPage sessionId={sessionId} />} />
            <Route path="/shopping" element={<ShoppingListPage sessionId={sessionId} />} />
            <Route path="/favorites" element={<FavoritesPage sessionId={sessionId} />} />
            <Route path="/settings" element={<SettingsPage sessionId={sessionId} />} />
            <Route path="/add-recipe" element={<AddRecipePage sessionId={sessionId} />} />
            <Route path="/edit-recipe/:id" element={<EditRecipePage sessionId={sessionId} />} />
            <Route path="/members" element={<MembersPage />} />
          </Routes>
        </main>
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
