import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { directoryApi, systemApi } from '../services/api';
import { NABHA_VILLAGES } from '../i18n/translations';
import { 
  Stethoscope, 
  Pill, 
  Sparkles, 
  Hospital, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Database, 
  Search,
  Clock,
  ArrowRight,
  Activity,
  Server
} from 'lucide-react';

export const HomePage = () => {
  const { t } = useLanguage();
  const [doctors, setDoctors] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedVillage, setSelectedVillage] = useState('');
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState(null);
  const [apiHealth, setApiHealth] = useState(null);

  const checkLiveHealth = async () => {
    try {
      const data = await systemApi.getDirectApiHealth();
      setApiHealth(data);
    } catch (err) {
      console.error("Health check error:", err);
      setApiHealth({ status: "offline", error: "Connection error" });
    }
  };

  const fetchData = async (village = '') => {
    setLoading(true);
    try {
      const [docs, pharms] = await Promise.all([
        directoryApi.getDoctors(village ? { village } : {}),
        directoryApi.getPharmacies(village ? { village } : {}),
      ]);
      setDoctors(docs);
      setPharmacies(pharms);
    } catch (err) {
      console.error("Failed to load Nabha directory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkLiveHealth();
    fetchData(selectedVillage);
  }, [selectedVillage]);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const res = await systemApi.seedDemoData();
      setSeedNotice(res.message || t('seed_demo_success'));
      await fetchData(selectedVillage);
    } catch (err) {
      console.error("Seeding error:", err);
      setSeedNotice("Failed to seed demo data. Check backend connection.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex-1 pb-16 bg-slate-50 text-slate-800">
      {/* Hero Section: Professional Medical Blue */}
      <section className="bg-gradient-to-b from-blue-900 via-blue-800 to-slate-900 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-blue-950">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-blue-950/80 border border-blue-400/30 px-3.5 py-1.5 rounded-full text-xs font-medium text-blue-200">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Nabha Tehsil, Patiala District • ਪੇਂਡੂ ਸਿਹਤ ਮਿਸ਼ਨ</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            {t('hero_title')}
          </h1>

          <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">
            {t('hero_desc')}
          </p>

          {/* Live Axios Backend Health Probe Indicator */}
          {apiHealth && (
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur border border-white/20 text-xs px-3.5 py-1.5 rounded-full text-slate-100">
              <span className={`w-2 h-2 rounded-full ${apiHealth.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
              <span>FastAPI Backend: <strong>{apiHealth.status?.toUpperCase()}</strong></span>
              <span className="text-blue-300">•</span>
              <span>DB: <strong>{apiHealth.database?.status} ({apiHealth.database?.type})</strong></span>
            </div>
          )}

          {/* Action Row: Seed Demo Data & Register */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 text-sm"
            >
              <Database className="w-4 h-4" />
              <span>{seeding ? "ਸੀਡਿੰਗ ਹੋ ਰਹੀ ਹੈ..." : t('seed_demo_btn')}</span>
            </button>

            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white font-semibold px-5 py-3 rounded-xl border border-white/20 transition-all text-sm"
            >
              <span>{t('register_title')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {seedNotice && (
            <div className="inline-flex items-center space-x-2 bg-blue-950/90 border border-blue-400 text-blue-100 text-xs px-4 py-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{seedNotice}</span>
            </div>
          )}
        </div>
      </section>

      {/* Feature Pillars: Clean White Cards with Grey Borders */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">{t('find_doctors')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ਸਿਵਲ ਹਸਪਤਾਲ ਨਾਭਾ ਅਤੇ ਭਾਦਸੋਂ ਪੀ.ਐਚ.ਸੀ ਦੇ ਮਾਹਿਰ ਡਾਕਟਰਾਂ ਨਾਲ ਆਨਲਾਈਨ ਮੁਲਾਕਾਤ।
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <Pill className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">{t('medicines')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ਜਨ ਔਸ਼ਧੀ ਕੇਂਦਰ ਅਤੇ ਪਿੰਡਾਂ ਦੀਆਂ ਦੁਕਾਨਾਂ 'ਤੇ ਜ਼ਰੂਰੀ ਦਵਾਈਆਂ ਦਾ ਲਾਈਵ ਸਟਾਕ।
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">AI ਲੱਛਣ ਜਾਂਚ (Triage)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ਪੰਜਾਬੀ ਵਿੱਚ ਬੋਲ ਕੇ ਜਾਂ ਲਿਖ ਕੇ ਬਿਮਾਰੀ ਦੇ ਲੱਛਣਾਂ ਦੀ ਮੁੱਢਲੀ ਸਲਾਹ ਲਵੋ।
            </p>
          </div>

          <Link
            to="/emergency"
            className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-rose-400 hover:shadow-md transition block"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Hospital className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center space-x-1 text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span>108 LIVE</span>
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1 group-hover:text-rose-600 transition-colors">
              ਐਮਰਜੈਂਸੀ ਬਿਸਤਰੇ ਤੇ 108 ਐਂਬੂਲੈਂਸ
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              ਸਿਵਲ ਹਸਪਤਾਲ ਨਾਭਾ ਵਿਖੇ ਆਕਸੀਜਨ, ਬੈੱਡ ਅਤੇ 108 ਐਂਬੂਲੈਂਸ ਫਲੀਟ ਦੀ ਲਾਈਵ ਸਥਿਤੀ।
            </p>
            <div className="flex items-center text-xs font-semibold text-rose-600 group-hover:text-rose-700">
              <span>ਲਾਈਵ ਟ੍ਰੈਕਰ ਅਤੇ ਡਿਸਪੈਚ</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* Directory Filter by Nabha Village */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              ਨਾਭਾ ਡਾਕਟਰ ਅਤੇ ਫਾਰਮੇਸੀ ਡਾਇਰੈਕਟਰੀ
            </h2>
            <p className="text-xs text-slate-500">
              ਸਿੰਥੈਟਿਕ ਟੈਸਟ ਡਾਟਾ: ਪਿੰਡ ਅਨੁਸਾਰ ਸਿਹਤ ਸੁਵਿਧਾਵਾਂ ਫਿਲਟਰ ਕਰੋ
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ਸਾਰੇ ਇਲਾਕੇ / ਪਿੰਡ (All Villages)</option>
              {NABHA_VILLAGES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Doctors List */}
        <div className="mt-8" id="doctors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              <span>ਉਪਲਬਧ ਡਾਕਟਰ ({doctors.length})</span>
            </h3>
            <span className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
              DEMO RECORDS
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...</div>
          ) : doctors.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700">ਕੋਈ ਡਾਕਟਰ ਨਹੀਂ ਮਿਲਿਆ</p>
              <p className="text-xs text-slate-500">ਉੱਪਰ ਦਿੱਤੇ "ਨਾਭਾ ਡੈਮੋ ਡਾਟਾ ਲੋਡ ਕਰੋ" ਬਟਨ ਨੂੰ ਦਬਾਓ।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map((doc) => (
                <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {doc.full_name.replace(' [DEMO DATA]', '')}
                      </h4>
                      <p className="text-xs font-medium text-blue-700">
                        {doc.doctor_profile?.specialization || 'General Physician'}
                      </p>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded border border-blue-200">
                      {doc.doctor_profile?.consultation_fee === 0 ? 'ਸਰਕਾਰੀ / ਮੁਫ਼ਤ' : `₹${doc.doctor_profile?.consultation_fee}`}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 my-3">
                    <p className="flex items-center space-x-1.5">
                      <Hospital className="w-3.5 h-3.5 text-slate-400" />
                      <span>{doc.doctor_profile?.hospital_name}</span>
                    </p>
                    <p className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>ਪਿੰਡ/ਇਲਾਕਾ: {doc.village || 'Nabha'}</span>
                    </p>
                    <p className="flex items-center space-x-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>ਤਜਰਬਾ: {doc.doctor_profile?.experience_years} ਸਾਲ</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      ਲਾਇਸੈਂਸ: {doc.doctor_profile?.license_number}
                    </span>
                    <Link
                      to="/login"
                      className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                    >
                      ਮੁਲਾਕਾਤ ਬੁੱਕ ਕਰੋ →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pharmacies List */}
        <div className="mt-12" id="pharmacies">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Pill className="w-4 h-4 text-sky-600" />
              <span>ਨਾਭਾ ਮੈਡੀਕਲ ਸਟੋਰ ਅਤੇ ਫਾਰਮੇਸੀਆਂ ({pharmacies.length})</span>
            </h3>
            <span className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
              DEMO RECORDS
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...</div>
          ) : pharmacies.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700">ਕੋਈ ਫਾਰਮੇਸੀ ਨਹੀਂ ਮਿਲੀ</p>
              <p className="text-xs text-slate-500">ਉੱਪਰ ਦਿੱਤੇ "ਨਾਭਾ ਡੈਮੋ ਡਾਟਾ ਲੋਡ ਕਰੋ" ਬਟਨ ਨੂੰ ਦਬਾਓ।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pharmacies.map((ph) => (
                <div key={ph.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                  <h4 className="font-bold text-slate-900 text-sm mb-1">
                    {ph.pharmacy_profile?.pharmacy_name || ph.full_name.replace(' [DEMO DATA]', '')}
                  </h4>
                  <div className="text-xs text-slate-600 space-y-1.5 my-3">
                    <p className="flex items-start space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span>{ph.pharmacy_profile?.address}</span>
                    </p>
                    <p className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>ਫੋਨ: {ph.phone}</span>
                    </p>
                    <p className="flex items-center space-x-1.5 text-blue-700 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{ph.pharmacy_profile?.operating_hours}</span>
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                    ਰਜਿ: {ph.pharmacy_profile?.license_number}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
