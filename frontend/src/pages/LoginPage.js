import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Phone, 
  LogIn, 
  AlertCircle, 
  Stethoscope, 
  User as UserIcon, 
  Pill, 
  Hospital 
} from 'lucide-react';

export const LoginPage = () => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(identifier, password);
      navigate('/dashboard');
    } catch (err) {
      console.error("Login failed:", err);
      const msg = err.response?.data?.detail || "ਗਲਤ ਮੋਬਾਈਲ ਨੰਬਰ ਜਾਂ ਪਾਸਵਰਡ (Invalid credentials)";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (demoPhone) => {
    setIdentifier(demoPhone);
    setPassword('password123');
  };

  return (
    <div className="flex-1 max-w-md w-full mx-auto px-4 py-12 flex flex-col justify-center">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-slate-900">{t('sign_in_title')}</h2>
          <p className="text-xs text-slate-500">
            ਸਿਹਤ ਸੇਤੂ ਨਾਭਾ ਵਿੱਚ ਦਾਖਲ ਹੋਣ ਲਈ ਆਪਣਾ ਮੋਬਾਈਲ ਨੰਬਰ ਭਰੋ
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('phone_label')}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 9876543201"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('password_label')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md transition disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? "ਜਾਂਚ ਹੋ ਰਹੀ ਹੈ..." : t('login')}</span>
          </button>
        </form>

        {/* Quick Demo Test Accounts Bar */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
            {t('quick_demo_login')}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('9876543201')}
              className="p-2 border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 text-left transition flex items-center space-x-2"
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <div className="overflow-hidden">
                <p className="font-semibold text-slate-800 truncate">ਡਾਕਟਰ (Civil Hosp)</p>
                <p className="text-[10px] text-slate-400">9876543201</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('9876543101')}
              className="p-2 border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 text-left transition flex items-center space-x-2"
            >
              <UserIcon className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <div className="overflow-hidden">
                <p className="font-semibold text-slate-800 truncate">ਮਰੀਜ਼ (Alhoran)</p>
                <p className="text-[10px] text-slate-400">9876543101</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('9876543301')}
              className="p-2 border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 text-left transition flex items-center space-x-2"
            >
              <Pill className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
              <div className="overflow-hidden">
                <p className="font-semibold text-slate-800 truncate">Jan Aushadhi</p>
                <p className="text-[10px] text-slate-400">9876543301</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('9876543401')}
              className="p-2 border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 text-left transition flex items-center space-x-2"
            >
              <Hospital className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
              <div className="overflow-hidden">
                <p className="font-semibold text-slate-800 truncate">Hospital Admin</p>
                <p className="text-[10px] text-slate-400">9876543401</p>
              </div>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-2">ਸਾਰਿਆਂ ਦਾ ਪਾਸਵਰਡ: password123</p>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-600">
            ਨਵਾਂ ਖਾਤਾ ਬਣਾਉਣਾ ਹੈ?{' '}
            <Link to="/register" className="font-bold text-emerald-700 hover:underline">
              {t('register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

