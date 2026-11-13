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

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOxygen, setFilterOxygen] = useState(false);
  const [filterEmergency, setFilterEmergency] = useState(false);
  const [filterAvailableOnly, setFilterAvailableOnly] = useState(false);

  // Bed Update Modal placeholder state for Part 15
  const [editingHospital, setEditingHospital] = useState(null);

  const canEditBeds = user && ['HOSPITAL_ADMIN', 'DOCTOR', 'ADMIN'].includes(user.role);

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
    // Auto-refresh live bed counts every 12 seconds
    const interval = setInterval(() => {
      fetchData(false);
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Client-side filter matching
  const filteredHospitals = hospitals.filter((h) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchName = h.hospital_name.toLowerCase().includes(query);
      const matchAddr = h.address.toLowerCase().includes(query);
      if (!matchName && !matchAddr) return false;
    }
    if (filterOxygen && !h.has_oxygen) return false;
    if (filterEmergency && !h.has_emergency) return false;
    if (filterAvailableOnly && h.available_beds <= 0) return false;
    return true;
  });

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

        {/* 3. Live Stats Overview Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Available Beds */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Bed className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('available_beds')}</p>
              <p className="text-2xl font-black text-emerald-400">
                {summary ? summary.total_available_beds : hospitals.reduce((acc, h) => acc + h.available_beds, 0)}
              </p>
              <p className="text-[10px] text-slate-400">
                ਕੁੱਲ {summary ? summary.total_beds : hospitals.reduce((acc, h) => acc + h.total_beds, 0)} ਬੈੱਡਾਂ ਵਿੱਚੋਂ
              </p>
            </div>
          </div>

          {/* Card 2: Total Facilities */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ਹਸਪਤਾਲ / ਕੇਂਦਰ</p>
              <p className="text-2xl font-black text-blue-400">
                {summary ? summary.total_facilities : hospitals.length}
              </p>
              <p className="text-[10px] text-slate-400">ਨਾਭਾ ਤਹਿਸੀਲ ਅਧੀਨ</p>
            </div>
          </div>

          {/* Card 3: Oxygen Ready Facilities */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <Wind className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ਆਕਸੀਜਨ ਸਹੂਲਤ</p>
              <p className="text-2xl font-black text-cyan-400">
                {summary ? summary.oxygen_facilities : hospitals.filter((h) => h.has_oxygen).length}
              </p>
              <p className="text-[10px] text-slate-400">ਪਲਾਂਟ ਅਤੇ ਸਿਲੰਡਰ ਸਮਰਥਿਤ</p>
            </div>
          </div>

          {/* Card 4: 24/7 Emergency Units */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">24/7 ਐਮਰਜੈਂਸੀ</p>
              <p className="text-2xl font-black text-red-400">
                {summary ? summary.emergency_facilities : hospitals.filter((h) => h.has_emergency).length}
              </p>
              <p className="text-[10px] text-slate-400">ਸਿਵਲ ਤੇ ਸੀ.ਐਚ.ਸੀ. ਯੂਨਿਟ</p>
            </div>
          </div>
        </section>

        {/* 4. Search and Filter Bar */}
        <section className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-3 sm:p-4 space-y-3 shadow">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ਹਸਪਤਾਲ ਦਾ ਨਾਮ ਜਾਂ ਪਿੰਡ ਖੋਜੋ (Search hospital or village)..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Toggle Buttons */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                type="button"
                onClick={() => setFilterAvailableOnly(!filterAvailableOnly)}
                className={`px-3 py-2 rounded-xl font-semibold border transition flex items-center space-x-1.5 ${
                  filterAvailableOnly
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                <Bed className="w-3.5 h-3.5" />
                <span>ਉਪਲਬਧ ਬੈੱਡ ਹੀ (Available)</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterOxygen(!filterOxygen)}
                className={`px-3 py-2 rounded-xl font-semibold border transition flex items-center space-x-1.5 ${
                  filterOxygen
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                <Wind className="w-3.5 h-3.5" />
                <span>ਆਕਸੀਜਨ ਸਮਰਥਿਤ</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterEmergency(!filterEmergency)}
                className={`px-3 py-2 rounded-xl font-semibold border transition flex items-center space-x-1.5 ${
                  filterEmergency
                    ? 'bg-red-600 text-white border-red-500 shadow-sm'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>24/7 ਐਮਰਜੈਂਸੀ</span>
              </button>
            </div>
          </div>
        </section>

        {/* 5. Hospital Cards Grid */}
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold text-slate-300">ਲਾਈਵ ਹਸਪਤਾਲ ਬੈੱਡ ਡਾਟਾ ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...</p>
            <p className="text-xs text-slate-500">Connecting to Nabha Regional Healthcare Network...</p>
          </div>
        ) : error ? (
          <div className="bg-slate-800 border border-red-500/40 rounded-2xl p-6 text-center text-red-400 space-y-2">
            <AlertTriangle className="w-8 h-8 mx-auto text-red-400" />
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={() => fetchData(true)}
              className="text-xs bg-red-600/30 hover:bg-red-600/50 text-white px-3 py-1.5 rounded-lg border border-red-500/40 transition"
            >
              ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ (Retry)
            </button>
          </div>
        ) : filteredHospitals.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
            <Building2 className="w-12 h-12 mx-auto text-slate-600" />
            <p className="text-base font-bold text-slate-300">ਕੋਈ ਹਸਪਤਾਲ ਜਾਂ ਕੇਂਦਰ ਨਹੀਂ ਮਿਲਿਆ</p>
            <p className="text-xs text-slate-500">ਤੁਹਾਡੇ ਚੁਣੇ ਹੋਏ ਫਿਲਟਰਾਂ ਅਨੁਸਾਰ ਕੋਈ ਡਾਟਾ ਮੌਜੂਦ ਨਹੀਂ ਹੈ।</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterOxygen(false);
                setFilterEmergency(false);
                setFilterAvailableOnly(false);
              }}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl transition"
            >
              ਫਿਲਟਰ ਹਟਾਓ (Reset Filters)
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHospitals.map((h) => {
              const occupancyPct = h.total_beds > 0 ? Math.round(((h.total_beds - h.available_beds) / h.total_beds) * 100) : 0;
              const isCivil = h.hospital_name.toLowerCase().includes('civil');
              const isCritical = h.available_beds <= 5 && h.available_beds > 0;
              const isFull = h.available_beds === 0;

              return (
                <div
                  key={h.id}
                  className={`bg-slate-800 border rounded-2xl p-5 shadow-xl transition-all relative flex flex-col justify-between ${
                    isCivil
                      ? 'border-emerald-500/40 hover:border-emerald-500/70 bg-gradient-to-br from-slate-800 to-slate-850'
                      : 'border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  {/* Top Badge Strip */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                            <Building2 className={`w-4 h-4 ${isCivil ? 'text-emerald-400' : 'text-blue-400'}`} />
                            <span>{h.hospital_name}</span>
                          </h3>
                          {isCivil && (
                            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                              ਮੁੱਖ ਸਰਕਾਰੀ ਹਸਪਤਾਲ (Apex Center)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{h.address}</span>
                        </p>
                      </div>

                      {/* Status Tag */}
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${
                          isFull
                            ? 'bg-red-950/70 text-red-400 border-red-800/80'
                            : isCritical
                            ? 'bg-amber-950/70 text-amber-400 border-amber-800/80 animate-pulse'
                            : 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80'
                        }`}
                      >
                        {isFull ? t('bed_status_full') : isCritical ? t('bed_status_critical') : t('bed_status_available')}
                      </span>
                    </div>

                    {/* Bed Capacity Progress Meter */}
                    <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-750 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">ਬੈੱਡ ਉਪਲਬਧਤਾ (Beds Available):</span>
                        <span className="font-extrabold text-sm text-emerald-400 font-mono">
                          {h.available_beds} <span className="text-xs text-slate-500">/ {h.total_beds} ਕੁੱਲ</span>
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isFull ? 'bg-red-500' : isCritical ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max(5, ((h.total_beds - h.available_beds) / h.total_beds) * 100)}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>ਵਰਤੇ ਗਏ (Occupied): {h.total_beds - h.available_beds} ਬੈੱਡ</span>
                        <span>ਬੈੱਡ ਵਰਤੋਂ: {occupancyPct}%</span>
                      </div>
                    </div>

                    {/* Facility Attributes / Badges */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {h.has_oxygen ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-950/50 text-cyan-300 border border-cyan-800/50 font-medium">
                          <Wind className="w-3.5 h-3.5 text-cyan-400" />
                          <span>ਆਕਸੀਜਨ ਉਪਲਬਧ (O₂ Ready)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 text-slate-500 border border-slate-800">
                          <Wind className="w-3.5 h-3.5 text-slate-600" />
                          <span>ਆਕਸੀਜਨ ਨਹੀਂ</span>
                        </span>
                      )}

                      {h.has_emergency ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-950/50 text-red-300 border border-red-800/50 font-medium">
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                          <span>24/7 ਐਮਰਜੈਂਸੀ ਯੂਨਿਟ</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 text-slate-500 border border-slate-800">
                          <Clock className="w-3.5 h-3.5 text-slate-600" />
                          <span>ਓ.ਪੀ.ਡੀ. ਸੇਵਾਵਾਂ (Day Care)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-750 flex items-center justify-between gap-2">
                    <a
                      href={`tel:${h.emergency_phone}`}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow transition"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{h.emergency_phone ? `ਕਾਲ ਕਰੋ: ${h.emergency_phone}` : t('call_hospital')}</span>
                    </a>

                    {/* Staff / Doctor bed update button */}
                    {canEditBeds && (
                      <button
                        type="button"
                        onClick={() => setEditingHospital(h)}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold p-2 rounded-xl transition flex items-center space-x-1"
                        title={t('update_beds')}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">ਸੋਧੋ</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
};
