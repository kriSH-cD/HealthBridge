import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  PhoneCall,
  Activity,
  ShieldAlert,
  Wind,
  Bed,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Building2,
  MapPin,
  Clock,
  ArrowLeft,
  Edit3,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { hospitalsApi } from '../services/api';

export const EmergencyPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [hospitals, setHospitals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [hospData, sumData] = await Promise.all([
        hospitalsApi.list(),
        hospitalsApi.getSummary().catch(() => null),
      ]);
      setHospitals(hospData || []);
      setSummary(sumData);
      setError(null);
    } catch (err) {
      console.error('Failed to load emergency data:', err);
      setError('ਹਸਪਤਾਲਾਂ ਦਾ ਲਾਈਵ ਡਾਟਾ ਪ੍ਰਾਪਤ ਕਰਨ ਵਿੱਚ ਅਸਮਰੱਥ (Unable to load live hospital data)');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex-1 bg-slate-900 text-slate-100 min-h-screen pb-16">
      {/* 1. Top Emergency Action Ribbon */}
      <section className="bg-red-700 text-white px-4 py-3 shadow-md border-b border-red-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-white animate-ping shrink-0"></span>
            <span className="font-bold tracking-wide flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>ਨਾਭਾ ਤਹਿਸੀਲ ਐਮਰਜੈਂਸੀ ਹੈਲਪਲਾਈਨ (Emergency Rapid Response)</span>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="tel:108"
              className="bg-white text-red-700 hover:bg-red-50 font-extrabold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow transition"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>108 ਐਂਬੂਲੈਂਸ (Free)</span>
            </a>
            <a
              href="tel:01765220102"
              className="bg-red-950/80 hover:bg-red-900 text-white font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 border border-red-500/50 transition"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>ਸਿਵਲ ਹਸਪਤਾਲ: 01765-220102</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. Main Dashboard Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Header Breadcrumb & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <Link
                to="/"
                className="text-slate-400 hover:text-white transition flex items-center text-xs space-x-1 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>ਵਾਪਸ ਮੁੱਖ ਪੰਨਾ</span>
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-xs text-red-400 font-semibold uppercase tracking-wider">
                ਲਾਈਵ ਟ੍ਰੈਕਰ (Live Tracker)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1 flex items-center space-x-2.5">
              <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
              <span>{t('emergency_dashboard_title')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {t('emergency_dashboard_desc')}
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 flex items-center space-x-1.5 transition shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{refreshing ? 'ਤਾਜ਼ਾ ਹੋ ਰਿਹਾ ਹੈ...' : 'ਤਾਜ਼ਾ ਕਰੋ (Refresh)'}</span>
            </button>
            <div className="hidden sm:inline-flex items-center space-x-1.5 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>ਰੀਅਲ-ਟਾਈਮ ਸਿੰਕ (Live)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
