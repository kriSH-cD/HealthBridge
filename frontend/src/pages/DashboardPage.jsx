import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { directoryApi } from '../services/api';
import { AppointmentsPanel } from '../components/AppointmentsPanel';
import { BookAppointmentForm } from '../components/BookAppointmentForm';
import { MedicineSearch } from '../components/MedicineSearch';
import { PharmacyStock } from '../components/PharmacyStock';
import { 
  User, 
  Stethoscope, 
  Pill, 
  Hospital, 
  MapPin, 
  Phone, 
  Calendar, 
  AlertTriangle,
  Users,
  Activity
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientError, setPatientError] = useState(null);
  const [booking, setBooking] = useState(false);
  const [appointmentsKey, setAppointmentsKey] = useState(0);

  // If role is DOCTOR, ASHA_WORKER, or HOSPITAL_ADMIN, test fetching the restricted patient list!
  useEffect(() => {
    if (['DOCTOR', 'ASHA_WORKER', 'HOSPITAL_ADMIN'].includes(user?.role)) {
      setLoadingPatients(true);
      directoryApi.getPatients()
        .then((data) => setPatients(data))
        .catch((err) => {
          console.error("Failed to fetch restricted patients list:", err);
          setPatientError("RBAC: Restricted access error");
        })
        .finally(() => setLoadingPatients(false));
    }
  }, [user]);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Welcome Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl border border-emerald-300">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">
                {t('welcome')}, {user?.full_name?.replace(' [DEMO DATA]', '')}
              </h1>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full uppercase">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center space-x-2 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.village || 'Nabha City'}, Punjab</span>
              <span>•</span>
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>+91 {user?.phone}</span>
            </p>
          </div>
        </div>

        {/* Synthetic Demo Tag */}
        {user?.is_demo && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-3.5 py-2 text-right">
          <p className="text-[11px] font-bold text-amber-900 flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('demo_badge')}</span>
          </p>
          <p className="text-[10px] text-amber-700">Account #{user?.id}</p>
        </div>
        )}
      </div>

      {/* Role-Specific View */}
      {user?.role === 'PATIENT' && (
        <div className="space-y-6">
        <AppointmentsPanel role="PATIENT" refreshKey={appointmentsKey} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Synthetic ABHA Card */}
          <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200 mb-4">
              Nabha Digital Health ID (DEMO ABHA)
            </p>
            <h3 className="text-lg font-bold">{user?.full_name?.replace(' [DEMO DATA]', '')}</h3>
            <p className="font-mono text-sm tracking-wider text-amber-300 my-2">
              {user?.patient_profile?.abha_id || 'ABHA ID not linked'}
            </p>
            <div className="grid grid-cols-2 text-xs text-emerald-100 gap-2 mt-4 pt-3 border-t border-emerald-700">
              <div>
                <span className="text-[10px] text-emerald-300 block">ਉਮਰ / ਲਿੰਗ:</span>
                <span>{[user?.patient_profile?.age != null && `${user.patient_profile.age} Yrs`, user?.patient_profile?.gender].filter(Boolean).join(' • ') || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-300 block">ਬਲੱਡ ਗਰੁੱਪ:</span>
                <span className="font-bold text-white">{user?.patient_profile?.blood_group || '—'}</span>
              </div>
            </div>
          </div>

          {/* Health Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>ਸਿਹਤ ਜਾਣਕਾਰੀ (Health Records)</span>
            </h3>
            <div className="text-xs text-slate-600 space-y-2">
              <p>
                <strong>ਪੁਰਾਣੀ ਬਿਮਾਰੀ (Chronic):</strong>{' '}
                <span className="text-slate-800">{user?.patient_profile?.chronic_conditions || 'None reported'}</span>
              </p>
              <p>
                <strong>ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ:</strong>{' '}
                <span className="text-slate-800">{user?.patient_profile?.emergency_contact || 'Not added'}</span>
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button type="button" disabled className="flex-1 border border-dashed border-slate-300 text-slate-400 text-xs font-semibold py-2 rounded-lg cursor-not-allowed">
                ਪਰਚੀਆਂ (Prescriptions) · Soon
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>ਤੁਰੰਤ ਸੇਵਾਵਾਂ (Quick Actions)</span>
            </h3>
            <div className="space-y-2">
              <button type="button" onClick={() => setBooking(true)} className="w-full min-h-11 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold px-3 rounded-xl text-xs flex items-center justify-between transition-[background-color,transform]">
                <span>ਡਾਕਟਰ ਨਾਲ ਮੁਲਾਕਾਤ ਬੁੱਕ ਕਰੋ</span>
                <span>→</span>
              </button>
              <a href="#find-medicine" className="w-full min-h-11 border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold px-3 rounded-xl text-xs flex items-center justify-between transition-colors">
                <span>ਨੇੜਲੇ ਮੈਡੀਕਲ ਸਟੋਰ 'ਤੇ ਦਵਾਈ ਲੱਭੋ</span>
                <span>→</span>
              </a>
              <button type="button" disabled className="w-full min-h-11 border border-dashed border-slate-300 text-slate-400 font-semibold px-3 rounded-xl text-xs flex items-center justify-between cursor-not-allowed">
                <span>AI ਲੱਛਣ ਜਾਂਚ (Symptom checker)</span>
                <span className="text-[10px] uppercase tracking-wider">Soon</span>
              </button>
            </div>
          </div>
        </div>
        {booking && (
          <BookAppointmentForm
            onCancel={() => setBooking(false)}
            onBooked={() => { setBooking(false); setAppointmentsKey((k) => k + 1); }}
          />
        )}
        <div id="find-medicine" className="scroll-mt-28"><MedicineSearch /></div>
        </div>
      )}

      {user?.role === 'DOCTOR' && (
        <div className="space-y-6">
          <AppointmentsPanel role="DOCTOR" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
              <span className="text-xs text-slate-400 uppercase font-semibold">ਵਿਸ਼ੇਸ਼ਤਾ (Specialization)</span>
              <h3 className="text-lg font-bold text-slate-900">{user?.doctor_profile?.specialization}</h3>
              <p className="text-xs text-slate-500">{user?.doctor_profile?.hospital_name}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
              <span className="text-xs text-slate-400 uppercase font-semibold">ਲਾਇਸੈਂਸ & ਤਜਰਬਾ</span>
              <h3 className="text-lg font-bold text-slate-900">{user?.doctor_profile?.experience_years} ਸਾਲ ਦਾ ਤਜਰਬਾ</h3>
              <p className="text-xs font-mono text-emerald-700">Reg: {user?.doctor_profile?.license_number}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
              <span className="text-xs text-slate-400 uppercase font-semibold">ਸਲਾਹ ਫੀਸ (Fee)</span>
              <h3 className="text-lg font-bold text-slate-900">
                {user?.doctor_profile?.consultation_fee === 0 ? 'ਮੁਫ਼ਤ (ਸਰਕਾਰੀ)' : `₹${user?.doctor_profile?.consultation_fee}`}
              </h3>
              <p className="text-xs text-emerald-600 font-semibold">ਲਾਈਵ ਓ.ਪੀ.ਡੀ ਸੇਵਾ ਉਪਲਬਧ</p>
            </div>
          </div>

          {/* Patient Directory (RBAC Protected Data) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>ਰਜਿਸਟਰਡ ਮਰੀਜ਼ਾਂ ਦੀ ਸੂਚੀ (RBAC Protected: {patients.length})</span>
              </h3>
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                Doctor Authorized Access
              </span>
            </div>

            {loadingPatients ? (
              <p className="text-xs text-slate-400 py-4">ਮਰੀਜ਼ਾਂ ਦਾ ਡਾਟਾ ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...</p>
            ) : patientError ? (
              <p className="text-xs text-red-600 py-4">{patientError}</p>
            ) : patients.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">ਕੋਈ ਮਰੀਜ਼ ਰਜਿਸਟਰਡ ਨਹੀਂ। ਹੋਮ ਪੇਜ 'ਤੇ ਡੈਮੋ ਡਾਟਾ ਸੀਡ ਕਰੋ।</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {patients.map((pt) => (
                  <div key={pt.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{pt.full_name}</p>
                      <p className="text-slate-500">
                        ਪਿੰਡ: {pt.village} • ਮੋਬਾਈਲ: {pt.phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded">
                        ਬਲੱਡ: {pt.patient_profile?.blood_group || 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {user?.role === 'PHARMACY' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Pill className="w-4 h-4 text-teal-600" />
              <span>ਫਾਰਮੇਸੀ ਪ੍ਰੋਫਾਈਲ ਵੇਰਵਾ</span>
            </h3>
            <div className="text-xs text-slate-600 space-y-2">
              <p>
                <strong>ਦੁਕਾਨ ਦਾ ਨਾਮ:</strong> {user?.pharmacy_profile?.pharmacy_name || user?.full_name}
              </p>
              <p>
                <strong>ਪਤਾ:</strong> {user?.pharmacy_profile?.address}
              </p>
              <p>
                <strong>ਖੁੱਲ੍ਹਣ ਦਾ ਸਮਾਂ:</strong> {user?.pharmacy_profile?.operating_hours}
              </p>
              <p>
                <strong>ਲਾਇਸੈਂਸ ਨੰਬਰ:</strong> {user?.pharmacy_profile?.license_number}
              </p>
            </div>
          </div>

          <div className="md:col-span-2"><PharmacyStock /></div>
        </div>
      )}

      {user?.role === 'HOSPITAL_ADMIN' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Hospital className="w-4 h-4 text-emerald-600" />
            <span>ਹਸਪਤਾਲ ਪ੍ਰਬੰਧਨ ({user?.hospital_profile?.hospital_name || 'Hospital'} • Bed Status)</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl text-center">
              <p className="text-xs text-slate-500">ਕੁੱਲ ਬਿਸਤਰੇ</p>
              <p className="text-2xl font-bold text-slate-900">{user?.hospital_profile?.total_beds ?? '—'}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl text-center">
              <p className="text-xs text-emerald-700">ਉਪਲਬਧ ਬਿਸਤਰੇ</p>
              <p className="text-2xl font-bold text-emerald-800">{user?.hospital_profile?.available_beds ?? '—'}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl text-center">
              <p className="text-xs text-slate-500">ਆਕਸੀਜਨ ਸੁਵਿਧਾ</p>
              <p className="text-2xl font-bold text-slate-900">{user?.hospital_profile?.has_oxygen ? 'ਹਾਂ' : 'ਨਹੀਂ'}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl text-center">
              <p className="text-xs text-slate-500">ਐਮਰਜੈਂਸੀ ਓ.ਪੀ.ਡੀ</p>
              <p className="text-2xl font-bold text-slate-900">{user?.hospital_profile?.has_emergency ? '24x7' : 'ਨਹੀਂ'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

