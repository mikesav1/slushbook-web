process.env.REACT_APP_BACKEND_URL import React, { useState, useEffect } from "react";
process.env.REACT_APP_BACKEND_URL import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
process.env.REACT_APP_BACKEND_URL import axios from "axios";
process.env.REACT_APP_BACKEND_URL import './i18n/config'; // Initialize i18n
process.env.REACT_APP_BACKEND_URL import { useTranslation } from 'react-i18next';
process.env.REACT_APP_BACKEND_URL import { toast, Toaster } from "sonner";
process.env.REACT_APP_BACKEND_URL import { FaHome, FaBook, FaBoxOpen, FaShoppingCart, FaHeart, FaSearch, FaCog, FaMagic, FaPlus, FaSignOutAlt, FaSeedling, FaLink, FaAd, FaLightbulb, FaImage, FaCheckCircle, FaTrash, FaGlobe, FaRobot } from "react-icons/fa";
process.env.REACT_APP_BACKEND_URL import "@/App.css";
process.env.REACT_APP_BACKEND_URL import { getSessionId } from "./utils/session";
process.env.REACT_APP_BACKEND_URL import { AuthProvider, useAuth } from "./context/AuthContext";
process.env.REACT_APP_BACKEND_URL import HomePage from "./pages/HomePage";
process.env.REACT_APP_BACKEND_URL import RecipesPage from "./pages/RecipesPage";
process.env.REACT_APP_BACKEND_URL import RecipeDetailPage from "./pages/RecipeDetailPage";
process.env.REACT_APP_BACKEND_URL import PantryPage from "./pages/PantryPage";
process.env.REACT_APP_BACKEND_URL import MatchFinderPage from "./pages/MatchFinderPage";
process.env.REACT_APP_BACKEND_URL import ShoppingListPage from "./pages/ShoppingListPage";
process.env.REACT_APP_BACKEND_URL import FavoritesPage from "./pages/FavoritesPage";
process.env.REACT_APP_BACKEND_URL import SettingsPage from "./pages/SettingsPage";
process.env.REACT_APP_BACKEND_URL import AddRecipePage from "./pages/AddRecipePage";
process.env.REACT_APP_BACKEND_URL import EditRecipePage from "./pages/EditRecipePage";
process.env.REACT_APP_BACKEND_URL import AdminPage from "./pages/AdminPage";
process.env.REACT_APP_BACKEND_URL import AdminSandboxPage from "./pages/AdminSandboxPage";
process.env.REACT_APP_BACKEND_URL import AdminIngredientsPage from "./pages/AdminIngredientsPage";
process.env.REACT_APP_BACKEND_URL import AdminMatchImagesPage from "./pages/AdminMatchImagesPage";
process.env.REACT_APP_BACKEND_URL import AdminFixApprovals from "./pages/AdminFixApprovals";
process.env.REACT_APP_BACKEND_URL import AdminDeleteRecipes from "./pages/AdminDeleteRecipes";
process.env.REACT_APP_BACKEND_URL import AdminSeedIngredients from "./pages/AdminSeedIngredients";
process.env.REACT_APP_BACKEND_URL import AdminBadgesPage from "./pages/AdminBadgesPage";
process.env.REACT_APP_BACKEND_URL import SetupPage from "./pages/SetupPage";
process.env.REACT_APP_BACKEND_URL import AdminCommentsPage from "./pages/AdminCommentsPage";
process.env.REACT_APP_BACKEND_URL import TipsPage from "./pages/TipsPage";
process.env.REACT_APP_BACKEND_URL import CreateTipPage from "./pages/CreateTipPage";
process.env.REACT_APP_BACKEND_URL import LoginPage from "./pages/LoginPage";
process.env.REACT_APP_BACKEND_URL import SignupPage from "./pages/SignupPage";
process.env.REACT_APP_BACKEND_URL import ForgotPasswordPage from "./pages/ForgotPasswordPage";
process.env.REACT_APP_BACKEND_URL import NotificationBell from "./components/NotificationBell";
process.env.REACT_APP_BACKEND_URL import ResetPasswordPage from "./pages/ResetPasswordPage";
process.env.REACT_APP_BACKEND_URL import ProfilePage from "./pages/ProfilePage";
process.env.REACT_APP_BACKEND_URL import MembersPage from "./pages/MembersPage";
process.env.REACT_APP_BACKEND_URL import BrixInfoPage from "./pages/BrixInfoPage";
process.env.REACT_APP_BACKEND_URL import SlushBookAI from './pages/SlushBookAI';
process.env.REACT_APP_BACKEND_URL import AdminLinksPage from "./pages/AdminLinksPage";
process.env.REACT_APP_BACKEND_URL import AdminAdsPage from "./pages/AdminAdsPage";
process.env.REACT_APP_BACKEND_URL import AdminTranslationsPage from "./pages/AdminTranslationsPage";
process.env.REACT_APP_BACKEND_URL import AdminRecipeTranslationsPage from "./pages/AdminRecipeTranslationsPage";
process.env.REACT_APP_BACKEND_URL import AdminImportRecipes from "./pages/AdminImportRecipes";
process.env.REACT_APP_BACKEND_URL import SharedRecipePage from "./pages/SharedRecipePage";
process.env.REACT_APP_BACKEND_URL import ManageSharesPage from "./pages/ManageSharesPage";
process.env.REACT_APP_BACKEND_URL import AdSlot from "./components/AdSlot";
process.env.REACT_APP_BACKEND_URL import GuidePage from "./pages/GuidePage";
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL // Backend URL configuration - uses environment variable
process.env.REACT_APP_BACKEND_URL // Deployment system will automatically set REACT_APP_BACKEND_URL
process.env.REACT_APP_BACKEND_URL const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
process.env.REACT_APP_BACKEND_URL export const API = `${BACKEND_URL}/api`;
process.env.REACT_APP_BACKEND_URL export const BACKEND = BACKEND_URL;
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL // Configure axios to send cookies with all requests (required for SameSite=none)
process.env.REACT_APP_BACKEND_URL axios.defaults.withCredentials = true;
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL console.log('[App] Hostname:', window.location.hostname);
process.env.REACT_APP_BACKEND_URL console.log('[App] Backend URL:', BACKEND_URL);
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL // Navigation Component
process.env.REACT_APP_BACKEND_URL const Navigation = () => {
process.env.REACT_APP_BACKEND_URL   const location = useLocation();
process.env.REACT_APP_BACKEND_URL   const navigate = useNavigate();
process.env.REACT_APP_BACKEND_URL   const { user, logout, isGuest } = useAuth();
process.env.REACT_APP_BACKEND_URL   const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
process.env.REACT_APP_BACKEND_URL   const { t } = useTranslation();
process.env.REACT_APP_BACKEND_URL   const desktopMenuRef = React.useRef(null);
process.env.REACT_APP_BACKEND_URL   const mobileMenuRef = React.useRef(null);
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL   // Close dropdown when clicking outside (check both refs)
process.env.REACT_APP_BACKEND_URL   React.useEffect(() => {
process.env.REACT_APP_BACKEND_URL     const handleClickOutside = (e) => {
process.env.REACT_APP_BACKEND_URL       if (isUserMenuOpen) {
process.env.REACT_APP_BACKEND_URL         const clickedInsideDesktop = desktopMenuRef.current && desktopMenuRef.current.contains(e.target);
process.env.REACT_APP_BACKEND_URL         const clickedInsideMobile = mobileMenuRef.current && mobileMenuRef.current.contains(e.target);
process.env.REACT_APP_BACKEND_URL         
process.env.REACT_APP_BACKEND_URL         if (!clickedInsideDesktop && !clickedInsideMobile) {
process.env.REACT_APP_BACKEND_URL           setIsUserMenuOpen(false);
process.env.REACT_APP_BACKEND_URL         }
process.env.REACT_APP_BACKEND_URL       }
process.env.REACT_APP_BACKEND_URL     };
process.env.REACT_APP_BACKEND_URL     // Changed from 'mousedown' to 'click' to allow Link navigation to happen first
process.env.REACT_APP_BACKEND_URL     document.addEventListener('click', handleClickOutside);
process.env.REACT_APP_BACKEND_URL     return () => document.removeEventListener('click', handleClickOutside);
process.env.REACT_APP_BACKEND_URL   }, [isUserMenuOpen]);
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL   const navItems = [
process.env.REACT_APP_BACKEND_URL     { path: "/", icon: FaHome, label: t('nav.home') },
process.env.REACT_APP_BACKEND_URL     { path: "/recipes", icon: FaBook, label: t('nav.recipes') },
process.env.REACT_APP_BACKEND_URL     { path: "/match", icon: FaMagic, label: t('nav.match') },
process.env.REACT_APP_BACKEND_URL     ...(user && user.role !== 'guest' ? [{ path: "/shopping", icon: FaShoppingCart, label: t('nav.shoppingList') }] : []),
process.env.REACT_APP_BACKEND_URL     ...(user && user.role !== 'guest' ? [{ path: "/favorites", icon: FaHeart, label: t('nav.favorites') }] : []),
process.env.REACT_APP_BACKEND_URL     { path: "/ai", icon: FaRobot, label: "SlushBook AI", badge: "BETA" },
process.env.REACT_APP_BACKEND_URL     { path: "/settings", icon: FaCog, label: t('nav.settings') },
process.env.REACT_APP_BACKEND_URL   ];
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL   return (
process.env.REACT_APP_BACKEND_URL     <nav className="border-b border-gray-200 sticky top-0 z-40 shadow-sm relative" style={{backgroundColor: '#115DA8'}}>
process.env.REACT_APP_BACKEND_URL       <div className="container mx-auto px-4">
process.env.REACT_APP_BACKEND_URL         <div className="flex items-center justify-between h-16">
process.env.REACT_APP_BACKEND_URL           {/* SLUSHBOOK Text - Visible on mobile, hidden on desktop */}
process.env.REACT_APP_BACKEND_URL           <Link to="/" className="flex-shrink-0 lg:hidden">
process.env.REACT_APP_BACKEND_URL             <span className="text-2xl font-bold text-white" style={{fontFamily: 'Fredoka'}}>
process.env.REACT_APP_BACKEND_URL               SLUSHBOOK
process.env.REACT_APP_BACKEND_URL             </span>
process.env.REACT_APP_BACKEND_URL           </Link>
process.env.REACT_APP_BACKEND_URL           
process.env.REACT_APP_BACKEND_URL           {/* Desktop Navigation - Right side only */}
process.env.REACT_APP_BACKEND_URL           <div className="hidden lg:flex items-center gap-4 ml-auto">
process.env.REACT_APP_BACKEND_URL             {navItems.map((item) => {
process.env.REACT_APP_BACKEND_URL               const Icon = item.icon;
process.env.REACT_APP_BACKEND_URL               const isActive = location.pathname === item.path;
process.env.REACT_APP_BACKEND_URL               return (
process.env.REACT_APP_BACKEND_URL                 <Link
process.env.REACT_APP_BACKEND_URL                   key={item.path}
process.env.REACT_APP_BACKEND_URL                   to={item.path}
process.env.REACT_APP_BACKEND_URL                   data-testid={`nav-${item.label.toLowerCase()}`}
process.env.REACT_APP_BACKEND_URL                   className={`nav-link flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
process.env.REACT_APP_BACKEND_URL                     isActive ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
process.env.REACT_APP_BACKEND_URL                   }`}
process.env.REACT_APP_BACKEND_URL                 >
process.env.REACT_APP_BACKEND_URL                   <Icon />
process.env.REACT_APP_BACKEND_URL                   <span className="text-sm font-medium">{item.label}</span>
process.env.REACT_APP_BACKEND_URL                   {item.badge && (
process.env.REACT_APP_BACKEND_URL                     <span className="px-2 py-0.5 bg-yellow-400 text-gray-900 text-[10px] font-bold rounded-full">
process.env.REACT_APP_BACKEND_URL                       {item.badge}
process.env.REACT_APP_BACKEND_URL                     </span>
process.env.REACT_APP_BACKEND_URL                   )}
process.env.REACT_APP_BACKEND_URL                 </Link>
process.env.REACT_APP_BACKEND_URL               );
process.env.REACT_APP_BACKEND_URL             })}
process.env.REACT_APP_BACKEND_URL             
process.env.REACT_APP_BACKEND_URL             {/* Notifications & User Info / Login */}
process.env.REACT_APP_BACKEND_URL             {user ? (
process.env.REACT_APP_BACKEND_URL               <div ref={desktopMenuRef} className="relative pl-6 border-l border-white/20 flex items-center gap-4">
process.env.REACT_APP_BACKEND_URL                 {/* Notification Bell */}
process.env.REACT_APP_BACKEND_URL                 <NotificationBell />
process.env.REACT_APP_BACKEND_URL                 
process.env.REACT_APP_BACKEND_URL                 <button
process.env.REACT_APP_BACKEND_URL                   onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
process.env.REACT_APP_BACKEND_URL                   className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
process.env.REACT_APP_BACKEND_URL                   data-tour="settings-menu"
process.env.REACT_APP_BACKEND_URL                 >
process.env.REACT_APP_BACKEND_URL                   <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 font-semibold">
process.env.REACT_APP_BACKEND_URL                     {user.name.charAt(0).toUpperCase()}
process.env.REACT_APP_BACKEND_URL                   </div>
process.env.REACT_APP_BACKEND_URL                   <div className="text-left">
process.env.REACT_APP_BACKEND_URL                     <div className="text-sm font-medium text-white">{user.name}</div>
process.env.REACT_APP_BACKEND_URL                     <div className="text-xs text-white/70">{user.role}</div>
process.env.REACT_APP_BACKEND_URL                   </div>
process.env.REACT_APP_BACKEND_URL                   <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
process.env.REACT_APP_BACKEND_URL                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
process.env.REACT_APP_BACKEND_URL                   </svg>
process.env.REACT_APP_BACKEND_URL                 </button>
process.env.REACT_APP_BACKEND_URL                 
process.env.REACT_APP_BACKEND_URL                 {/* Dropdown Menu */}
process.env.REACT_APP_BACKEND_URL                 {isUserMenuOpen && (
process.env.REACT_APP_BACKEND_URL                   <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
process.env.REACT_APP_BACKEND_URL                     <div className="px-4 py-3 border-b border-gray-100">
process.env.REACT_APP_BACKEND_URL                       <div className="text-sm font-medium text-gray-800">{user.name}</div>
process.env.REACT_APP_BACKEND_URL                       <div className="text-xs text-gray-500">{user.email}</div>
process.env.REACT_APP_BACKEND_URL                     </div>
process.env.REACT_APP_BACKEND_URL                     
process.env.REACT_APP_BACKEND_URL                     {/* Bruger Platformen Section */}
process.env.REACT_APP_BACKEND_URL                     <div className="px-4 py-2 text-xs font-semibold text-gray-500 tracking-wider">
process.env.REACT_APP_BACKEND_URL                       Bruger platformen
process.env.REACT_APP_BACKEND_URL                     </div>
process.env.REACT_APP_BACKEND_URL                     <Link
process.env.REACT_APP_BACKEND_URL                       to="/profile"
process.env.REACT_APP_BACKEND_URL                       onClick={() => setIsUserMenuOpen(false)}
process.env.REACT_APP_BACKEND_URL                       className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
process.env.REACT_APP_BACKEND_URL                     >
process.env.REACT_APP_BACKEND_URL                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
process.env.REACT_APP_BACKEND_URL                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
process.env.REACT_APP_BACKEND_URL                       </svg>
process.env.REACT_APP_BACKEND_URL                       Min profil
process.env.REACT_APP_BACKEND_URL                     </Link>
process.env.REACT_APP_BACKEND_URL                     
process.env.REACT_APP_BACKEND_URL                     <Link
process.env.REACT_APP_BACKEND_URL                       to="/tips"
process.env.REACT_APP_BACKEND_URL                       onClick={() => setIsUserMenuOpen(false)}
process.env.REACT_APP_BACKEND_URL                       className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
process.env.REACT_APP_BACKEND_URL                     >
process.env.REACT_APP_BACKEND_URL                       <FaLightbulb className="w-4 h-4 text-yellow-500" />
process.env.REACT_APP_BACKEND_URL                       Tips & Tricks
process.env.REACT_APP_BACKEND_URL                     </Link>
process.env.REACT_APP_BACKEND_URL                     
process.env.REACT_APP_BACKEND_URL                     {/* Admin Section */}
process.env.REACT_APP_BACKEND_URL                     {user.role === 'admin' && (
process.env.REACT_APP_BACKEND_URL                       <>
process.env.REACT_APP_BACKEND_URL                         <div className="px-4 py-2 mt-2 text-xs font-semibold text-gray-500 tracking-wider border-t border-gray-100">
process.env.REACT_APP_BACKEND_URL                           Admin
process.env.REACT_APP_BACKEND_URL                         </div>
process.env.REACT_APP_BACKEND_URL                         <Link
process.env.REACT_APP_BACKEND_URL                           to="/members"
process.env.REACT_APP_BACKEND_URL                           onClick={() => setIsUserMenuOpen(false)}
process.env.REACT_APP_BACKEND_URL                           className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
process.env.REACT_APP_BACKEND_URL                         >
process.env.REACT_APP_BACKEND_URL                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
process.env.REACT_APP_BACKEND_URL                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
process.env.REACT_APP_BACKEND_URL                           </svg>
process.env.REACT_APP_BACKEND_URL                           Medlemmer
process.env.REACT_APP_BACKEND_URL                         </Link>
process.env.REACT_APP_BACKEND_URL                         <Link
process.env.REACT_APP_BACKEND_URL                           to="/admin/sandbox"
process.env.REACT_APP_BACKEND_URL                           onClick={() => setIsUserMenuOpen(false)}
process.env.REACT_APP_BACKEND_URL                           className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
process.env.REACT_APP_BACKEND_URL                         >
process.env.REACT_APP_BACKEND_URL                           <FaSearch className="w-4 h-4" />
process.env.REACT_APP_BACKEND_URL                           Sandkasse
process.env.REACT_APP_BACKEND_URL                         </Link>
process.env.REACT_APP_BACKEND_URL                         <Link
process.env.REACT_APP_BACKEND_URL                           to="/admin/ingredients"
process.env.REACT_APP_BACKEND_URL                           onClick={() => setIsUserMenuOpen(false)}
process.env.REACT_APP_BACKEND_URL                           className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
process.env.REACT_APP_BACKEND_URL                         >
process.env.REACT_APP_BACKEND_URL                           <FaSeedling className="w-4 h-4" />
process.env.REACT_APP_BACKEND_URL                           Ingredienser
process.env.REACT_APP_BACKEND_URL                         </Link>
process.env.REACT_APP_BACKEND_URL                         <Link
process.env.REACT_APP_BACKEND_URL                           to="/admin/match-images"
process.env.REACT_APP_BACKEND_URL                           onClick={() => setIsUserMenuOpen(false)}
process.env.REACT_APP_BACKEND_URL                           className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
process.env.REACT_APP_BACKEND_URL                         >
process.env.REACT_APP_BACKEND_URL                           <FaImage className="w-4 h-4" />
process.env.REACT_APP_BACKEND_URL                           Match Billeder
process.env.REACT_APP_BACKEND_URL                         </Link>
process.env.REACT_APP_BACKEND_URL                         <Link
process.env.REACT_APP_BACKEND_URL                           to="/admin/seed-ingredients"
process.env.REACT_APP_BACKEND_URL                           onClick={() => setIsUserMenuOpen(false)}
process.env.REACT_APP_BACKEND_URL                           className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
process.env.REACT_APP_BACKEND_URL                         >
process.env.REACT_APP_BACKEND_URL                           <FaSeedling className="w-4 h-4" />
process.env.REACT_APP_BACKEND_URL                           Seed Ingredienser
process.env.REACT_APP_BACKEND_URL                         </Link>
process.env.REACT_APP_BACKEND_URL                         <Link
process.env.REACT_APP_BACKEND_URL                           to="/admin/fix-approvals"
process.env.REACT_APP_BACKEND_URL                           onClick={() => setIsUserMenuOpen(false)}
process.env.REACT_APP_BACKEND_URL                           className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
process.env.REACT_APP_BACKEND_URL                         >
process.env.REACT_APP_BACKEND_URL                           <FaCheckCircle className="w-4 h-4" />
process.env.REACT_APP_BACKEND_URL                           Godkend Alle
process.env.REACT_APP_BACKEND_URL                         </Link>
process.env.REACT_APP_BACKEND_URL                         <Link
process.env.REACT_APP_BACKEND_URL                           to="/admin/delete-recipes"
process.env.REACT_APP_BACKEND_URL                           onClick={() => setIsUserMenuOpen(false)}
process.env.REACT_APP_BACKEND_URL                           className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
process.env.REACT_APP_BACKEND_URL                         >
process.env.REACT_APP_BACKEND_URL                           <FaTrash className="w-4 h-4" />
process.env.REACT_APP_BACKEND_URL                           Slet Alle Opskrifter
process.env.REACT_APP_BACKEND_URL                         </Link>
process.env.REACT_APP_BACKEND_URL                         <Link
process.env.REACT_APP_BACKEND_URL                           to="/admin/links"
process.env.REACT_APP_BACKEND_URL                           onClick={() => setIsUserMenuOpen(false)}
process.env.REACT_APP_BACKEND_URL                           className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
process.env.REACT_APP_BACKEND_URL                         >
process.env.REACT_APP_BACKEND_URL                           <FaLink className="w-4 h-4" />
process.env.REACT_APP_BACKEND_URL                           Leverandør Links
process.env.REACT_APP_BACKEND_URL                         </Link>
process.env.REACT_APP_BACKEND_URL                         <Link
process.env.REACT_APP_BACKEND_URL                           to="/admin/ads"
process.env.REACT_APP_BACKEND_URL                           onClick={() => setIsUserMenuOpen(false)}
process.env.REACT_APP_BACKEND_URL                           className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
process.env.REACT_APP_BACKEND_URL                         >
process.env.REACT_APP_BACKEND_URL                           <FaAd className="w-4 h-4" />
process.env.REACT_APP_BACKEND_URL                           Reklamer
process.env.REACT_APP_BACKEND_URL                         </Link>
process.env.REACT_APP_BACKEND_URL                         <Link
process.env.REACT_APP_BACKEND_URL                           to="/admin/recipe-translations"
process.env.REACT_APP_BACKEND_URL                           onClick={() => setIsUserMenuOpen(false)}
process.env.REACT_APP_BACKEND_URL                           className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
process.env.REACT_APP_BACKEND_URL                         >
process.env.REACT_APP_BACKEND_URL                           <FaBook className="w-4 h-4" />
process.env.REACT_APP_BACKEND_URL                           Opskrift Oversættelser
process.env.REACT_APP_BACKEND_URL                         </Link>
process.env.REACT_APP_BACKEND_URL                         <Link
process.env.REACT_APP_BACKEND_URL                           to="/admin"
process.env.REACT_APP_BACKEND_URL                           onClick={() => setIsUserMenuOpen(false)}
process.env.REACT_APP_BACKEND_URL                           className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
process.env.REACT_APP_BACKEND_URL                         >
process.env.REACT_APP_BACKEND_URL                           <FaCog className="w-4 h-4" />
process.env.REACT_APP_BACKEND_URL                           Admin panel
process.env.REACT_APP_BACKEND_URL                         </Link>
process.env.REACT_APP_BACKEND_URL                       </>
process.env.REACT_APP_BACKEND_URL                     )}
process.env.REACT_APP_BACKEND_URL                     
process.env.REACT_APP_BACKEND_URL                     <Link
process.env.REACT_APP_BACKEND_URL                       to="/settings"
process.env.REACT_APP_BACKEND_URL                       onClick={() => setIsUserMenuOpen(false)}
process.env.REACT_APP_BACKEND_URL                       className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100 mt-2"
process.env.REACT_APP_BACKEND_URL                     >
process.env.REACT_APP_BACKEND_URL                       <FaCog className="w-4 h-4" />
process.env.REACT_APP_BACKEND_URL                       {t('nav.settings')}
process.env.REACT_APP_BACKEND_URL                     </Link>
process.env.REACT_APP_BACKEND_URL                     <button
process.env.REACT_APP_BACKEND_URL                       onClick={async () => {
process.env.REACT_APP_BACKEND_URL                         setIsUserMenuOpen(false);
process.env.REACT_APP_BACKEND_URL                         await logout();
process.env.REACT_APP_BACKEND_URL                         window.location.href = '/login';
process.env.REACT_APP_BACKEND_URL                       }}
process.env.REACT_APP_BACKEND_URL                       className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
process.env.REACT_APP_BACKEND_URL                     >
process.env.REACT_APP_BACKEND_URL                       <FaSignOutAlt className="w-4 h-4" />
process.env.REACT_APP_BACKEND_URL                       {t('nav.logout')}
process.env.REACT_APP_BACKEND_URL                     </button>
process.env.REACT_APP_BACKEND_URL                   </div>
process.env.REACT_APP_BACKEND_URL                 )}
process.env.REACT_APP_BACKEND_URL               </div>
process.env.REACT_APP_BACKEND_URL             ) : (
process.env.REACT_APP_BACKEND_URL               <Link
process.env.REACT_APP_BACKEND_URL                 to="/login"
process.env.REACT_APP_BACKEND_URL                 className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-white/90 font-medium"
process.env.REACT_APP_BACKEND_URL               >
process.env.REACT_APP_BACKEND_URL                 Log ind
process.env.REACT_APP_BACKEND_URL               </Link>
process.env.REACT_APP_BACKEND_URL             )}
process.env.REACT_APP_BACKEND_URL           </div>
process.env.REACT_APP_BACKEND_URL         </div>
process.env.REACT_APP_BACKEND_URL       </div>
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL       {/* Mobile menu button */}
process.env.REACT_APP_BACKEND_URL       <div ref={mobileMenuRef} className="absolute right-4 top-4 lg:hidden">
process.env.REACT_APP_BACKEND_URL         {user ? (
process.env.REACT_APP_BACKEND_URL           <div className="relative">
process.env.REACT_APP_BACKEND_URL             <button
process.env.REACT_APP_BACKEND_URL               onClick={(e) => {
process.env.REACT_APP_BACKEND_URL                 e.preventDefault();
process.env.REACT_APP_BACKEND_URL                 e.stopPropagation();
process.env.REACT_APP_BACKEND_URL                 console.log('[App] Mobile menu toggled');
process.env.REACT_APP_BACKEND_URL                 setIsUserMenuOpen(!isUserMenuOpen);
process.env.REACT_APP_BACKEND_URL               }}
process.env.REACT_APP_BACKEND_URL               className="flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all cursor-pointer active:bg-white/30"
process.env.REACT_APP_BACKEND_URL               style={{ WebkitTapHighlightColor: 'transparent' }}
process.env.REACT_APP_BACKEND_URL               data-testid="mobile-profile-button"
process.env.REACT_APP_BACKEND_URL               data-tour="settings-menu"
process.env.REACT_APP_BACKEND_URL             >
process.env.REACT_APP_BACKEND_URL               <FaCog size={24} className="text-white" />
process.env.REACT_APP_BACKEND_URL             </button>
process.env.REACT_APP_BACKEND_URL             
process.env.REACT_APP_BACKEND_URL             {/* Dropdown menu */}
process.env.REACT_APP_BACKEND_URL             {isUserMenuOpen && (
process.env.REACT_APP_BACKEND_URL               <div 
process.env.REACT_APP_BACKEND_URL                 className="fixed right-4 top-20 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
process.env.REACT_APP_BACKEND_URL                 style={{ display: 'block', visibility: 'visible' }}
process.env.REACT_APP_BACKEND_URL                 onClick={(e) => {
process.env.REACT_APP_BACKEND_URL                   // Stop clicks inside menu from closing it
process.env.REACT_APP_BACKEND_URL                   e.stopPropagation();
process.env.REACT_APP_BACKEND_URL                 }}
process.env.REACT_APP_BACKEND_URL               >
process.env.REACT_APP_BACKEND_URL                 <Link
process.env.REACT_APP_BACKEND_URL                   to="/profile"
process.env.REACT_APP_BACKEND_URL                   onClick={(e) => {
process.env.REACT_APP_BACKEND_URL                     e.stopPropagation();
process.env.REACT_APP_BACKEND_URL                     console.log('[App] Profile clicked');
process.env.REACT_APP_BACKEND_URL                     // Don't close menu immediately - let navigation happen first
process.env.REACT_APP_BACKEND_URL                     setIsUserMenuOpen(false);
process.env.REACT_APP_BACKEND_URL                   }}
process.env.REACT_APP_BACKEND_URL                   className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer active:bg-gray-100"
process.env.REACT_APP_BACKEND_URL                   style={{ WebkitTapHighlightColor: 'transparent' }}
process.env.REACT_APP_BACKEND_URL                 >
process.env.REACT_APP_BACKEND_URL                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
process.env.REACT_APP_BACKEND_URL                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
process.env.REACT_APP_BACKEND_URL                   </svg>
process.env.REACT_APP_BACKEND_URL                   Min profil
process.env.REACT_APP_BACKEND_URL                 </Link>
process.env.REACT_APP_BACKEND_URL                 
process.env.REACT_APP_BACKEND_URL                 <Link
process.env.REACT_APP_BACKEND_URL                   to="/tips"
process.env.REACT_APP_BACKEND_URL                   onClick={(e) => {
process.env.REACT_APP_BACKEND_URL                     e.stopPropagation();
process.env.REACT_APP_BACKEND_URL                     console.log('[App] Tips clicked');
process.env.REACT_APP_BACKEND_URL                     setIsUserMenuOpen(false);
process.env.REACT_APP_BACKEND_URL                   }}
process.env.REACT_APP_BACKEND_URL                   className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer active:bg-gray-100"
process.env.REACT_APP_BACKEND_URL                   style={{ WebkitTapHighlightColor: 'transparent' }}
process.env.REACT_APP_BACKEND_URL                 >
process.env.REACT_APP_BACKEND_URL                   <FaLightbulb className="w-4 h-4 text-yellow-500" />
process.env.REACT_APP_BACKEND_URL                   Tips & Tricks
process.env.REACT_APP_BACKEND_URL                 </Link>
process.env.REACT_APP_BACKEND_URL                 
process.env.REACT_APP_BACKEND_URL                 <Link
process.env.REACT_APP_BACKEND_URL                   to="/favorites"
process.env.REACT_APP_BACKEND_URL                   onClick={(e) => {
process.env.REACT_APP_BACKEND_URL                     e.stopPropagation();
process.env.REACT_APP_BACKEND_URL                     console.log('[App] Favorites clicked');
process.env.REACT_APP_BACKEND_URL                     setIsUserMenuOpen(false);
process.env.REACT_APP_BACKEND_URL                   }}
process.env.REACT_APP_BACKEND_URL                   className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer active:bg-gray-100"
process.env.REACT_APP_BACKEND_URL                   style={{ WebkitTapHighlightColor: 'transparent' }}
process.env.REACT_APP_BACKEND_URL                 >
process.env.REACT_APP_BACKEND_URL                   <FaHeart className="w-4 h-4" />
process.env.REACT_APP_BACKEND_URL                   Favoritter
process.env.REACT_APP_BACKEND_URL                 </Link>
process.env.REACT_APP_BACKEND_URL                 
process.env.REACT_APP_BACKEND_URL                 <Link
process.env.REACT_APP_BACKEND_URL                   to="/settings"
process.env.REACT_APP_BACKEND_URL                   onClick={(e) => {
process.env.REACT_APP_BACKEND_URL                     e.stopPropagation();
process.env.REACT_APP_BACKEND_URL                     console.log('[App] Settings clicked');
process.env.REACT_APP_BACKEND_URL                     setIsUserMenuOpen(false);
process.env.REACT_APP_BACKEND_URL                   }}
process.env.REACT_APP_BACKEND_URL                   className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100 cursor-pointer active:bg-gray-100"
process.env.REACT_APP_BACKEND_URL                   style={{ WebkitTapHighlightColor: 'transparent' }}
process.env.REACT_APP_BACKEND_URL                 >
process.env.REACT_APP_BACKEND_URL                   <FaCog className="w-4 h-4" />
process.env.REACT_APP_BACKEND_URL                   {t('nav.settings')}
process.env.REACT_APP_BACKEND_URL                 </Link>
process.env.REACT_APP_BACKEND_URL                 
process.env.REACT_APP_BACKEND_URL                 <button
process.env.REACT_APP_BACKEND_URL                   onClick={async (e) => {
process.env.REACT_APP_BACKEND_URL                     e.preventDefault();
process.env.REACT_APP_BACKEND_URL                     e.stopPropagation();
process.env.REACT_APP_BACKEND_URL                     console.log('[App] Logout clicked');
process.env.REACT_APP_BACKEND_URL                     setIsUserMenuOpen(false);
process.env.REACT_APP_BACKEND_URL                     try {
process.env.REACT_APP_BACKEND_URL                       await logout();
process.env.REACT_APP_BACKEND_URL                       console.log('[App] Logout complete, navigating to login');
process.env.REACT_APP_BACKEND_URL                       navigate('/login');
process.env.REACT_APP_BACKEND_URL                     } catch (error) {
process.env.REACT_APP_BACKEND_URL                       console.error('[App] Logout error:', error);
process.env.REACT_APP_BACKEND_URL                     }
process.env.REACT_APP_BACKEND_URL                   }}
process.env.REACT_APP_BACKEND_URL                   className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100 cursor-pointer active:bg-red-100"
process.env.REACT_APP_BACKEND_URL                   style={{ WebkitTapHighlightColor: 'transparent' }}
process.env.REACT_APP_BACKEND_URL                 >
process.env.REACT_APP_BACKEND_URL                   <FaSignOutAlt className="w-4 h-4" />
process.env.REACT_APP_BACKEND_URL                   Log ud
process.env.REACT_APP_BACKEND_URL                 </button>
process.env.REACT_APP_BACKEND_URL               </div>
process.env.REACT_APP_BACKEND_URL             )}
process.env.REACT_APP_BACKEND_URL           </div>
process.env.REACT_APP_BACKEND_URL         ) : (
process.env.REACT_APP_BACKEND_URL           <div className="flex items-center gap-2">
process.env.REACT_APP_BACKEND_URL             <Link
process.env.REACT_APP_BACKEND_URL               to="/login"
process.env.REACT_APP_BACKEND_URL               className="px-3 py-2 bg-white text-blue-600 rounded-lg hover:bg-white/90 font-medium text-sm"
process.env.REACT_APP_BACKEND_URL               data-testid="mobile-login-button"
process.env.REACT_APP_BACKEND_URL             >
process.env.REACT_APP_BACKEND_URL               Log ind
process.env.REACT_APP_BACKEND_URL             </Link>
process.env.REACT_APP_BACKEND_URL             <Link
process.env.REACT_APP_BACKEND_URL               to="/signup"
process.env.REACT_APP_BACKEND_URL               className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-sm"
process.env.REACT_APP_BACKEND_URL               data-testid="mobile-signup-button"
process.env.REACT_APP_BACKEND_URL             >
process.env.REACT_APP_BACKEND_URL               Tilmeld
process.env.REACT_APP_BACKEND_URL             </Link>
process.env.REACT_APP_BACKEND_URL           </div>
process.env.REACT_APP_BACKEND_URL         )}
process.env.REACT_APP_BACKEND_URL       </div>
process.env.REACT_APP_BACKEND_URL     </nav>
process.env.REACT_APP_BACKEND_URL   );
process.env.REACT_APP_BACKEND_URL };
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL const App = () => {
process.env.REACT_APP_BACKEND_URL   const [sessionId, setSessionId] = useState(null);
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL   useEffect(() => {
process.env.REACT_APP_BACKEND_URL     const id = getSessionId();
process.env.REACT_APP_BACKEND_URL     setSessionId(id);
process.env.REACT_APP_BACKEND_URL   }, []);
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL   if (!sessionId) {
process.env.REACT_APP_BACKEND_URL     return (
process.env.REACT_APP_BACKEND_URL       <div className="flex items-center justify-center min-h-screen">
process.env.REACT_APP_BACKEND_URL         <div className="loading-spinner"></div>
process.env.REACT_APP_BACKEND_URL       </div>
process.env.REACT_APP_BACKEND_URL     );
process.env.REACT_APP_BACKEND_URL   }
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL   return (
process.env.REACT_APP_BACKEND_URL     <BrowserRouter>
process.env.REACT_APP_BACKEND_URL       <AuthProvider>
process.env.REACT_APP_BACKEND_URL         <AppContent sessionId={sessionId} />
process.env.REACT_APP_BACKEND_URL       </AuthProvider>
process.env.REACT_APP_BACKEND_URL     </BrowserRouter>
process.env.REACT_APP_BACKEND_URL   );
process.env.REACT_APP_BACKEND_URL }
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL // Separate component to use AuthContext
process.env.REACT_APP_BACKEND_URL const AppContent = ({ sessionId }) => {
process.env.REACT_APP_BACKEND_URL   const { user, loading, login } = useAuth();
process.env.REACT_APP_BACKEND_URL   const location = useLocation();
process.env.REACT_APP_BACKEND_URL   
process.env.REACT_APP_BACKEND_URL   // Use user.id as sessionId for logged-in users, otherwise use guest sessionId
process.env.REACT_APP_BACKEND_URL   // More robust check: user must be object with id property
process.env.REACT_APP_BACKEND_URL   const effectiveSessionId = (user && typeof user === 'object' && user.id) ? user.id : sessionId;
process.env.REACT_APP_BACKEND_URL   
process.env.REACT_APP_BACKEND_URL   // Debug logging
process.env.REACT_APP_BACKEND_URL   React.useEffect(() => {
process.env.REACT_APP_BACKEND_URL     console.log('[App] User object:', user);
process.env.REACT_APP_BACKEND_URL     console.log('[App] User type:', typeof user);
process.env.REACT_APP_BACKEND_URL     console.log('[App] User.id:', user?.id);
process.env.REACT_APP_BACKEND_URL     console.log('[App] User:', user ? `${user.email} (id: ${user.id})` : 'Guest');
process.env.REACT_APP_BACKEND_URL     console.log('[App] Guest sessionId:', sessionId);
process.env.REACT_APP_BACKEND_URL     console.log('[App] Effective sessionId:', effectiveSessionId);
process.env.REACT_APP_BACKEND_URL   }, [user, sessionId, effectiveSessionId]);
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL   const { t } = useTranslation();
process.env.REACT_APP_BACKEND_URL   
process.env.REACT_APP_BACKEND_URL   const navItems = [
process.env.REACT_APP_BACKEND_URL     { path: "/", icon: FaHome, label: t('nav.home') },
process.env.REACT_APP_BACKEND_URL     { path: "/recipes", icon: FaBook, label: t('nav.recipes') },
process.env.REACT_APP_BACKEND_URL     { path: "/match", icon: FaMagic, label: t('nav.match') },
process.env.REACT_APP_BACKEND_URL     ...(user && user.role !== 'guest' ? [{ path: "/shopping", icon: FaShoppingCart, label: t('nav.shoppingList') }] : []),
process.env.REACT_APP_BACKEND_URL     ...(user && user.role !== 'guest' ? [{ path: "/favorites", icon: FaHeart, label: t('nav.favorites') }] : []),
process.env.REACT_APP_BACKEND_URL     { path: "/settings", icon: FaCog, label: t('nav.settings') },
process.env.REACT_APP_BACKEND_URL   ];
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL   // Don't show nav on auth pages
process.env.REACT_APP_BACKEND_URL   const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(location.pathname);
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL   if (loading) {
process.env.REACT_APP_BACKEND_URL     return (
process.env.REACT_APP_BACKEND_URL       <div className="flex items-center justify-center min-h-screen">
process.env.REACT_APP_BACKEND_URL         <div className="loading-spinner"></div>
process.env.REACT_APP_BACKEND_URL       </div>
process.env.REACT_APP_BACKEND_URL     );
process.env.REACT_APP_BACKEND_URL   }
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL   return (
process.env.REACT_APP_BACKEND_URL     <div className="app-container">
process.env.REACT_APP_BACKEND_URL       {/* Background decorations */}
process.env.REACT_APP_BACKEND_URL       <div className="bg-decoration bg-decoration-1"></div>
process.env.REACT_APP_BACKEND_URL       <div className="bg-decoration bg-decoration-2"></div>
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL       <div className="relative z-10">
process.env.REACT_APP_BACKEND_URL         {!isAuthPage && <Navigation />}
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL         <main className={`container mx-auto px-4 py-6 ${!isAuthPage ? 'mb-20 lg:mb-6' : ''}`}>
process.env.REACT_APP_BACKEND_URL           <Routes>
process.env.REACT_APP_BACKEND_URL             {/* Auth Routes */}
process.env.REACT_APP_BACKEND_URL             <Route path="/login" element={<LoginPage onLogin={login} />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/signup" element={<SignupPage />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/forgot-password" element={<ForgotPasswordPage />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/reset-password" element={<ResetPasswordPage />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/profile" element={<ProfilePage />} />
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL             {/* App Routes */}
process.env.REACT_APP_BACKEND_URL             <Route path="/" element={<HomePage sessionId={effectiveSessionId} />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/recipes" element={<RecipesPage sessionId={effectiveSessionId} />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/recipes/:id" element={<RecipeDetailPage sessionId={effectiveSessionId} />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/pantry" element={<PantryPage sessionId={effectiveSessionId} />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/match" element={<MatchFinderPage sessionId={effectiveSessionId} />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/shopping" element={<ShoppingListPage sessionId={effectiveSessionId} />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/favorites" element={<FavoritesPage sessionId={effectiveSessionId} />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/settings" element={<SettingsPage sessionId={effectiveSessionId} />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/guide" element={<GuidePage />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/add-recipe" element={<AddRecipePage sessionId={effectiveSessionId} />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/edit-recipe/:id" element={<EditRecipePage sessionId={effectiveSessionId} />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/members" element={<MembersPage />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/brix-info" element={<BrixInfoPage />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/ai" element={<SlushBookAI />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/admin" element={<AdminPage sessionId={effectiveSessionId} />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/admin/sandbox" element={<AdminSandboxPage sessionId={effectiveSessionId} />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/admin/comments" element={<AdminCommentsPage />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/tips" element={<TipsPage />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/tips/create" element={<CreateTipPage />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/setup" element={<SetupPage />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/admin/ingredients" element={<AdminIngredientsPage sessionId={effectiveSessionId} />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/admin/seed-ingredients" element={<AdminSeedIngredients />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/admin/match-images" element={<AdminMatchImagesPage />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/admin/fix-approvals" element={<AdminFixApprovals />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/admin/delete-recipes" element={<AdminDeleteRecipes />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/admin/links" element={<AdminLinksPage sessionId={effectiveSessionId} />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/admin/ads" element={<AdminAdsPage />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/admin/badges" element={<AdminBadgesPage />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/admin/translations" element={<AdminTranslationsPage />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/admin/recipe-translations" element={<AdminRecipeTranslationsPage />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/admin/import-recipes" element={<AdminImportRecipes />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/shared/:token" element={<SharedRecipePage />} />
process.env.REACT_APP_BACKEND_URL             <Route path="/shares" element={<ManageSharesPage />} />
process.env.REACT_APP_BACKEND_URL           </Routes>
process.env.REACT_APP_BACKEND_URL         </main>
process.env.REACT_APP_BACKEND_URL       </div>
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL       {/* Global Ad Slot for guests - shows on all pages except auth pages */}
process.env.REACT_APP_BACKEND_URL       {!isAuthPage && <AdSlot placement="bottom_banner" />}
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL       {/* Mobile Bottom Navigation */}
process.env.REACT_APP_BACKEND_URL       {!isAuthPage && (
process.env.REACT_APP_BACKEND_URL         <div className="lg:hidden border-t border-gray-200 bg-white fixed bottom-0 left-0 right-0 z-40 shadow-lg">
process.env.REACT_APP_BACKEND_URL           <div className="grid grid-cols-5 gap-1 p-2">
process.env.REACT_APP_BACKEND_URL             {/* Home */}
process.env.REACT_APP_BACKEND_URL             <Link
process.env.REACT_APP_BACKEND_URL               to="/"
process.env.REACT_APP_BACKEND_URL               className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
process.env.REACT_APP_BACKEND_URL                 location.pathname === '/' ? "bg-cyan-50 text-cyan-600" : "text-gray-600"
process.env.REACT_APP_BACKEND_URL               }`}
process.env.REACT_APP_BACKEND_URL             >
process.env.REACT_APP_BACKEND_URL               <FaHome size={18} />
process.env.REACT_APP_BACKEND_URL               <span className="text-xs font-medium">{t('nav.home')}</span>
process.env.REACT_APP_BACKEND_URL             </Link>
process.env.REACT_APP_BACKEND_URL             
process.env.REACT_APP_BACKEND_URL             {/* Recipes */}
process.env.REACT_APP_BACKEND_URL             <Link
process.env.REACT_APP_BACKEND_URL               to="/recipes"
process.env.REACT_APP_BACKEND_URL               className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
process.env.REACT_APP_BACKEND_URL                 location.pathname === '/recipes' ? "bg-cyan-50 text-cyan-600" : "text-gray-600"
process.env.REACT_APP_BACKEND_URL               }`}
process.env.REACT_APP_BACKEND_URL             >
process.env.REACT_APP_BACKEND_URL               <FaBook size={18} />
process.env.REACT_APP_BACKEND_URL               <span className="text-xs font-medium">{t('nav.recipes')}</span>
process.env.REACT_APP_BACKEND_URL             </Link>
process.env.REACT_APP_BACKEND_URL             
process.env.REACT_APP_BACKEND_URL             {/* Match */}
process.env.REACT_APP_BACKEND_URL             <Link
process.env.REACT_APP_BACKEND_URL               to="/match"
process.env.REACT_APP_BACKEND_URL               className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
process.env.REACT_APP_BACKEND_URL                 location.pathname === '/match' ? "bg-cyan-50 text-cyan-600" : "text-gray-600"
process.env.REACT_APP_BACKEND_URL               }`}
process.env.REACT_APP_BACKEND_URL             >
process.env.REACT_APP_BACKEND_URL               <FaMagic size={18} />
process.env.REACT_APP_BACKEND_URL               <span className="text-xs font-medium">Match</span>
process.env.REACT_APP_BACKEND_URL             </Link>
process.env.REACT_APP_BACKEND_URL             
process.env.REACT_APP_BACKEND_URL             {/* Liste (Shopping) */}
process.env.REACT_APP_BACKEND_URL             <Link
process.env.REACT_APP_BACKEND_URL               to="/shopping"
process.env.REACT_APP_BACKEND_URL               className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
process.env.REACT_APP_BACKEND_URL                 location.pathname === '/shopping' ? "bg-cyan-50 text-cyan-600" : "text-gray-600"
process.env.REACT_APP_BACKEND_URL               }`}
process.env.REACT_APP_BACKEND_URL             >
process.env.REACT_APP_BACKEND_URL               <FaShoppingCart size={18} />
process.env.REACT_APP_BACKEND_URL               <span className="text-xs font-medium">Liste</span>
process.env.REACT_APP_BACKEND_URL             </Link>
process.env.REACT_APP_BACKEND_URL             
process.env.REACT_APP_BACKEND_URL             {/* Settings/Profile */}
process.env.REACT_APP_BACKEND_URL             <Link
process.env.REACT_APP_BACKEND_URL               to="/profile"
process.env.REACT_APP_BACKEND_URL               className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
process.env.REACT_APP_BACKEND_URL                 location.pathname === '/profile' ? "bg-cyan-50 text-cyan-600" : "text-gray-600"
process.env.REACT_APP_BACKEND_URL               }`}
process.env.REACT_APP_BACKEND_URL             >
process.env.REACT_APP_BACKEND_URL               <FaCog size={18} />
process.env.REACT_APP_BACKEND_URL               <span className="text-xs font-medium">Profil</span>
process.env.REACT_APP_BACKEND_URL             </Link>
process.env.REACT_APP_BACKEND_URL           </div>
process.env.REACT_APP_BACKEND_URL         </div>
process.env.REACT_APP_BACKEND_URL       )}
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL       <Toaster position="top-center" richColors />
process.env.REACT_APP_BACKEND_URL     </div>
process.env.REACT_APP_BACKEND_URL   );
process.env.REACT_APP_BACKEND_URL }
process.env.REACT_APP_BACKEND_URL 
process.env.REACT_APP_BACKEND_URL export default App;
