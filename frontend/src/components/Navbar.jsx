import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  HeartHandshake, 
  PhoneCall, 
  Globe, 
  LogOut, 
  User as UserIcon, 
  ShieldAlert,
  Building2
} from 'lucide-react';

export const Navbar = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      {/* Top Banner: Nabha Emergency & Demo Notice */}
      <div className="bg-slate-900 text-slate-200 text-xs px-4 py-1.5 flex justify-between items-center flex-wrap gap-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-slate-300">📍 {t('app_subtitle')} (Nabha Rural Sector)</span>
          <span className="hidden md:inline bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px]">
            DEMO DATA
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <a 
            href="tel:01765220100" 
            className="flex items-center space-x-1 text-slate-300 hover:text-white transition"
            title="Civil Hospital Nabha Emergency"
          >
            <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
            <span>ਸਿਵਲ ਹਸਪਤਾਲ: 01765-220100</span>
          </a>
          <span className="text-slate-600">|</span>
          <a 
            href="tel:108" 
            className="flex items-center space-x-1 font-bold text-amber-400 hover:text-amber-300"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>108 ਐਮਰਜੈਂਸੀ</span>
          </a>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-sky-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-bold text-slate-900 tracking-tight">{t('app_title')}</span>
              <span className="hidden sm:inline text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                ਨਾਭਾ
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-500 leading-none">Rural Health Bridge</p>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-700">
          <Link to="/" className="hover:text-blue-600 transition">
            {t('home')}
          </Link>
          <Link to="/#doctors" className="hover:text-blue-600 transition">
            {t('find_doctors')}
          </Link>
          <Link to="/#pharmacies" className="hover:text-blue-600 transition">
            {t('medicines')}
          </Link>
          {isAuthenticated && (
            <Link to="/dashboard" className="text-blue-700 font-semibold hover:text-blue-800 transition">
              {t('dashboard')}
            </Link>
          )}
        </nav>

        {/* Right Section: Language Switcher & Auth */}
        <div className="flex items-center space-x-3">
          {/* Multilingual Selector */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-800 outline-none cursor-pointer pr-1"
              aria-label="Language Selector"
            >
              <option value="pa">ਪੰਜਾਬੀ (PA)</option>
              <option value="hi">हिंदी (HI)</option>
              <option value="en">English (EN)</option>
            </select>
          </div>

          {/* User Auth Buttons */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <Link
                to="/dashboard"
                className="flex items-center space-x-1.5 bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span className="sr-only sm:hidden">{t('dashboard')}</span>
                <span className="hidden sm:inline max-w-[100px] truncate">{user?.full_name?.replace(' [DEMO DATA]', '')}</span>
                <span className="hidden sm:inline text-[10px] bg-blue-200 text-blue-900 px-1.5 py-0.2 rounded font-bold uppercase">
                  {user?.role}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title={t('logout')}
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-700 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                {t('login')}
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold bg-blue-600 text-white px-3.5 py-1.5 rounded-lg hover:bg-blue-700 shadow-sm transition"
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

