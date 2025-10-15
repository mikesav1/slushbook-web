import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast, Toaster } from "sonner";
import { FaHome, FaBook, FaBoxOpen, FaShoppingCart, FaHeart, FaSearch, FaCog, FaMagic, FaPlus } from "react-icons/fa";
import "@/App.css";
import { getSessionId } from "./utils/session";
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Navigation Component
const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
      <div className="app-container">
        {/* Background decorations */}
        <div className="bg-decoration bg-decoration-1"></div>
        <div className="bg-decoration bg-decoration-2"></div>

        <div className="relative z-10">
          <Navigation />

          <main className="container mx-auto px-4 py-6 mb-20 md:mb-6">
            <Routes>
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
            </Routes>
          </main>
        </div>

        <Toaster position="top-center" richColors />
      </div>
    </BrowserRouter>
  );
}

export default App;
