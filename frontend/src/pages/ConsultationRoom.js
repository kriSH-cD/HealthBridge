import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Video, Mic, PhoneOff, Wifi,
  User, Stethoscope, Shield, Clock, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { consultationsApi } from '../services/api';

export const ConsultationRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [callStatus, setCallStatus] = useState('CONNECTING');

  useEffect(() => {
    let isMounted = true;
    const fetchConsultation = async () => {
      try {
        setLoading(true);
        const data = await consultationsApi.get(roomId);
        if (isMounted) {
          setConsultation(data);
          setCallStatus(data.status || 'CONNECTING');
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.error || 'Failed to load consultation session');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (roomId) {
      fetchConsultation();
    }
    return () => {
      isMounted = false;
    };
  }, [roomId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
        <p className="text-slate-300 font-medium">ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ... (Connecting to Consultation Room)</p>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-6 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">ਕੰਸਲਟੇਸ਼ਨ ਰੂਮ ਨਹੀਂ ਮਿਲਿਆ</h2>
          <p className="text-sm text-slate-400 mb-4">{error || 'Consultation session not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
          >
            ਵਾਪਸ ਜਾਓ (Return to Dashboard)
          </button>
        </div>
      </div>
    );
  }

  const isDoctor = user?.role === 'DOCTOR';
  const otherParty = isDoctor ? consultation.patient : consultation.doctor;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            {isDoctor ? <User className="w-5 h-5" /> : <Stethoscope className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="font-semibold text-sm md:text-base flex items-center gap-2">
              {otherParty?.full_name || 'Healthcare Professional'}
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {otherParty?.village ? `ਪਿੰਡ ${otherParty.village}` : otherParty?.specialization || 'Nabha Telehealth'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1 font-mono">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>{roomId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {callStatus}
          </span>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>{t('end_call') || 'ਬਾਹਰ ਜਾਓ'}</span>
          </button>
        </div>
      </header>

      {/* Main Video/Call Canvas Placeholder */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 max-w-lg w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
            <Video className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t('teleconsultation')}</h2>
          <p className="text-sm text-slate-400 mb-6">
            ਸੁਰੱਖਿਅਤ ਵੀਡੀਓ ਅਤੇ ਆਡੀਓ ਕਾਲ ਸੈਸ਼ਨ ਸ਼ੁਰੂ ਹੋ ਰਿਹਾ ਹੈ...
          </p>
          <div className="p-3 bg-slate-800/80 rounded-xl text-left text-xs space-y-1.5 text-slate-300 border border-slate-700/50">
            <p className="flex justify-between">
              <span className="text-slate-400">ਮਰੀਜ਼ (Patient):</span>
              <span className="font-medium text-white">{consultation.patient?.full_name}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400">ਡਾਕਟਰ (Doctor):</span>
              <span className="font-medium text-white">{consultation.doctor?.full_name}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400">ਮੋਡ (Type):</span>
              <span className="font-mono text-emerald-400">{consultation.consultation_type || 'VIDEO'}</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
