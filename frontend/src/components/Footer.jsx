import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle, ShieldCheck, HeartPulse } from 'lucide-react';

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto border-t border-slate-800">
      {/* Prominent Synthetic Demo Disclaimer */}
      <div className="bg-amber-950/80 border-b border-amber-800/60 px-4 py-2 text-center text-xs text-amber-200">
        <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="font-semibold">{t('demo_badge')}:</span>
          <span>{t('demo_warning')}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand and Mission */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-white font-bold text-lg">
              <HeartPulse className="w-5 h-5 text-emerald-400" />
              <span>{t('app_title')}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI-powered rural healthcare ecosystem designed specifically for the community of Nabha Tehsil (Patiala District, Punjab).
            </p>
            <div className="inline-flex items-center space-x-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded text-[11px] text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Low-Bandwidth & Offline Ready</span>
            </div>
          </div>

          {/* Nabha Primary Health Facilities */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              ਨਾਭਾ ਹਸਪਤਾਲ (Nabha Facilities)
            </h4>
            <ul className="text-xs space-y-2 text-slate-400">
              <li>Sub-Divisional Hospital (Civil Hospital), Nabha</li>
              <li>Bhadson Primary Health Centre (PHC)</li>
              <li>Duladdi Rural Health Post</li>
              <li>Alhoran Health & Wellness Dispensary</li>
              <li>Kakrala Health Sub-Centre</li>
            </ul>
          </div>

          {/* Quick Access */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              ਸੇਵਾਵਾਂ (Services)
            </h4>
            <ul className="text-xs space-y-2 text-slate-400">
              <li>ਡਾਕਟਰ ਮੁਲਾਕਾਤ (Doctor Appointments)</li>
              <li>ਦਵਾਈ ਸਟਾਕ ਜਾਂਚ (Pharmacy Inventory)</li>
              <li>AI ਲੱਛਣ ਜਾਂਚ (Symptom Triage)</li>
              <li>ਡਿਜੀਟਲ ਪਰਚੀ (Digital Prescriptions)</li>
              <li>ਆਸ਼ਾ ਵਰਕਰ ਸਹਾਇਤਾ (ASHA Support)</li>
            </ul>
          </div>

          {/* Emergency & Helpline */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              ਸਹਾਇਤਾ ਅਤੇ ਐਮਰਜੈਂਸੀ
            </h4>
            <div className="text-xs space-y-2 text-slate-400">
              <p className="font-semibold text-amber-400">ਸਰਕਾਰੀ ਐਂਬੂਲੈਂਸ: 108</p>
              <p>ਸਿਵਲ ਹਸਪਤਾਲ ਨਾਭਾ: 01765-220100</p>
              <p>ਮਹਿਲਾ ਹੈਲਪਲਾਈਨ: 181</p>
              <p className="text-[11px] text-slate-500 pt-2">
                ਸਿਹਤ ਸੇਤੂ © 2026 SehatSetu Nabha. All demo rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

